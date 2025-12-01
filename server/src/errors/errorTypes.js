"use strict";
// Custom error classes for different error scenarios
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseError = exports.ConflictError = exports.AuthorizationError = exports.AuthenticationError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
// Base application error class
class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(message, statusCode, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// For 400 Bad Request - input validation errors
class ValidationError extends AppError {
    constructor(message, details) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}
exports.ValidationError = ValidationError;
// For 404 Not Found - resource not found errors
class NotFoundError extends AppError {
    constructor(message) {
        super(message, 404, 'NOT_FOUND', null);
    }
}
exports.NotFoundError = NotFoundError;
// For 401 Unauthorized - authentication errors
class AuthenticationError extends AppError {
    constructor(message) {
        super(message, 401, 'AUTHENTICATION_ERROR', null);
    }
}
exports.AuthenticationError = AuthenticationError;
// For 403 Forbidden - authorization errors
class AuthorizationError extends AppError {
    constructor(message) {
        super(message, 403, 'AUTHORIZATION_ERROR', null);
    }
}
exports.AuthorizationError = AuthorizationError;
// For 409 Conflict - resource conflicts
class ConflictError extends AppError {
    constructor(message, details) {
        super(message, 409, 'CONFLICT_ERROR', details);
    }
}
exports.ConflictError = ConflictError;
// For 500 Internal Server Error - unexpected errors
class DatabaseError extends AppError {
    constructor(message, details) {
        super(message, 500, 'DATABASE_ERROR', details);
    }
}
exports.DatabaseError = DatabaseError;
