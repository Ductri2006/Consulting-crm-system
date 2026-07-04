import { RequestStatus } from "@prisma/client";
import { z } from "zod";

import { paginationQuerySchema } from "../../utils/pagination";

const uuidSchema = z.string().uuid("Id must be a valid UUID.");

export const createConsultationRequestSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters long.")
    .max(120, "Full name must not exceed 120 characters."),
  phone: z
    .string()
    .trim()
    .min(8, "Phone number must be at least 8 characters long.")
    .max(30, "Phone number must not exceed 30 characters."),
  email: z
    .string()
    .trim()
    .email("Email must be a valid email address.")
    .transform((email) => email.toLowerCase())
    .optional(),
  serviceId: uuidSchema.optional(),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters long.")
    .max(2_000, "Message must not exceed 2000 characters.")
    .optional(),
}).strict();

export const consultationRequestIdParamsSchema = z.object({
  id: uuidSchema,
}).strict();

export const consultationRequestListQuerySchema =
  paginationQuerySchema.extend({
    status: z.nativeEnum(RequestStatus).optional(),
    serviceId: uuidSchema.optional(),
  }).strict();

export const updateConsultationRequestStatusSchema = z.object({
  status: z.nativeEnum(RequestStatus).refine(
    (status) => status !== RequestStatus.CONVERTED,
    {
      message:
        "Status CONVERTED requires the conversion workflow and is not available in this phase.",
    },
  ),
}).strict();
