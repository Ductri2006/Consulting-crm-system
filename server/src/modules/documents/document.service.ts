import { randomUUID } from "node:crypto";

import {
  DocumentDownloadActorType,
  DocumentSource,
  DocumentVisibility,
  Prisma,
  UserRole,
} from "@prisma/client";

import { HTTP_STATUS } from "../../constants/httpStatus";
import {
  createDocumentDownloadHandle,
  getDocumentDownloadAvailability,
  getDocumentObjectKey,
  type DocumentDownloadActor,
} from "../../lib/documents/documentDownload.service";
import { prepareDocumentStorage } from "../../lib/documents/documentUpload.service";
import { prisma } from "../../lib/prisma";
import { documentStorageService } from "../../lib/storage/storage.service";
import { AppError } from "../../utils/AppError";
import {
  assertValidUploadFile,
  sanitizeOriginalFileName,
} from "../../utils/fileValidation";
import {
  createPaginationMeta,
  getPagination,
} from "../../utils/pagination";
import { isPrismaError } from "../../utils/prismaError";
import type { SafeUser } from "../../utils/sanitizeUser";
import type {
  DocumentDownload,
  DocumentListQuery,
  DocumentPortalVisibilityInput,
  DocumentUploadFile,
  UploadDocumentInput,
} from "./document.types";

