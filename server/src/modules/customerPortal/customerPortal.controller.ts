import type { NextFunction, Request, RequestHandler, Response } from "express";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { successResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import type { SafeUser } from "../../utils/sanitizeUser";
import {
  activateCustomerPortalAccount,
  createCustomerPortalAccount,
  deactivateCustomerPortalAccount,
  getPortalCaseById,
  getPortalCaseSummary,
  getCustomerPortalAccount,
  getPortalDocumentDownload,
  listPortalCases,
  listPortalDocuments,
  loginCustomerPortal,
  resetCustomerPortalPassword,
  toPortalProfile,
  uploadPortalDocument,
} from "./customerPortal.service";
import type {
  CreatePortalAccountInput,
  PortalCaseListQuery,
  PortalDocumentListQuery,
  PortalDocumentUploadInput,
  PortalLoginInput,
  ResetPortalPasswordInput,
} from "./customerPortal.types";

const getCustomerId = (params: Request["params"]): string => {
  const { id } = params;

  if (typeof id !== "string") {
    throw new TypeError("Validated customer id is missing.");
  }

  return id;
};

const getCaseId = (params: Request["params"]): string => {
  const { id } = params;

  if (typeof id !== "string") {
    throw new TypeError("Validated case id is missing.");
  }

  return id;
};

const getDocumentId = (params: Request["params"]): string => {
  const { id } = params;

  if (typeof id !== "string") {
    throw new TypeError("Validated document id is missing.");
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

const getPortalSession = (request: Request) => {
  if (!request.customerPortal) {
    throw new AppError(
      "Authentication is required.",
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  return request.customerPortal;
};

export const getCustomerPortalAccountController = asyncHandler(
  async (request, response): Promise<void> => {
    const actor = getActor(request);
    const account = await getCustomerPortalAccount(
      getCustomerId(request.params),
      actor.organizationId,
    );

    response.status(HTTP_STATUS.OK).json(
      successResponse("Customer portal account retrieved successfully.", {
        account,
      }),
    );
  },
);

export const createCustomerPortalAccountController = asyncHandler(
  async (request, response): Promise<void> => {
    const actor = getActor(request);
    const result = await createCustomerPortalAccount(
      getCustomerId(request.params),
      request.body as CreatePortalAccountInput,
      actor.id,
      actor.organizationId,
    );

    response
      .status(HTTP_STATUS.CREATED)
      .json(successResponse("Customer portal account created.", result));
  },
);

export const resetCustomerPortalPasswordController = asyncHandler(
  async (request, response): Promise<void> => {
    const actor = getActor(request);
    const result = await resetCustomerPortalPassword(
      getCustomerId(request.params),
      request.body as ResetPortalPasswordInput,
      actor.id,
      actor.organizationId,
    );

    response
      .status(HTTP_STATUS.OK)
      .json(successResponse("Customer portal password reset.", result));
  },
);

export const deactivateCustomerPortalAccountController = asyncHandler(
  async (request, response): Promise<void> => {
    const actor = getActor(request);
    const account = await deactivateCustomerPortalAccount(
      getCustomerId(request.params),
      actor.id,
      actor.organizationId,
    );

    response.status(HTTP_STATUS.OK).json(
      successResponse("Customer portal account deactivated.", {
        account,
      }),
    );
  },
);

export const activateCustomerPortalAccountController = asyncHandler(
  async (request, response): Promise<void> => {
    const actor = getActor(request);
    const account = await activateCustomerPortalAccount(
      getCustomerId(request.params),
      actor.id,
      actor.organizationId,
    );

    response.status(HTTP_STATUS.OK).json(
      successResponse("Customer portal account activated.", {
        account,
      }),
    );
  },
);

export const portalLoginController = asyncHandler(
  async (request, response): Promise<void> => {
    const result = await loginCustomerPortal(request.body as PortalLoginInput);

    response
      .status(HTTP_STATUS.OK)
      .json(successResponse("Portal login successful.", result));
  },
);

export const getCurrentPortalSessionController: RequestHandler = (
  request,
  response,
): void => {
  const session = getPortalSession(request);

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Current portal session retrieved successfully.", session));
};

export const getPortalProfileController: RequestHandler = (
  request,
  response,
): void => {
  const session = getPortalSession(request);

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Customer portal profile retrieved successfully.", toPortalProfile(session)));
};

export const listPortalCasesController = asyncHandler(
  async (request, response): Promise<void> => {
    const session = getPortalSession(request);
    const result = await listPortalCases(
      request.query as unknown as PortalCaseListQuery,
      session,
    );

    response
      .status(HTTP_STATUS.OK)
      .json(successResponse("Portal cases retrieved successfully.", result));
  },
);

export const getPortalCaseSummaryController = asyncHandler(
  async (request, response): Promise<void> => {
    const session = getPortalSession(request);
    const summary = await getPortalCaseSummary(session);

    response
      .status(HTTP_STATUS.OK)
      .json(successResponse("Portal case summary retrieved successfully.", summary));
  },
);

export const getPortalCaseController = asyncHandler(
  async (request, response): Promise<void> => {
    const session = getPortalSession(request);
    const caseProfile = await getPortalCaseById(
      getCaseId(request.params),
      session,
    );

    response.status(HTTP_STATUS.OK).json(
      successResponse("Portal case retrieved successfully.", {
        case: caseProfile,
      }),
    );
  },
);

export const listPortalDocumentsController = asyncHandler(
  async (request, response): Promise<void> => {
    const session = getPortalSession(request);
    const result = await listPortalDocuments(
      request.query as unknown as PortalDocumentListQuery,
      session,
    );

    response
      .status(HTTP_STATUS.OK)
      .json(successResponse("Portal documents retrieved successfully.", result));
  },
);

export const uploadPortalDocumentController = asyncHandler(
  async (request, response): Promise<void> => {
    if (!request.file) {
      throw new AppError(
        "A file is required.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const document = await uploadPortalDocument(
      request.body as PortalDocumentUploadInput,
      {
        originalName: request.file.originalname,
        mimeType: request.file.mimetype,
        size: request.file.size,
        buffer: request.file.buffer,
      },
      getPortalSession(request),
    );

    response.status(HTTP_STATUS.CREATED).json(
      successResponse("Portal document uploaded successfully.", {
        document,
      }),
    );
  },
);

export const downloadPortalDocumentController = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  const download = await getPortalDocumentDownload(
    getDocumentId(request.params),
    getPortalSession(request),
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
            ? "Document not found."
            : "The document file could not be downloaded.",
          isMissingFile
            ? HTTP_STATUS.NOT_FOUND
            : HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ),
      );
    },
  );
};

export const portalLogoutController: RequestHandler = (_request, response): void => {
  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Portal logout successful.", {}));
};
