export declare class AppError extends Error {
  code: string
  statusCode: number
  details?: Record<string, unknown> | undefined
  constructor(
    message: string,
    code: string,
    statusCode?: number,
    details?: Record<string, unknown> | undefined
  )
}
export declare class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>)
}
export declare class AuthenticationError extends AppError {
  constructor(message?: string)
}
export declare class AuthorizationError extends AppError {
  constructor(message?: string)
}
export declare class NotFoundError extends AppError {
  constructor(resource?: string)
}
export declare class ConflictError extends AppError {
  constructor(message?: string)
}
export declare class RateLimitError extends AppError {
  constructor(message?: string)
}
export declare const ERROR_MESSAGES: Record<string, string>
export declare const getErrorMessage: (error: unknown) => string
export declare const isRecoverableError: (error: unknown) => boolean
//# sourceMappingURL=errors.d.ts.map
