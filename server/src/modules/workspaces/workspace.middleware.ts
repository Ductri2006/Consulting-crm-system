import type { RequestHandler } from "express";

import { env } from "../../config/env";
import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";

const SIGNUP_WINDOW_MS = 15 * 60 * 1_000;
const SIGNUP_MAX_REQUESTS = 5;

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const signupBuckets = new Map<string, RateLimitBucket>();

const getClientKey = (request: Parameters<RequestHandler>[0]): string =>
  request.ip || request.socket.remoteAddress || "unknown";

export const requireWorkspaceSignupEnabled: RequestHandler = (
  _request,
  _response,
  next,
) => {
  if (env.WORKSPACE_SIGNUP_ENABLED !== "true") {
    next(
      new AppError(
        "Workspace signup is currently disabled.",
        HTTP_STATUS.FORBIDDEN,
      ),
    );
    return;
  }

  next();
};

export const limitWorkspaceSignup: RequestHandler = (
  request,
  _response,
  next,
) => {
  const now = Date.now();
  const key = getClientKey(request);
  const existing = signupBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    signupBuckets.set(key, {
      count: 1,
      resetAt: now + SIGNUP_WINDOW_MS,
    });
    next();
    return;
  }

  if (existing.count >= SIGNUP_MAX_REQUESTS) {
    next(
      new AppError(
        "Too many workspace signup attempts. Please try again later.",
        HTTP_STATUS.TOO_MANY_REQUESTS,
      ),
    );
    return;
  }

  existing.count += 1;
  next();
};
