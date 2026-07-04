import { UserRole } from "@prisma/client";
import jwt, {
  JsonWebTokenError,
  type SignOptions,
} from "jsonwebtoken";
import { z } from "zod";

import { env } from "../config/env";

const ACCESS_TOKEN_ALGORITHM: SignOptions["algorithm"] = "HS256";

const internalAccessTokenPayloadSchema = z.object({
  sub: z.uuid(),
  userId: z.uuid().optional(),
  role: z.enum(UserRole),
  email: z.email(),
  organizationId: z.uuid().optional(),
  purpose: z.literal("internal").optional(),
});

const customerPortalAccessTokenPayloadSchema = z.object({
  sub: z.uuid(),
  portalAccountId: z.uuid(),
  organizationId: z.uuid(),
  customerId: z.uuid(),
  email: z.email(),
  purpose: z.literal("customer_portal"),
});

const accessTokenPayloadSchema = z.union([
  internalAccessTokenPayloadSchema,
  customerPortalAccessTokenPayloadSchema,
]);

export type InternalAccessTokenPayload = z.infer<
  typeof internalAccessTokenPayloadSchema
>;
export type CustomerPortalAccessTokenPayload = z.infer<
  typeof customerPortalAccessTokenPayloadSchema
>;
export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

const signToken = (payload: AccessTokenPayload): string => {
  const options: SignOptions = {
    algorithm: ACCESS_TOKEN_ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const signAccessToken = (
  payload: InternalAccessTokenPayload,
): string => signToken(payload);

export const signCustomerPortalAccessToken = (
  payload: CustomerPortalAccessTokenPayload,
): string => signToken(payload);

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: [ACCESS_TOKEN_ALGORITHM],
  });
  const result = accessTokenPayloadSchema.safeParse(decoded);

  if (!result.success) {
    throw new JsonWebTokenError("Invalid access token payload.");
  }

  return result.data;
};
