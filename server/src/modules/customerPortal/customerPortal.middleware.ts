import type { RequestHandler } from "express";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyAccessToken } from "../../utils/jwt";
import { getPortalSessionByAccountId } from "./customerPortal.service";

const bearerTokenPattern = /^Bearer\s+(\S+)$/i;

export const authenticateCustomerPortal: RequestHandler = asyncHandler(
  async (request, _response, next) => {
    const authorization = request.header("authorization");

    if (!authorization) {
      throw new AppError(
        "Authentication is required.",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    const match = bearerTokenPattern.exec(authorization);

    if (!match?.[1]) {
      throw new AppError(
        "Authorization header must use the Bearer token format.",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    let tokenPayload: ReturnType<typeof verifyAccessToken>;

    try {
      tokenPayload = verifyAccessToken(match[1]);
    } catch {
      throw new AppError(
        "Invalid or expired access token.",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    if (tokenPayload.purpose !== "customer_portal") {
      throw new AppError(
        "Invalid or expired access token.",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    request.customerPortal = await getPortalSessionByAccountId(
      tokenPayload.portalAccountId,
    );

    if (
      request.customerPortal.portalAccount.organizationId !==
        tokenPayload.organizationId ||
      request.customerPortal.portalAccount.customerId !==
        tokenPayload.customerId ||
      request.customerPortal.portalAccount.email !== tokenPayload.email
    ) {
      throw new AppError(
        "Invalid or expired access token.",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    next();
  },
);
