import { DocumentOcrStatus } from "@prisma/client";

import type {
  DocumentOcrInput,
  DocumentOcrProvider,
  DocumentOcrResult,
} from "../ocr.types";

export class DisabledOcrProvider implements DocumentOcrProvider {
  async extractText(_input: DocumentOcrInput): Promise<DocumentOcrResult> {
    return {
      status: DocumentOcrStatus.SKIPPED,
      processedAt: new Date(),
    };
  }
}
