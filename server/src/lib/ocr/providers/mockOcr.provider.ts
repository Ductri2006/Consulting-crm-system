import { DocumentOcrStatus } from "@prisma/client";

import type {
  DocumentOcrInput,
  DocumentOcrProvider,
  DocumentOcrResult,
} from "../ocr.types";

export class MockOcrProvider implements DocumentOcrProvider {
  async extractText({
    fileName,
    mimeType,
  }: DocumentOcrInput): Promise<DocumentOcrResult> {
    const text = `Mock OCR text extracted from ${fileName} (${mimeType ?? "unknown type"}).`;

    return {
      status: DocumentOcrStatus.COMPLETED,
      text,
      textPreview: text,
      processedAt: new Date(),
    };
  }
}
