import { DocumentScanStatus } from "@prisma/client";

import { env } from "../../../config/env";
import { ClamavScannerProvider } from "./providers/clamavScanner.provider";
import { DisabledScannerProvider } from "./providers/disabledScanner.provider";
import { MockScannerProvider } from "./providers/mockScanner.provider";
import type {
  DocumentScannerInput,
  DocumentScannerProvider,
  DocumentScannerResult,
} from "./scanner.types";

let scannerProvider: DocumentScannerProvider | null = null;

const getScannerProvider = (): DocumentScannerProvider => {
  if (scannerProvider) {
    return scannerProvider;
  }

  scannerProvider =
    env.DOCUMENT_MALWARE_SCANNER === "mock"
      ? new MockScannerProvider()
      : env.DOCUMENT_MALWARE_SCANNER === "clamav"
        ? new ClamavScannerProvider()
        : new DisabledScannerProvider();

  return scannerProvider;
};

export const scanDocumentFile = async (
  input: DocumentScannerInput,
): Promise<DocumentScannerResult> => {
  try {
    return await getScannerProvider().scan(input);
  } catch {
    return {
      status: DocumentScanStatus.FAILED,
      message: "The document malware scan failed.",
      scannedAt: new Date(),
    };
  }
};

export const canDownloadScanStatus = (
  status: DocumentScanStatus,
): boolean => {
  if (status === DocumentScanStatus.CLEAN) {
    return true;
  }

  if (status === DocumentScanStatus.SKIPPED) {
    return env.DOCUMENT_ALLOW_DOWNLOAD_WHEN_SCAN_SKIPPED;
  }

  if (status === DocumentScanStatus.FAILED) {
    return env.DOCUMENT_ALLOW_DOWNLOAD_WHEN_SCAN_FAILED;
  }

  return false;
};

export const getBlockedDownloadReason = (
  status: DocumentScanStatus,
): string | null => {
  if (canDownloadScanStatus(status)) {
    return null;
  }

  if (status === DocumentScanStatus.PENDING) {
    return "SCAN_PENDING";
  }

  if (status === DocumentScanStatus.INFECTED) {
    return "SCAN_INFECTED";
  }

  if (status === DocumentScanStatus.FAILED) {
    return "SCAN_FAILED";
  }

  return "DOWNLOAD_BLOCKED";
};
