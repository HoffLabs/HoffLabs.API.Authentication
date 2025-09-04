import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJWT, decodeJWT } from '../../utils/jwt';
import { refreshTokenService, validateRefreshTokenService } from '../../services/auth/refresh';
import { validateAndExtendSession, invalidateSession, findSessionByJWT } from '../../utils/auth/sessionManagement';
import { extractTokenFromRequest, extractRefreshTokenFromRequest, MISSING_TOKEN_ERROR } from '../../utils/tokenExtractor';

interface JWTVerifyBody {
  token: string;
}

interface JWTHeaders {
  authorization?: string;
}

interface RefreshTokenBody {
  refresh_token: string;
}

export const verifyToken = async (
  request: FastifyRequest<{ Body: JWTVerifyBody; Headers: JWTHeaders }>, 
  reply: FastifyReply
) => {
  try {
    const token = extractTokenFromRequest(request);

    if (!token) {
      return reply.status(400).send(MISSING_TOKEN_ERROR);
    }

    // First verify JWT signature
    const decoded = verifyJWT(token);
    
    // Then validate against session in database and potentially extend session
    const sessionValidation = await validateAndExtendSession(token);
    
    if (!sessionValidation.valid) {
      return reply.status(401).send({
        valid: false,
        error: 'Invalid session',
        message: 'Token signature is valid but session is expired or not found in database'
      });
    }
    
    const response: any = {
      valid: true,
      message: 'Token and session are valid',
      payload: decoded,
      session_info: {
        user_uid: sessionValidation.session?.user_uid,
        session_id: sessionValidation.session?.id,
        expires_at: sessionValidation.session?.session_expires_at,
        extended: sessionValidation.extended || false
      },
      verified_at: new Date().toISOString()
    };
    
    if (sessionValidation.extended) {
      response.message = 'Token and session are valid, session was extended';
      response.session_info.message = 'Session expiry extended by 15 minutes';
    }
    
    reply.send(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Token verification failed';
    
    reply.status(401).send({
      valid: false,
      error: 'Invalid token',
      message: errorMessage
    });
  }
};

export const decodeToken = async (
  request: FastifyRequest<{ Body: JWTVerifyBody; Headers: JWTHeaders }>, 
  reply: FastifyReply
) => {
  try {
    const token = extractTokenFromRequest(request);

    if (!token) {
      return reply.status(400).send(MISSING_TOKEN_ERROR);
    }

    // Decode the token (without verification)
    const decoded = decodeJWT(token);
    
    if (!decoded) {
      return reply.status(400).send({
        error: 'Invalid token format',
        message: 'Token could not be decoded'
      });
    }

    reply.send({
      message: 'Token decoded successfully',
      payload: decoded,
      decoded_at: new Date().toISOString(),
      note: 'This endpoint only decodes the token without verification'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Token decoding failed';
    
    reply.status(400).send({
      error: 'Decoding failed',
      message: errorMessage
    });
  }
};

export const getTokenInfo = async (
  request: FastifyRequest<{ Body: JWTVerifyBody; Headers: JWTHeaders }>, 
  reply: FastifyReply
) => {
  try {
    const token = extractTokenFromRequest(request);

    if (!token) {
      return reply.status(400).send(MISSING_TOKEN_ERROR);
    }

    // Decode first to get basic info
    const decoded = decodeJWT(token);
    
    if (!decoded) {
      return reply.status(400).send({
        error: 'Invalid token format',
        message: 'Token could not be decoded'
      });
    }

    let verificationResult = null;
    let isValid = false;

    // Try to verify
    try {
      verificationResult = verifyJWT(token);
      isValid = true;
    } catch (verifyError) {
      // Token is invalid/expired but we can still show decoded info
    }

    const now = Math.floor(Date.now() / 1000);
    const issuedAt = decoded.iat ? new Date(decoded.iat * 1000) : null;
    const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : null;
    const isExpired = decoded.exp ? now > decoded.exp : false;

    reply.send({
      token_info: {
        valid: isValid,
        expired: isExpired,
        issued_at: issuedAt,
        expires_at: expiresAt,
        current_time: new Date().toISOString()
      },
      payload: decoded,
      verification_status: isValid ? 'valid' : 'invalid_or_expired'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Token analysis failed';
    
    reply.status(400).send({
      error: 'Analysis failed',
      message: errorMessage
    });
  }
};

export const refreshToken = async (
  request: FastifyRequest<{ Body: RefreshTokenBody }>, 
  reply: FastifyReply
) => {
  try {
    // Extract refresh token from HttpOnly cookie or request body (for backward compatibility)
    const refresh_token = extractRefreshTokenFromRequest(request);

    if (!refresh_token) {
      return reply.status(400).send({
        error: 'Refresh token is required',
        message: 'Refresh token is missing. Ensure you are logged in and cookies are enabled.'
      });
    }

    // Process the refresh token
    const result = await refreshTokenService(refresh_token);

    if (!result) {
      return reply.status(401).send({
        error: 'Invalid refresh token',
        message: 'Refresh token is invalid, expired, or not found'
      });
    }

    // Set secure httpOnly cookies for refreshed tokens and user data
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Access token cookie (15 minutes)
    reply.setCookie('access_token', result.jwt, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/'
    });
    
    // Refresh token cookie (7 days)
    reply.setCookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
    
    // User data cookie (non-httpOnly for frontend access)
    reply.setCookie('user_data', JSON.stringify({
      uid: result.user?.uid,
      username: result.user?.username,
      email: result.user?.email,
      email_verified: result.user?.email_verified,
      created_at: result.user?.created_at,
      first_name: result.user?.first_name,
      last_name: result.user?.last_name
    }), {
      httpOnly: false, // Frontend needs to read user data
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    });
    
    reply.send({
      success: true,
      message: 'Tokens refreshed successfully',
      user: result.user, // Include user object in response too
      refreshed_at: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
    
    reply.status(500).send({
      error: 'Refresh failed',
      message: errorMessage
    });
  }
};

export const validateRefreshToken = async (
  request: FastifyRequest<{ Body: RefreshTokenBody }>, 
  reply: FastifyReply
) => {
  try {
    // Extract refresh token from HttpOnly cookie or request body (for backward compatibility)
    const refresh_token = extractRefreshTokenFromRequest(request);

    if (!refresh_token) {
      return reply.status(400).send({
        error: 'Refresh token is required',
        message: 'Refresh token is missing. Ensure you are logged in and cookies are enabled.'
      });
    }

    // Validate the refresh token
    const isValid = await validateRefreshTokenService(refresh_token);

    reply.send({
      valid: isValid,
      message: isValid ? 'Refresh token is valid' : 'Refresh token is invalid or expired',
      validated_at: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Token validation failed';
    
    reply.status(500).send({
      error: 'Validation failed',
      message: errorMessage
    });
  }
};

export const invalidateToken = async (
  request: FastifyRequest<{ Body: JWTVerifyBody; Headers: JWTHeaders }>, 
  reply: FastifyReply
) => {
  try {
    const token = extractTokenFromRequest(request);

    if (!token) {
      return reply.status(400).send(MISSING_TOKEN_ERROR);
    }

    // First verify JWT signature
    const decoded = verifyJWT(token);
    
    // Find the session and invalidate it
    const session = await findSessionByJWT(token);
    
    if (!session) {
      return reply.status(404).send({
        error: 'Session not found',
        message: 'No active session found for this token'
      });
    }
    
    await invalidateSession(session.id);
    
    // Clear authentication cookies
    reply.clearCookie('access_token', { path: '/' });
    reply.clearCookie('refresh_token', { path: '/' });
    reply.clearCookie('user_data', { path: '/' });
    
    reply.send({
      success: true,
      message: 'Session invalidated successfully',
      session_info: {
        user_uid: session.user_uid,
        session_id: session.id
      },
      invalidated_at: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Session invalidation failed';
    
    reply.status(500).send({
      error: 'Invalidation failed',
      message: errorMessage
    });
  }
};
