"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatErrorResponse = formatErrorResponse;
exports.errorHandler = errorHandler;
const errorMessages_1 = require("./errorMessages");
const errorTypes_1 = require("./errorTypes");
// Converts any error to a standardized response format
function formatErrorResponse(error) {
    // If Custom AppError use properties
    if (error instanceof errorTypes_1.AppError) {
        return {
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: error.details || undefined,
            },
        };
    }
    // For standard errors or unknown errors
    return {
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: errorMessages_1.ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        },
    };
}
// Fastify error handler plugin
function errorHandler(app, _, done) {
    // Set up global error handler
    app.setErrorHandler((error, request, reply) => {
        // Log the error
        console.error(`Error processing request: ${request.method} ${request.url}`);
        console.error(error);
        // Determine status code - use the AppError status code if available, otherwise default to 500
        const statusCode = error instanceof errorTypes_1.AppError ? error.statusCode : 500;
        // Format the error response
        const errorResponse = formatErrorResponse(error);
        // Send the response
        reply.status(statusCode).send(errorResponse);
    });
    done();
}
