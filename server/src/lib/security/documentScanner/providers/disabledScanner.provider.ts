import { DocumentScanStatus } from "@prisma/client";

import type {
  DocumentScannerInput,
  DocumentScannerProvider,
  DocumentScannerResult,
} from "../scanner.types";

export class DisabledScannerProvider implements DocumentScannerProvider {
  async scan(_input: DocumentScannerInput): Promise<DocumentScannerResult> {
    return {
      status: DocumentScanStatus.SKIPPED,
      message: "Malware scanning is disabled for this environment.",
      scannedAt: new Date(),
    };
  }
}
