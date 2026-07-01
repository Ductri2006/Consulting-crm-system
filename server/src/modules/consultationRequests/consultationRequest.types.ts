import type { z } from "zod";

import type {
  consultationRequestListQuerySchema,
  createConsultationRequestSchema,
  updateConsultationRequestStatusSchema,
} from "./consultationRequest.validation";

export type CreateConsultationRequestInput = z.infer<
  typeof createConsultationRequestSchema
>;

export type ConsultationRequestListQuery = z.infer<
  typeof consultationRequestListQuerySchema
>;

export type UpdateConsultationRequestStatusInput = z.infer<
  typeof updateConsultationRequestStatusSchema
>;
