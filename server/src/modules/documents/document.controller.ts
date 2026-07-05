import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { successResponse } from "../../utils/apiResponse";
import type { SafeUser } from "../../utils/sanitizeUser";
import {
  deleteDocument,
  findDocumentById,
  getDocumentDownload,
  listDocuments,
  setDocumentPortalVisibility,
  uploadDocument,
} from "./document.service";
import type {
  DocumentPortalVisibilityInput,
  DocumentListQuery,
  UploadDocumentInput,
} from "./document.types";

const getDocumentId = (request: Request): string => {
  const id = request.params.id;

  if (typeof id !== "string") {
    throw new AppError(
      "Invalid document id.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return id;
};

const getActor = (request: Request): SafeUser => {
  if (!request.user) {
    throw new AppError(
      "Authentication is required.",
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  return request.user;
};

export const listDocumentsController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const result = await listDocuments(
    request.query as unknown as DocumentListQuery,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse("Documents retrieved successfully.", result),
    );
};

export const getDocumentController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const document = await findDocumentById(
    getDocumentId(request),
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse("Document retrieved successfully.", {
        document,
      }),
    );
};

export const uploadDocumentController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  if (!request.file) {
    throw new AppError(
      "A file is required.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const document = await uploadDocument(
    request.body as UploadDocumentInput,
    {
      originalName: request.file.originalname,
      mimeType: request.file.mimetype,
      size: request.file.size,
      buffer: request.file.buffer,
    },
    getActor(request),
  );

  response
    .status(HTTP_STATUS.CREATED)
    .json(
      successResponse("Document uploaded successfully.", {
        document,
      }),
    );
};

export const deleteDocumentController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const document = await deleteDocument(
    getDocumentId(request),
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse("Document deleted successfully.", {
        document,
      }),
    );
};

export const downloadDocumentController = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  const download = await getDocumentDownload(
    getDocumentId(request),
    getActor(request),
  );

  response.download(
    download.localPath,
    download.fileName,
    (error?: Error) => {
      if (!error) {
        return;
      }

      if (response.headersSent) {
        response.destroy();
        return;
      }

      const isMissingFile =
        "code" in error && error.code === "ENOENT";

      next(
        new AppError(
          isMissingFile
            ? "The document file was not found."
            : "The document file could not be downloaded.",
          isMissingFile
            ? HTTP_STATUS.NOT_FOUND
            : HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ),
      );
    },
  );
};

export const setDocumentPortalVisibilityController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const document = await setDocumentPortalVisibility(
    getDocumentId(request),
    request.body as DocumentPortalVisibilityInput,
    getActor(request),
  );

  response.status(HTTP_STATUS.OK).json(
    successResponse("Document portal visibility updated successfully.", {
      document,
    }),
  );
};
