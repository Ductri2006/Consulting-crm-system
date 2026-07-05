import { DocumentOcrStatus } from "@prisma/client";

import { env } from "../../config/env";
import { DisabledOcrProvider } from "./providers/disabledOcr.provider";
import { MockOcrProvider } from "./providers/mockOcr.provider";
import { TesseractOcrProvider } from "./providers/tesseractOcr.provider";
import type {
  DocumentOcrInput,
  DocumentOcrProvider,
  DocumentOcrResult,
} from "./ocr.types";

const defaultOcrMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

let ocrProvider: DocumentOcrProvider | null = null;

const getOcrProvider = (): DocumentOcrProvider => {
  if (ocrProvider) {
    return ocrProvider;
  }

  ocrProvider =
    env.DOCUMENT_OCR_PROVIDER === "mock"
      ? new MockOcrProvider()
      : env.DOCUMENT_OCR_PROVIDER === "tesseract"
        ? new TesseractOcrProvider()
        : new DisabledOcrProvider();

  return ocrProvider;
};

const getEnabledMimeTypes = (): Set<string> => {
  if (!env.DOCUMENT_OCR_ENABLED_MIME_TYPES) {
    return defaultOcrMimeTypes;
  }

  return new Set(
    env.DOCUMENT_OCR_ENABLED_MIME_TYPES.split(",")
      .map((mimeType) => mimeType.trim())
      .filter(Boolean),
  );
};

const shouldAttemptOcr = ({
  mimeType,
  size,
}: DocumentOcrInput): boolean => {
  if (env.DOCUMENT_OCR_PROVIDER === "disabled") {
    return false;
  }

  if (!mimeType || !getEnabledMimeTypes().has(mimeType)) {
    return false;
  }

  if (
    size !== undefined &&
    size > env.DOCUMENT_OCR_MAX_FILE_SIZE_MB * 1024 * 1024
  ) {
    return false;
  }

  return true;
};

const toPreview = (text: string | undefined): string | undefined =>
  text?.replace(/\s+/g, " ").trim().slice(0, 500);

export const processDocumentOcr = async (
  input: DocumentOcrInput,
): Promise<DocumentOcrResult> => {
  if (!shouldAttemptOcr(input)) {
    return {
      status:
        env.DOCUMENT_OCR_PROVIDER === "disabled"
          ? DocumentOcrStatus.SKIPPED
          : DocumentOcrStatus.NOT_REQUESTED,
      processedAt: new Date(),
    };
  }

  try {
    const result = await getOcrProvider().extractText(input);
    return {
      ...result,
      textPreview: result.textPreview ?? toPreview(result.text),
    };
  } catch {
    return {
      status: DocumentOcrStatus.FAILED,
      processedAt: new Date(),
    };
  }
};
