import type { Readable } from "node:stream";

import {
  DocumentDownloadActorType,
  type DocumentScanStatus,
  Prisma,
} from "@prisma/client";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { prisma } from "../prisma";
import { AppError } from "../../utils/AppError";
import {
  getBlockedDownloadReason,
  canDownloadScanStatus,
} from "../security/documentScanner/scanner.service";
import { documentStorageService } from "../storage/storage.service";
import { getLegacyLocalObjectKeyFromFileUrl } from "../storage/providers/localStorage.provider";

export type DocumentDownloadUnavailableReason =
  | "SCAN_PENDING"
  | "SCAN_FAILED"
  | "SCAN_INFECTED"
  | "FILE_UNAVAILABLE"
  | "STORAGE_UNAVAILABLE"
  | "DOWNLOAD_BLOCKED";

export interface DocumentDownloadAvailability {
  downloadAvailable: boolean;
  downloadUnavailableReason: DocumentDownloadUnavailableReason | null;
}

export interface DocumentDownloadRecord {
  id: string;
  organizationId: string;
  customerId: string | null;
  caseProfileId: string | null;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  size: number | null;
  storageKey: string | null;
  scanStatus: DocumentScanStatus;
}

export interface DocumentDownloadActor {
  actorType: DocumentDownloadActorType;
  actorUserId?: string | null;
  actorPortalAccountId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface DocumentDownloadHandle {
  fileName: string;
  contentType: string | null;
  contentLength: number | null;
  stream: Readable;
  finalizeSuccess: () => Promise<void>;
}

export const getDocumentObjectKey = (
  document: Pick<DocumentDownloadRecord, "storageKey" | "fileUrl">,
): string | null =>
  document.storageKey ??
  getLegacyLocalObjectKeyFromFileUrl(document.fileUrl);

export const getDocumentDownloadAvailability = (
  document: Pick<DocumentDownloadRecord, "scanStatus">,
): DocumentDownloadAvailability => {
  const blockedReason = getBlockedDownloadReason(document.scanStatus);

  return {
    downloadAvailable: canDownloadScanStatus(document.scanStatus),
    downloadUnavailableReason: blockedReason as DocumentDownloadUnavailableReason | null,
  };
};

export const assertDocumentDownloadAllowed = (
  document: Pick<DocumentDownloadRecord, "scanStatus">,
): void => {
  if (canDownloadScanStatus(document.scanStatus)) {
    return;
  }

  throw new AppError(
    "Document download is not available.",
    HTTP_STATUS.CONFLICT,
  );
};

const recordSuccessfulDownload = async (
  document: DocumentDownloadRecord,
  actor: DocumentDownloadActor,
): Promise<void> => {
  const downloadedAt = new Date();

  await prisma.$transaction([
    prisma.document.update({
      where: { id: document.id },
      data: {
        lastDownloadedAt: downloadedAt,
        downloadCount: {
          increment: 1,
        },
      },
    }),
    prisma.documentDownloadAudit.create({
      data: {
        organizationId: document.organizationId,
        documentId: document.id,
        actorType: actor.actorType,
        actorUserId:
          actor.actorType === DocumentDownloadActorType.INTERNAL_USER
            ? actor.actorUserId
            : null,
        actorPortalAccountId:
          actor.actorType === DocumentDownloadActorType.CUSTOMER_PORTAL
            ? actor.actorPortalAccountId
            : null,
        customerId: document.customerId,
        caseProfileId: document.caseProfileId,
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      },
    }),
  ]);
};

export const createDocumentDownloadHandle = async (
  document: DocumentDownloadRecord,
  actor: DocumentDownloadActor,
): Promise<DocumentDownloadHandle> => {
  assertDocumentDownloadAllowed(document);

  const objectKey = getDocumentObjectKey(document);

  if (!objectKey) {
    throw new AppError("Document not found.", HTTP_STATUS.NOT_FOUND);
  }

  const exists = await documentStorageService.objectExists({ objectKey });

  if (!exists) {
    throw new AppError("Document not found.", HTTP_STATUS.NOT_FOUND);
  }

  try {
    const download = await documentStorageService.getDownloadStream({
      objectKey,
    });

    return {
      fileName: document.fileName,
      contentType: download.contentType ?? document.mimeType,
      contentLength: download.contentLength ?? document.size,
      stream: download.stream,
      finalizeSuccess: () => recordSuccessfulDownload(document, actor),
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof AppError
    ) {
      throw error;
    }

    throw new AppError(
      "The document file could not be downloaded.",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};
