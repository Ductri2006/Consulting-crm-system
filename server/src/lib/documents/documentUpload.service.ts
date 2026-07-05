import { DocumentOcrStatus } from "@prisma/client";

import {
  scanDocumentFile,
  canDownloadScanStatus,
} from "../security/documentScanner/scanner.service";
import { processDocumentOcr } from "../ocr/ocr.service";
import {
  calculateSha256,
  createDocumentObjectKey,
  documentStorageService,
} from "../storage/storage.service";
import { buildLocalFileUrlFromObjectKey } from "../storage/providers/localStorage.provider";

export interface PrepareDocumentStorageInput {
  organizationId: string;
  documentId: string;
  fileName: string;
  mimeType?: string;
  size?: number;
  buffer: Buffer;
}

export const prepareDocumentStorage = async ({
  organizationId,
  documentId,
  fileName,
  mimeType,
  size,
  buffer,
}: PrepareDocumentStorageInput) => {
  const objectKey = createDocumentObjectKey({
    organizationId,
    documentId,
    fileName,
  });
  const storageProvider = documentStorageService.getPrismaStorageProvider();

  await documentStorageService.uploadObject({
    objectKey,
    buffer,
    contentType: mimeType,
    metadata: {
      documentId,
      organizationId,
    },
  });

  const scan = await scanDocumentFile({
    fileName,
    mimeType,
    buffer,
  });
  const ocr = canDownloadScanStatus(scan.status)
    ? await processDocumentOcr({
        fileName,
        mimeType,
        size,
        buffer,
      })
    : {
        status: DocumentOcrStatus.NOT_REQUESTED,
        processedAt: new Date(),
      };

  return {
    fileUrl:
      storageProvider === "LOCAL"
        ? buildLocalFileUrlFromObjectKey(objectKey)
        : `s3://${documentStorageService.getStorageBucket()}/${objectKey}`,
    storageProvider,
    storageKey: objectKey,
    storageBucket: documentStorageService.getStorageBucket(),
    storageRegion: documentStorageService.getStorageRegion(),
    checksumSha256: calculateSha256(buffer),
    scanStatus: scan.status,
    scanMessage: scan.message,
    scannedAt: scan.scannedAt,
    ocrStatus: ocr.status,
    ocrText: ocr.text,
    ocrTextPreview: ocr.textPreview,
    ocrProcessedAt: ocr.processedAt,
  };
};
