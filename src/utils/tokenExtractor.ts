import { FastifyRequest } from 'fastify';

interface RequestWithToken {
  Body?: { token?: string };
  Headers?: { authorization?: string };
}

/**
 * Extracts JWT token from HttpOnly cookies, with fallback to request body or Authorization header
 * Prioritizes secure HttpOnly cookie over less secure alternatives
 */
export function extractTokenFromRequest(request: FastifyRequest<RequestWithToken>): string | null {
  // Priority 1: Try to get token from HttpOnly cookie (most secure)
  const cookieToken = request.cookies?.access_token;
  if (cookieToken) {
    return cookieToken;
  }
  
  // Priority 2: Try to get token from request body (for backward compatibility)
  let token = request.body?.token;
  
  // Priority 3: Check Authorization header (for backward compatibility)
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
 * Extracts refresh token from HttpOnly cookie, with fallback to request body
 */
export function extractRefreshTokenFromRequest(request: FastifyRequest<any>): string | null {
  // Priority 1: Try to get refresh token from HttpOnly cookie (most secure)
  const cookieRefreshToken = request.cookies?.refresh_token;
  if (cookieRefreshToken) {
    return cookieRefreshToken;
  }
  
  // Priority 2: Try to get refresh token from request body (for backward compatibility)
  const bodyRefreshToken = request.body?.refresh_token;
  if (bodyRefreshToken) {
    return bodyRefreshToken;
  }
  
  return null;
}

/**
 * Standardized error response for missing token
 */
export const MISSING_TOKEN_ERROR = {
  error: 'Token is required',
  message: 'Authentication token is missing. Ensure you are logged in and cookies are enabled.'
};
