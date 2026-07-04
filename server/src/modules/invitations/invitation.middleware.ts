import type { RequestHandler } from "express";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";

const ACCEPT_WINDOW_MS = 15 * 60 * 1_000;
const ACCEPT_MAX_REQUESTS = 10;

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const acceptBuckets = new Map<string, RateLimitBucket>();

const getClientKey = (request: Parameters<RequestHandler>[0]): string =>
  request.ip || request.socket.remoteAddress || "unknown";

export const limitInvitationAccept: RequestHandler = (
  request,
  _response,
  next,
) => {
  const now = Date.now();
  const key = getClientKey(request);
  const existing = acceptBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    acceptBuckets.set(key, {
      count: 1,
      resetAt: now + ACCEPT_WINDOW_MS,
    });
    next();
    return;
  }

  if (existing.count >= ACCEPT_MAX_REQUESTS) {
    next(
      new AppError(
        "Too many invitation accept attempts. Please try again later.",
        HTTP_STATUS.TOO_MANY_REQUESTS,
      ),
    );
    return;
  }

  existing.count += 1;
  next();
};
