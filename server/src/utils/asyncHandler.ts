import type { NextFunction, Request, RequestHandler, Response } from "express";

export type AsyncRequestHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<unknown>;

export const asyncHandler = (handler: AsyncRequestHandler): RequestHandler => {
  return (request, response, next): void => {
    void handler(request, response, next).catch(next);
  };
};
