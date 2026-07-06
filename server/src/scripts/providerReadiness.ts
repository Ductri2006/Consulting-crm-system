import { randomUUID } from "node:crypto";
import type { Readable } from "node:stream";

import { redactSensitiveText } from "../utils/redact";

type CheckStatus = "PASS" | "WARN" | "FAIL";

interface CheckResult {
  status: CheckStatus;
  area: "config" | "storage" | "email";
  message: string;
}

type Runtime = {
  env: typeof import("../config/env.js").env;
  documentStorageService: typeof import("../lib/storage/storage.service.js").documentStorageService;
  sendEmail: typeof import("../lib/email/email.client.js").sendEmail;
};

const results: CheckResult[] = [];

const addResult = (
  status: CheckStatus,
  area: CheckResult["area"],
  message: string,
): void => {
  results.push({
    status,
    area,
    message: redactSensitiveText(message),
  });
};

const getSafeErrorMessage = (error: unknown): string =>
  redactSensitiveText(
    error instanceof Error ? error.message : "Unknown provider readiness error.",
  );

const maskEmailAddress = (email: string): string => {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return "[masked-email]";
  }

  return `${localPart.slice(0, 2)}${"*".repeat(Math.max(localPart.length - 2, 3))}@${domain}`;
};

const isDemoSender = (emailFrom: string): boolean =>
  emailFrom.toLowerCase().includes("@advisora.test");

const loadRuntime = async (): Promise<Runtime | null> => {
  try {
    const [{ env }, { documentStorageService }, { sendEmail }] =
      await Promise.all([
        import("../config/env.js"),
        import("../lib/storage/storage.service.js"),
        import("../lib/email/email.client.js"),
      ]);

    return {
      env,
      documentStorageService,
      sendEmail,
    };
  } catch (error) {
    addResult(
      "FAIL",
      "config",
      `Provider readiness could not load configuration: ${getSafeErrorMessage(error)}`,
    );
    return null;
  }
};

const readStreamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }

  return Buffer.concat(chunks);
};

const runStorageCheck = async ({
  documentStorageService,
  env,
}: Runtime): Promise<void> => {
  if (!env.PROVIDER_READINESS_STORAGE_CHECK) {
    addResult("WARN", "storage", "Storage readiness check skipped by configuration.");
    return;
  }

  if (env.DOCUMENT_STORAGE_PROVIDER === "local") {
    addResult(
      "PASS",
      "storage",
      "Document storage provider is local. No cloud storage secrets are required for this dry-run.",
    );

    if (env.PROVIDER_READINESS_MODE === "live") {
      addResult(
        "WARN",
        "storage",
        "Live storage write/read/delete skipped because DOCUMENT_STORAGE_PROVIDER is local.",
      );
    }

    return;
  }

  addResult(
    "PASS",
    "storage",
    [
      "S3-compatible storage configuration is present.",
      env.DOCUMENT_STORAGE_ENDPOINT
        ? "A custom endpoint is configured."
        : "No custom endpoint is configured.",
      `Force path style: ${String(env.DOCUMENT_STORAGE_FORCE_PATH_STYLE)}.`,
      `Signed URL TTL: ${String(env.DOCUMENT_SIGNED_URL_EXPIRES_SECONDS)} seconds.`,
    ].join(" "),
  );

  if (env.PROVIDER_READINESS_MODE === "dry-run") {
    addResult(
      "PASS",
      "storage",
      "Dry-run mode did not upload, read, sign, or delete any storage object.",
    );
    return;
  }

  if (!env.PROVIDER_READINESS_ALLOW_WRITE) {
    addResult(
      "WARN",
      "storage",
      "Live storage write/read/delete skipped because PROVIDER_READINESS_ALLOW_WRITE is not true.",
    );
    return;
  }

  const objectKey = `provider-readiness/${Date.now()}-${randomUUID()}-healthcheck.txt`;
  const body = Buffer.from(
    [
      "Advisora CRM provider readiness check.",
      "This object contains no customer data or secrets.",
      new Date().toISOString(),
    ].join("\n"),
    "utf8",
  );
  let uploaded = false;

  try {
    await documentStorageService.uploadObject({
      objectKey,
      buffer: body,
      contentType: "text/plain; charset=utf-8",
      metadata: {
        purpose: "provider-readiness",
      },
    });
    uploaded = true;

    const existsAfterUpload = await documentStorageService.objectExists({
      objectKey,
    });

    if (!existsAfterUpload) {
      addResult(
        "FAIL",
        "storage",
        "Live storage object was uploaded but could not be confirmed with an existence check.",
      );
      return;
    }

    const download = await documentStorageService.getDownloadStream({
      objectKey,
    });
    const downloaded = await readStreamToBuffer(download.stream);

    if (!downloaded.equals(body)) {
      addResult(
        "FAIL",
        "storage",
        "Live storage object download did not match the uploaded healthcheck payload.",
      );
      return;
    }

    addResult(
      "PASS",
      "storage",
      "Live storage upload, existence check, read, and content verification passed for a disposable healthcheck object.",
    );
  } catch (error) {
    addResult(
      "FAIL",
      "storage",
      `Live storage check failed: ${getSafeErrorMessage(error)}`,
    );
  } finally {
    if (uploaded) {
      try {
        await documentStorageService.deleteObject({ objectKey });
        const existsAfterDelete = await documentStorageService.objectExists({
          objectKey,
        });

        if (existsAfterDelete) {
          addResult(
            "FAIL",
            "storage",
            "Disposable live storage healthcheck object still exists after delete.",
          );
        } else {
          addResult(
            "PASS",
            "storage",
            "Disposable live storage healthcheck object was deleted.",
          );
        }
      } catch (error) {
        addResult(
          "FAIL",
          "storage",
          `Disposable live storage healthcheck object could not be deleted: ${getSafeErrorMessage(error)}`,
        );
      }
    }
  }
};

