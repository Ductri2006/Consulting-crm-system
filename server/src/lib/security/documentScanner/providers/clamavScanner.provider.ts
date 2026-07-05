import { DocumentScanStatus } from "@prisma/client";

import { env } from "../../../../config/env";
import type {
  DocumentScannerInput,
  DocumentScannerProvider,
  DocumentScannerResult,
} from "../scanner.types";

export class ClamavScannerProvider implements DocumentScannerProvider {
  async scan(_input: DocumentScannerInput): Promise<DocumentScannerResult> {
    if (!env.CLAMAV_HOST || !env.CLAMAV_PORT) {
      return {
        status: DocumentScanStatus.FAILED,
        message: "ClamAV scanner is selected but CLAMAV_HOST or CLAMAV_PORT is not configured.",
        scannedAt: new Date(),
      };
    }

    return {
      status: DocumentScanStatus.FAILED,
      message: "ClamAV scanner integration is not available in this build.",
      scannedAt: new Date(),
    };
  }
}
