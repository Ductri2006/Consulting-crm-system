import { z } from "zod";

import {
  documentPortalVisibilitySchema,
  documentIdParamsSchema,
  documentListQuerySchema,
  uploadDocumentMetadataSchema,
} from "./document.validation";

export type DocumentIdParams = z.infer<typeof documentIdParamsSchema>;
export type DocumentListQuery = z.infer<
  typeof documentListQuerySchema
>;
export type UploadDocumentInput = z.infer<
  typeof uploadDocumentMetadataSchema
>;
export type DocumentPortalVisibilityInput = z.infer<
  typeof documentPortalVisibilitySchema
>;

export interface DocumentUploadFile {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export interface DocumentDownload {
  fileName: string;
  contentType: string | null;
  contentLength: number | null;
  stream: NodeJS.ReadableStream;
  finalizeSuccess: () => Promise<void>;
}
