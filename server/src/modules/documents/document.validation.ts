import { DocumentType, DocumentVisibility } from "@prisma/client";
import { z } from "zod";

import { paginationQuerySchema } from "../../utils/pagination";

const uuidSchema = (field: string) =>
  z.uuid(`${field} must be a valid UUID.`);

export const documentIdParamsSchema = z.object({
  id: uuidSchema("Document id"),
}).strict();

export const documentListQuerySchema = paginationQuerySchema.extend({
  fileType: z.enum(DocumentType).optional(),
  customerId: uuidSchema("Customer id").optional(),
  caseProfileId: uuidSchema("Case profile id").optional(),
  uploadedById: uuidSchema("Uploader id").optional(),
}).strict();

export const uploadDocumentMetadataSchema = z
  .object({
    customerId: uuidSchema("Customer id").optional(),
    caseProfileId: uuidSchema("Case profile id").optional(),
    fileType: z.enum(DocumentType).default(DocumentType.OTHER),
  })
  .strict()
  .refine(
    (input) =>
      input.customerId !== undefined ||
      input.caseProfileId !== undefined,
    {
      message:
        "At least one customer id or case profile id must be provided.",
    },
  );

export const documentPortalVisibilitySchema = z
  .object({
    visibility: z.enum(DocumentVisibility),
  })
  .strict();
