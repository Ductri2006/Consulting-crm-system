import type { DocumentOcrStatus } from "@prisma/client";

export interface DocumentOcrInput {
  fileName: string;
  mimeType?: string;
  size?: number;
  buffer: Buffer;
}

export interface DocumentOcrResult {
  status: DocumentOcrStatus;
  text?: string;
  textPreview?: string;
  processedAt: Date;
}

export interface DocumentOcrProvider {
  extractText(input: DocumentOcrInput): Promise<DocumentOcrResult>;
}
