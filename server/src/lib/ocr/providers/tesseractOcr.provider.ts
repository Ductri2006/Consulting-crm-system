import { DocumentOcrStatus } from "@prisma/client";

import type {
  DocumentOcrInput,
  DocumentOcrProvider,
  DocumentOcrResult,
} from "../ocr.types";

export class TesseractOcrProvider implements DocumentOcrProvider {
  async extractText(_input: DocumentOcrInput): Promise<DocumentOcrResult> {
    return {
      status: DocumentOcrStatus.FAILED,
      processedAt: new Date(),
    };
  }
}
