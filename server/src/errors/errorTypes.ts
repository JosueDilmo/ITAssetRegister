// Custom error classes for different error scenarios

// Base application error class
export class AppError extends Error {
  statusCode: number
  code: string
  details?: unknown

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: unknown
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

// For 400 Bad Request - input validation errors
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

// For 401 Unauthorized - authentication errors
export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 401, 'AUTHENTICATION_ERROR', null)
  }
}

// For 403 Forbidden - authorization errors
export class AuthorizationError extends AppError {
  constructor(message: string) {
    super(message, 403, 'AUTHORIZATION_ERROR', null)
  }
}

// For 404 Not Found - resource not found errors
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND', null)
  }
}

// For 409 Conflict - resource conflicts
export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 409, 'CONFLICT_ERROR', details)
  }
}

// For 503 Service Unavailable - an upstream dependency (e.g. Graph) failed
export class ExternalServiceError extends AppError {
  constructor(message: string) {
    super(message, 503, 'EXTERNAL_SERVICE_ERROR', null)
  }
}

// For 503 Service Unavailable - H&S SharePoint env group is not set (D-24)
export class HsNotConfiguredError extends AppError {
  constructor() {
    super(
      'H&S SharePoint access is not configured on this server.',
      503,
      'HS_NOT_CONFIGURED',
      null
    )
  }
}

// For 500 Internal Server Error - unexpected errors
export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 500, 'DATABASE_ERROR', details)
  }
}
