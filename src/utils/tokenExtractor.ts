import { FastifyRequest } from 'fastify';

interface RequestWithToken {
  Body?: { token?: string };
  Headers?: { authorization?: string };
}

/**
 * Extracts JWT token from request body or Authorization header
 * Supports both "Bearer token" and plain token formats
 */
export function extractTokenFromRequest(request: FastifyRequest<RequestWithToken>): string | null {
  // Try to get token from request body first
  let token = request.body?.token;
  
  // If not in body, check Authorization header
  if (!token && request.headers.authorization) {
    const authHeader = request.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = authHeader;
    }
  }
  
  return token || null;
}

/**
 * Standardized error response for missing token
 */
export const MISSING_TOKEN_ERROR = {
  error: 'Token is required',
  message: 'Provide token in request body or Authorization header'
};
