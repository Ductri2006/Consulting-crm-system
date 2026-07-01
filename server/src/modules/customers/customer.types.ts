import type { Customer } from "@prisma/client";
import { z } from "zod";

import type { PaginationMeta } from "../../utils/pagination";
import {
  createCustomerSchema,
  customerListQuerySchema,
  updateCustomerSchema,
} from "./customer.validation";

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;

export interface CustomerRelatedCounts {
  cases: number;
  appointments: number;
  documents: number;
}

export interface CustomerDetail extends Customer {
  relatedCounts: CustomerRelatedCounts;
}

export interface CustomerListResult {
  items: Customer[];
  meta: PaginationMeta;
}
