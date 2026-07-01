import type { Service } from "@prisma/client";
import type { z } from "zod";

import type { PaginationMeta } from "../../utils/pagination";
import type {
  createServiceSchema,
  serviceListQuerySchema,
  updateServiceSchema,
} from "./service.validation";

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceListQuery = z.infer<typeof serviceListQuerySchema>;

export type PublicService = Pick<
  Service,
  "id" | "name" | "slug" | "description" | "icon"
>;

export interface ServiceListResult {
  items: Service[];
  meta: PaginationMeta;
}
