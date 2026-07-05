import { DocumentScanStatus } from "@prisma/client";

import type {
  DocumentScannerInput,
  DocumentScannerProvider,
  DocumentScannerResult,
} from "../scanner.types";

export class MockScannerProvider implements DocumentScannerProvider {
  async scan({
    fileName,
  }: DocumentScannerInput): Promise<DocumentScannerResult> {
    const normalizedFileName = fileName.toLowerCase();

    if (normalizedFileName.includes("infected")) {
      return {
        status: DocumentScanStatus.INFECTED,
        message: "Mock scanner marked this file as infected.",
        scannedAt: new Date(),
      };
    }

    if (
      normalizedFileName.includes("scan-failed") ||
      normalizedFileName.includes("scan_failed")
    ) {
      return {
        status: DocumentScanStatus.FAILED,
        message: "Mock scanner simulated a scan failure.",
        scannedAt: new Date(),
      };
    }

    return {
      status: DocumentScanStatus.CLEAN,
      message: "Mock scanner marked this file as clean.",
      scannedAt: new Date(),
    };
  }
}
