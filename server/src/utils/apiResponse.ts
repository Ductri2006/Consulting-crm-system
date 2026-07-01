export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse<TError> {
  success: false;
  message: string;
  errors: TError[];
}

export const successResponse = <T>(
  message: string,
  data: T,
): ApiSuccessResponse<T> => ({
  success: true,
  message,
  data,
});

export const errorResponse = <TError = unknown>(
  message: string,
  errors: TError[] = [],
): ApiErrorResponse<TError> => ({
  success: false,
  message,
  errors,
});
