import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { successResponse } from "../../utils/apiResponse";
import type { SafeUser } from "../../utils/sanitizeUser";
import { generateCaseAiSummary } from "../ai/ai.service";
import {
  assignCase,
  createCase,
  deleteCase,
  findCaseById,
  listCaseHistory,
  listCases,
  listOverdueCases,
  updateCase,
  updateCaseStatus,
} from "./case.service";
import type {
  AssignCaseInput,
  CaseHistoryQuery,
  CaseListQuery,
  CreateCaseInput,
  OverdueCaseQuery,
  UpdateCaseInput,
  UpdateCaseStatusInput,
} from "./case.types";

const getCaseId = (request: Request): string => {
  const id = request.params.id;

  if (typeof id !== "string") {
    throw new AppError("Invalid case id.", HTTP_STATUS.BAD_REQUEST);
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

export const listCasesController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const result = await listCases(
    request.query as unknown as CaseListQuery,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse("Case profiles retrieved successfully.", result),
    );
};

export const listOverdueCasesController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const result = await listOverdueCases(
    request.query as unknown as OverdueCaseQuery,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse(
        "Overdue case profiles retrieved successfully.",
        result,
      ),
    );
};

export const getCaseController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const caseProfile = await findCaseById(
    getCaseId(request),
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse("Case profile retrieved successfully.", {
        case: caseProfile,
      }),
    );
};

export const generateCaseAiSummaryController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const summary = await generateCaseAiSummary(
    getCaseId(request),
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse("AI case summary generated successfully.", {
        summary,
      }),
    );
};

export const createCaseController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const caseProfile = await createCase(
    request.body as CreateCaseInput,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.CREATED)
    .json(
      successResponse("Case profile created successfully.", {
        case: caseProfile,
      }),
    );
};

export const updateCaseController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const caseProfile = await updateCase(
    getCaseId(request),
    request.body as UpdateCaseInput,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse("Case profile updated successfully.", {
        case: caseProfile,
      }),
    );
};

export const updateCaseStatusController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const caseProfile = await updateCaseStatus(
    getCaseId(request),
    request.body as UpdateCaseStatusInput,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse("Case status updated successfully.", {
        case: caseProfile,
      }),
    );
};

export const assignCaseController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const caseProfile = await assignCase(
    getCaseId(request),
    request.body as AssignCaseInput,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse("Case assigned successfully.", {
        case: caseProfile,
      }),
    );
};

export const listCaseHistoryController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const result = await listCaseHistory(
    getCaseId(request),
    request.query as unknown as CaseHistoryQuery,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Case history retrieved successfully.", result));
};

export const deleteCaseController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const caseProfile = await deleteCase(
    getCaseId(request),
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse("Case profile deleted successfully.", {
        case: caseProfile,
      }),
    );
};
