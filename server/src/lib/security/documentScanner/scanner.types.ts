import type { DocumentScanStatus } from "@prisma/client";

export interface DocumentScannerInput {
  fileName: string;
  mimeType?: string;
  buffer: Buffer;
}

export interface DocumentScannerResult {
  status: DocumentScanStatus;
  message?: string;
  scannedAt: Date;
}

export interface DocumentScannerProvider {
  scan(input: DocumentScannerInput): Promise<DocumentScannerResult>;
}
