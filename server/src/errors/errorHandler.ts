import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { ERROR_MESSAGES } from './errorMessages'
import { AppError } from './errorTypes'

// Converts any error to a standardized response format
export function formatErrorResponse(error: Error | AppError) {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details !== undefined ? error.details : null,
      },
    }
  }
  // For generic errors, return a general error response
  return {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      details: null,
    },
  }
}

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Log the error
  console.error(`Error processing request: ${request.method} ${request.url}`)
  console.error(error)
  // Use AppError status code if available, otherwise 500
  const statusCode =
    error instanceof AppError && error.statusCode ? error.statusCode : 500
  // Format the error response to always match Zod schema
  const errorResponse = formatErrorResponse(error)
  // Send the response
  reply.status(statusCode).send(errorResponse)
}