const runEmailCheck = async ({ env, sendEmail }: Runtime): Promise<void> => {
  if (!env.PROVIDER_READINESS_EMAIL_CHECK) {
    addResult("WARN", "email", "Email readiness check skipped by configuration.");
    return;
  }

  if (env.EMAIL_PROVIDER === "disabled") {
    addResult(
      "PASS",
      "email",
      "Email provider is disabled. No real email delivery will be attempted.",
    );
    return;
  }

  if (env.EMAIL_PROVIDER === "console") {
    addResult(
      "PASS",
      "email",
      "Email provider is console. No real email delivery will be attempted.",
    );
    return;
  }

  if (!env.RESEND_API_KEY) {
    addResult(
      "FAIL",
      "email",
      "EMAIL_PROVIDER is resend, but RESEND_API_KEY is not configured.",
    );
    return;
  }

  if (isDemoSender(env.EMAIL_FROM)) {
    addResult(
      "FAIL",
      "email",
      "EMAIL_PROVIDER is resend, but EMAIL_FROM still uses the demo advisora.test sender.",
    );
    return;
  }

  addResult(
    "PASS",
    "email",
    "Resend email configuration has the required API key and sender fields.",
  );

  if (env.PROVIDER_READINESS_MODE === "dry-run") {
    addResult(
      "PASS",
      "email",
      "Dry-run mode did not send a provider readiness email.",
    );
    return;
  }

  if (!env.PROVIDER_READINESS_TEST_EMAIL_TO) {
    addResult(
      "FAIL",
      "email",
      "Live email check requires PROVIDER_READINESS_TEST_EMAIL_TO.",
    );
    return;
  }

  const recipient = env.PROVIDER_READINESS_TEST_EMAIL_TO;
  const result = await sendEmail({
    to: recipient,
    subject: "Advisora CRM provider readiness check",
    html: "<p>This is a test message from provider readiness script.</p>",
    text: "This is a test message from provider readiness script.",
    replyTo: env.EMAIL_REPLY_TO,
    auditLabel: "provider-readiness",
  });

  if (result.status === "SENT") {
    addResult(
      "PASS",
      "email",
      `Live provider readiness email was sent to ${maskEmailAddress(recipient)}.`,
    );
    return;
  }

  addResult(
    "FAIL",
    "email",
    `Live provider readiness email failed with status ${result.status}: ${result.error ?? "No provider error details."}`,
  );
};

const printResults = (): void => {
  for (const result of results) {
    console.info(`[${result.status}] ${result.area}: ${result.message}`);
  }

  const failed = results.filter((result) => result.status === "FAIL").length;
  const warnings = results.filter((result) => result.status === "WARN").length;
  const passed = results.filter((result) => result.status === "PASS").length;

  console.info(
    `Provider readiness summary: ${String(passed)} PASS, ${String(warnings)} WARN, ${String(failed)} FAIL.`,
  );
};

const main = async (): Promise<void> => {
  const runtime = await loadRuntime();

  if (!runtime) {
    printResults();
    process.exitCode = 1;
    return;
  }

  addResult(
    "PASS",
    "config",
    `Provider readiness mode is ${runtime.env.PROVIDER_READINESS_MODE}.`,
  );

  await runStorageCheck(runtime);
  await runEmailCheck(runtime);
  printResults();

  if (results.some((result) => result.status === "FAIL")) {
    process.exitCode = 1;
  }
};

void main().catch((error: unknown) => {
  addResult(
    "FAIL",
    "config",
    `Provider readiness crashed: ${getSafeErrorMessage(error)}`,
  );
  printResults();
  process.exitCode = 1;
});
