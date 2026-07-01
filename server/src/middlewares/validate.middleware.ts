import type { Request, RequestHandler } from "express";
import { type ZodIssue, type ZodType } from "zod";

import { HTTP_STATUS } from "../constants/httpStatus";
import { AppError } from "../utils/AppError";

type RequestPart = "body" | "params" | "query";

export interface ValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

const requestParts: RequestPart[] = ["body", "params", "query"];

const toErrorDetail = (
  part: RequestPart,
  issue: ZodIssue,
): ValidationErrorDetail => ({
  field: issue.path.length > 0 ? issue.path.join(".") : part,
  message: issue.message,
});

const setValidatedPart = (
  request: Request,
  part: RequestPart,
  value: unknown,
): void => {
  if (part === "query") {
    Object.defineProperty(request, "query", {
      configurable: true,
      enumerable: true,
      value,
      writable: true,
    });
    return;
  }

  if (part === "body") {
    request.body = value;
    return;
  }

  request.params = value as Request["params"];
};

export const validate = (schemas: ValidationSchemas): RequestHandler => {
  return (request, _response, next): void => {
    const validatedParts: Partial<Record<RequestPart, unknown>> = {};
    const errors: ValidationErrorDetail[] = [];

    for (const part of requestParts) {
      const schema = schemas[part];

      if (!schema) {
        continue;
      }

      const result = schema.safeParse(request[part]);

      if (!result.success) {
        errors.push(
          ...result.error.issues.map((issue) => toErrorDetail(part, issue)),
        );
        continue;
      }

      validatedParts[part] = result.data;
    }

    if (errors.length > 0) {
      next(
        new AppError(
          "Validation failed.",
          HTTP_STATUS.BAD_REQUEST,
          errors,
        ),
      );
      return;
    }

    for (const part of requestParts) {
      if (part in validatedParts) {
        setValidatedPart(request, part, validatedParts[part]);
      }
    }

    next();
  };
};