const safeUserSelect = {
  id: true,
  organizationId: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const customerSummarySelect = {
  id: true,
  fullName: true,
  phone: true,
  email: true,
} satisfies Prisma.CustomerSelect;

const caseSummarySelect = {
  id: true,
  caseCode: true,
  title: true,
  status: true,
  assignedToId: true,
} satisfies Prisma.CaseProfileSelect;

const documentInclude = {
  customer: {
    select: customerSummarySelect,
  },
  caseProfile: {
    select: caseSummarySelect,
  },
  uploadedBy: {
    select: safeUserSelect,
  },
  uploadedByPortalAccount: {
    select: {
      id: true,
      email: true,
      customer: {
        select: customerSummarySelect,
      },
    },
  },
  portalVisibilityUpdatedBy: {
    select: safeUserSelect,
  },
} satisfies Prisma.DocumentInclude;

type DocumentWithRelations = Prisma.DocumentGetPayload<{
  include: typeof documentInclude;
}>;

type DocumentAccessRecord = {
  uploadedById: string | null;
  source: DocumentSource;
  caseProfile: {
    assignedToId: string | null;
  } | null;
};

const toSafeDocumentResponse = (document: DocumentWithRelations) => {
  const {
    fileUrl: _fileUrl,
    storageKey: _storageKey,
    storageBucket: _storageBucket,
    storageRegion: _storageRegion,
    checksumSha256: _checksumSha256,
    ocrText: _ocrText,
    ...safeDocument
  } = document;
  const availability = getDocumentDownloadAvailability(document);

  return {
    ...safeDocument,
    ...availability,
  };
};

const assertCrmActor = (actor: SafeUser): void => {
  if (
    actor.role !== UserRole.ADMIN &&
    actor.role !== UserRole.MANAGER &&
    actor.role !== UserRole.STAFF
  ) {
    throw new AppError(
      "You do not have permission to access documents.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
};

const assertDocumentReadAccess = (
  document: DocumentAccessRecord,
  actor: SafeUser,
): void => {
  assertCrmActor(actor);

  if (
    actor.role === UserRole.STAFF &&
    document.uploadedById !== actor.id &&
    document.source !== DocumentSource.CUSTOMER_PORTAL &&
    document.caseProfile?.assignedToId !== actor.id
  ) {
    throw new AppError(
      "You do not have permission to access this document.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
};

const assertDocumentDeleteAccess = (
  document: DocumentAccessRecord,
  actor: SafeUser,
): void => {
  assertCrmActor(actor);

  if (actor.role !== UserRole.STAFF) {
    return;
  }

  if (document.uploadedById !== actor.id) {
    throw new AppError(
      "Staff members can only delete documents they uploaded.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const assignedToId = document.caseProfile?.assignedToId;

  if (assignedToId && assignedToId !== actor.id) {
    throw new AppError(
      "A document attached to another staff member's case cannot be deleted.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
};

const throwDocumentPersistenceError = (error: unknown): never => {
  if (error instanceof AppError) {
    throw error;
  }

  if (isPrismaError(error, "P2025")) {
    throw new AppError("Document not found.", HTTP_STATUS.NOT_FOUND);
  }

  if (isPrismaError(error, "P2003")) {
    throw new AppError(
      "The related customer, case profile, or uploader is no longer available.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  throw error;
};

export const listDocuments = async (
  query: DocumentListQuery,
  actor: SafeUser,
) => {
  assertCrmActor(actor);

  const {
    page,
    limit,
    search,
    fileType,
    storageProvider,
    scanStatus,
    ocrStatus,
    customerId,
    caseProfileId,
    uploadedById,
  } = query;
  const scopedFilters: Prisma.DocumentWhereInput[] = [];

  if (actor.role === UserRole.STAFF) {
    scopedFilters.push({
      OR: [
        { uploadedById: actor.id },
        { source: DocumentSource.CUSTOMER_PORTAL },
        {
          caseProfile: {
            is: {
              assignedToId: actor.id,
            },
          },
        },
      ],
    });
  }

  if (search) {
    scopedFilters.push({
      OR: [
        {
          fileName: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          customer: {
            is: {
              fullName: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        },
        {
          caseProfile: {
            is: {
              caseCode: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        },
        {
          caseProfile: {
            is: {
              title: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        },
      ],
    });
  }

  const where: Prisma.DocumentWhereInput = {
    organizationId: actor.organizationId,
    ...(fileType && { fileType }),
    ...(storageProvider && { storageProvider }),
    ...(scanStatus && { scanStatus }),
    ...(ocrStatus && { ocrStatus }),
    ...(customerId && { customerId }),
    ...(caseProfileId && { caseProfileId }),
    ...(uploadedById && { uploadedById }),
    ...(scopedFilters.length > 0 && { AND: scopedFilters }),
  };
  const pagination = getPagination(page, limit);
  const [items, total] = await prisma.$transaction([
    prisma.document.findMany({
      where,
      ...pagination,
      include: documentInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
    prisma.document.count({ where }),
  ]);

  return {
    items: items.map(toSafeDocumentResponse),
    meta: createPaginationMeta(page, limit, total),
  };
};

export const findDocumentById = async (
  id: string,
  actor: SafeUser,
) => {
  const document = await prisma.document.findFirst({
    where: {
      id,
      organizationId: actor.organizationId,
    },
    include: documentInclude,
  });

  if (!document) {
    throw new AppError("Document not found.", HTTP_STATUS.NOT_FOUND);
  }

  assertDocumentReadAccess(document, actor);

  return toSafeDocumentResponse(document);
};

export const uploadDocument = async (
  input: UploadDocumentInput,
  file: DocumentUploadFile,
  actor: SafeUser,
) => {
  assertCrmActor(actor);
  assertValidUploadFile({
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    buffer: file.buffer,
  });

  const [customer, caseProfile] = await Promise.all([
    input.customerId
      ? prisma.customer.findFirst({
          where: {
            id: input.customerId,
            organizationId: actor.organizationId,
          },
          select: { id: true },
        })
      : Promise.resolve(null),
    input.caseProfileId
      ? prisma.caseProfile.findFirst({
          where: {
            id: input.caseProfileId,
            organizationId: actor.organizationId,
          },
          select: {
            id: true,
            customerId: true,
            assignedToId: true,
          },
        })
      : Promise.resolve(null),
  ]);

  if (input.customerId && !customer) {
    throw new AppError("Customer not found.", HTTP_STATUS.NOT_FOUND);
  }

  if (input.caseProfileId && !caseProfile) {
    throw new AppError(
      "Case profile not found.",
      HTTP_STATUS.NOT_FOUND,
    );
  }

  if (
    input.customerId &&
    caseProfile &&
    caseProfile.customerId !== input.customerId
  ) {
    throw new AppError(
      "The selected case profile does not belong to the document customer.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (
    actor.role === UserRole.STAFF &&
    caseProfile &&
    caseProfile.assignedToId !== actor.id
  ) {
    throw new AppError(
      "Staff members can only upload documents to case profiles assigned to themselves.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const customerId = input.customerId ?? caseProfile?.customerId;

  if (!customerId) {
    throw new AppError(
      "At least one customer id or case profile id must be provided.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const documentId = randomUUID();
  const fileName = sanitizeOriginalFileName(file.originalName);
  const storedDocument = await prepareDocumentStorage({
    organizationId: actor.organizationId,
    documentId,
    fileName,
    mimeType: file.mimeType,
    size: file.size,
    buffer: file.buffer,
  });

  try {
    const document = await prisma.document.create({
      data: {
        id: documentId,
        organizationId: actor.organizationId,
        customerId,
        caseProfileId: input.caseProfileId,
        uploadedById: actor.id,
        fileName,
        fileUrl: storedDocument.fileUrl,
        fileType: input.fileType,
        source: DocumentSource.INTERNAL,
        visibility: DocumentVisibility.INTERNAL_ONLY,
        storageProvider: storedDocument.storageProvider,
        storageKey: storedDocument.storageKey,
        storageBucket: storedDocument.storageBucket,
        storageRegion: storedDocument.storageRegion,
        checksumSha256: storedDocument.checksumSha256,
        scanStatus: storedDocument.scanStatus,
        scanMessage: storedDocument.scanMessage,
        scannedAt: storedDocument.scannedAt,
        ocrStatus: storedDocument.ocrStatus,
        ocrText: storedDocument.ocrText,
        ocrTextPreview: storedDocument.ocrTextPreview,
        ocrProcessedAt: storedDocument.ocrProcessedAt,
        mimeType: file.mimeType,
        size: file.size,
      },
      include: documentInclude,
    });

    return toSafeDocumentResponse(document);
  } catch (error) {
    await documentStorageService
      .deleteObject({ objectKey: storedDocument.storageKey })
      .catch(() => false);
    return throwDocumentPersistenceError(error);
  }
};

export const deleteDocument = async (
  id: string,
  actor: SafeUser,
) => {
  try {
    const deletedDocument = await prisma.$transaction(
      async (transaction) => {
        const document = await transaction.document.findFirst({
          where: {
            id,
            organizationId: actor.organizationId,
          },
          include: documentInclude,
        });

        if (!document) {
          throw new AppError(
            "Document not found.",
            HTTP_STATUS.NOT_FOUND,
          );
        }

        assertDocumentDeleteAccess(document, actor);

        return transaction.document.delete({
          where: { id },
          include: documentInclude,
        });
      },
    );

    const objectKey = getDocumentObjectKey(deletedDocument);

    try {
      if (objectKey) {
        await documentStorageService.deleteObject({ objectKey });
      }
    } catch {
      console.warn(
        "Document metadata was deleted, but its stored object could not be removed.",
      );
    }

    return toSafeDocumentResponse(deletedDocument);
  } catch (error) {
    return throwDocumentPersistenceError(error);
  }
};

export const getDocumentDownload = async (
  id: string,
  actor: SafeUser,
  downloadActor: Omit<DocumentDownloadActor, "actorType" | "actorUserId">,
): Promise<DocumentDownload> => {
  const document = await prisma.document.findFirst({
    where: {
      id,
      organizationId: actor.organizationId,
    },
    include: documentInclude,
  });

  if (!document) {
    throw new AppError("Document not found.", HTTP_STATUS.NOT_FOUND);
  }

  assertDocumentReadAccess(document, actor);

  return createDocumentDownloadHandle(document, {
    ...downloadActor,
    actorType: DocumentDownloadActorType.INTERNAL_USER,
    actorUserId: actor.id,
  });
};

export const setDocumentPortalVisibility = async (
  id: string,
  input: DocumentPortalVisibilityInput,
  actor: SafeUser,
) => {
  assertCrmActor(actor);

  if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.MANAGER) {
    throw new AppError(
      "Only administrators and managers can update portal document visibility.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  try {
    return await prisma.$transaction(async (transaction) => {
      const document = await transaction.document.findFirst({
        where: {
          id,
          organizationId: actor.organizationId,
        },
        select: {
          id: true,
          fileName: true,
          visibility: true,
        },
      });

      if (!document) {
        throw new AppError(
          "Document not found.",
          HTTP_STATUS.NOT_FOUND,
        );
      }

      const updatedDocument = await transaction.document.update({
        where: { id },
        data: {
          visibility: input.visibility,
          portalVisibilityUpdatedAt: new Date(),
          portalVisibilityUpdatedById: actor.id,
        },
        include: documentInclude,
      });

      await transaction.activityLog.create({
        data: {
          organizationId: actor.organizationId,
          userId: actor.id,
          action: "DOCUMENT_PORTAL_VISIBILITY_UPDATED",
          entityType: "Document",
          entityId: updatedDocument.id,
          description:
            input.visibility === DocumentVisibility.CUSTOMER_VISIBLE
              ? `Document ${document.fileName} was made visible in the customer portal.`
              : `Document ${document.fileName} was hidden from the customer portal.`,
        },
      });

      return toSafeDocumentResponse(updatedDocument);
    });
  } catch (error) {
    return throwDocumentPersistenceError(error);
  }
};
