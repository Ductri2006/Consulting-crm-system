import type { Request, RequestHandler } from "express";

import { env } from "../config/env";
import { HTTP_STATUS } from "../constants/httpStatus";
import { AppError } from "../utils/AppError";

interface RateLimitOptions {
  name: string;
  windowMinutes: number;
  maxRequests: number;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const createClientKey = (request: Request, name: string): string =>
  `${name}:${request.ip || request.socket.remoteAddress || "unknown"}`;

export const createRateLimit = ({
  maxRequests,
  name,
  windowMinutes,
}: RateLimitOptions): RequestHandler => {
  const buckets = new Map<string, RateLimitBucket>();
  const windowMs = Math.max(1, windowMinutes) * 60 * 1_000;
  const limit = Math.max(1, maxRequests);

  return (request, response, next) => {
    if (!env.RATE_LIMIT_ENABLED) {
      next();
      return;
    }

    const now = Date.now();
    const key = createClientKey(request, name);
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      response.setHeader("X-RateLimit-Limit", String(limit));
      response.setHeader("X-RateLimit-Remaining", String(limit - 1));
      next();
      return;
    }

    const remaining = Math.max(0, limit - existing.count);
    response.setHeader("X-RateLimit-Limit", String(limit));
    response.setHeader("X-RateLimit-Remaining", String(remaining));
    response.setHeader("X-RateLimit-Reset", String(Math.ceil(existing.resetAt / 1_000)));

    if (existing.count >= limit) {
      response.setHeader(
        "Retry-After",
        String(Math.max(1, Math.ceil((existing.resetAt - now) / 1_000))),
      );
      next(
        new AppError(
          "Too many requests. Please try again later.",
          HTTP_STATUS.TOO_MANY_REQUESTS,
        ),
      );
      return;
    }

    existing.count += 1;
    next();
  };
};

export const authRateLimit = createRateLimit({
  name: "auth",
  windowMinutes: env.AUTH_RATE_LIMIT_WINDOW_MINUTES,
  maxRequests: env.AUTH_RATE_LIMIT_MAX,
});

export const publicRateLimit = createRateLimit({
  name: "public",
  windowMinutes: env.PUBLIC_RATE_LIMIT_WINDOW_MINUTES,
  maxRequests: env.PUBLIC_RATE_LIMIT_MAX,
});

export const uploadRateLimit = createRateLimit({
  name: "upload",
  windowMinutes: env.UPLOAD_RATE_LIMIT_WINDOW_MINUTES,
  maxRequests: env.UPLOAD_RATE_LIMIT_MAX,
});

export const downloadRateLimit = createRateLimit({
  name: "download",
  windowMinutes: env.DOWNLOAD_RATE_LIMIT_WINDOW_MINUTES,
  maxRequests: env.DOWNLOAD_RATE_LIMIT_MAX,
});

export const invitationRateLimit = createRateLimit({
  name: "invitation",
  windowMinutes: env.AUTH_RATE_LIMIT_WINDOW_MINUTES,
  maxRequests: env.AUTH_RATE_LIMIT_MAX,
});
