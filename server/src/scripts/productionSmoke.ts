import dotenv from "dotenv";

dotenv.config({ quiet: true });

const requiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for production smoke checks.`);
  }

  return value;
};

const normalizeApiBaseUrl = (value: string): string =>
  value.replace(/\/+$/, "");

const apiBaseUrl = normalizeApiBaseUrl(requiredEnv("SMOKE_API_BASE_URL"));
const adminEmail = requiredEnv("SMOKE_ADMIN_EMAIL");
const adminPassword = requiredEnv("SMOKE_ADMIN_PASSWORD");
const portalWorkspaceSlug = requiredEnv("SMOKE_PORTAL_WORKSPACE_SLUG");
const portalEmail = requiredEnv("SMOKE_PORTAL_EMAIL");
const portalPassword = requiredEnv("SMOKE_PORTAL_PASSWORD");
const runRateLimitCheck = process.env.SMOKE_RATE_LIMIT_CHECK === "true";

interface JsonResponse<T> {
  response: Response;
  body: T;
}

const assertCondition = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const parseJson = async <T>(response: Response): Promise<JsonResponse<T>> => {
  const body = (await response.json()) as T;

  return { response, body };
};

const requestJson = async <T>(
  path: string,
  init?: RequestInit,
): Promise<JsonResponse<T>> => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  return parseJson<T>(response);
};

const getData = <T>(body: unknown): T => {
  const record = body as { data?: T };

  if (!record || typeof record !== "object" || !("data" in record)) {
    throw new Error("Response did not include a data object.");
  }

  return record.data as T;
};

const postLogin = async (
  path: string,
  body: Record<string, unknown>,
): Promise<string> => {
  const { response, body: payload } = await requestJson<unknown>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });

  assertCondition(response.ok, `${path} failed with ${response.status}.`);
  const data = getData<{ accessToken?: string }>(payload);
  if (typeof data.accessToken !== "string" || data.accessToken.length === 0) {
    throw new Error(`${path} did not return an access token.`);
  }

  return data.accessToken;
};

const getWithToken = async (
  path: string,
  token: string,
): Promise<Response> =>
  fetch(`${apiBaseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

const verifySecurityHeaders = (response: Response): void => {
  assertCondition(
    response.headers.get("x-powered-by") === null,
    "x-powered-by header must be disabled.",
  );
  assertCondition(
    response.headers.get("x-content-type-options") === "nosniff",
    "x-content-type-options header must be nosniff.",
  );
  assertCondition(
    response.headers.get("x-frame-options") === "DENY",
    "x-frame-options header must be DENY.",
  );
  assertCondition(
    response.headers.get("referrer-policy") === "no-referrer",
    "referrer-policy header must be no-referrer.",
  );
};

const verifyOptionalRateLimit = async (): Promise<void> => {
  if (!runRateLimitCheck) {
    console.log("- rate limit stress check: SKIPPED");
    return;
  }

  let sawTooManyRequests = false;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { response } = await requestJson<unknown>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: `smoke-invalid-${Date.now()}@example.test`,
        password: "invalid",
      }),
    });

    if (response.status === 429) {
      sawTooManyRequests = true;
      break;
    }
  }

  assertCondition(sawTooManyRequests, "Rate limit check did not return 429.");
  console.log("- rate limit stress check: PASS");
};

const main = async (): Promise<void> => {
  const health = await fetch(`${apiBaseUrl}/health`);
  assertCondition(health.ok, `Health check failed with ${health.status}.`);
  verifySecurityHeaders(health);

  const adminToken = await postLogin("/auth/login", {
    email: adminEmail,
    password: adminPassword,
  });
  const portalToken = await postLogin("/portal/auth/login", {
    workspaceSlug: portalWorkspaceSlug,
    email: portalEmail,
    password: portalPassword,
  });

  assertCondition((await getWithToken("/auth/me", adminToken)).ok, "/auth/me failed.");
  assertCondition(
    (await getWithToken("/activity?limit=1", adminToken)).ok,
    "/activity failed for internal token.",
  );
  assertCondition(
    (await getWithToken("/portal/me", portalToken)).ok,
    "/portal/me failed for portal token.",
  );
  assertCondition(
    (await getWithToken("/portal/updates?limit=1", portalToken)).ok,
    "/portal/updates failed for portal token.",
  );
  assertCondition(
    (await getWithToken("/users", portalToken)).status === 401,
    "Portal token must not access internal users.",
  );
  assertCondition(
    (await getWithToken("/portal/me", adminToken)).status === 401,
    "Internal token must not access portal APIs.",
  );

  await verifyOptionalRateLimit();

  console.log("Production smoke verification: PASS");
  console.log("- health and security headers: PASS");
  console.log("- internal auth and activity: PASS");
  console.log("- portal auth and updates: PASS");
  console.log("- token purpose separation: PASS");
};

void main().catch((error: unknown) => {
  console.error("Production smoke verification: FAIL");
  console.error(error instanceof Error ? error.message : "Unknown error.");
  process.exitCode = 1;
});
