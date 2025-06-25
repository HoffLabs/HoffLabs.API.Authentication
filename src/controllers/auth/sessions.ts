import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJWT } from '../../utils/jwt';
import { extractTokenFromRequest, MISSING_TOKEN_ERROR } from '../../utils/tokenExtractor';
import { 
  getActiveSessionsService,
  revokeSessionService,
  revokeAllOtherSessionsService,
  getLoginHistoryService,
  getCurrentSessionInfo
} from '../../services/auth/sessions';

interface TokenRequest {
  Headers?: { authorization?: string };
}

interface SessionRevokeRequest {
  Params: { id: string };
  Headers?: { authorization?: string };
}

interface LoginHistoryRequest {
  Querystring?: { limit?: string };
  Headers?: { authorization?: string };
}

export const getActiveSessions = async (
  request: FastifyRequest<TokenRequest>, 
  reply: FastifyReply
) => {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return reply.status(400).send(MISSING_TOKEN_ERROR);
    }

    // Extract UID from JWT
    const decoded = verifyJWT(token);
    const uid = decoded.sub;

    if (!uid) {
      return reply.status(401).send({
        error: 'Invalid token',
        message: 'Token does not contain valid user information'
      });
    }

    // Get current session info to mark it
    const currentSession = await getCurrentSessionInfo(token);
    const currentSessionId = currentSession?.id;

    const sessions = await getActiveSessionsService(uid, currentSessionId);

    reply.send({
      success: true,
      sessions: sessions,
      total_sessions: sessions.length
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get sessions';
    
    reply.status(500).send({
      error: 'Session retrieval failed',
      message: errorMessage
    });
  }
};

export const revokeSession = async (
  request: FastifyRequest<SessionRevokeRequest>, 
  reply: FastifyReply
) => {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return reply.status(400).send(MISSING_TOKEN_ERROR);
    }

    // Extract UID from JWT
    const decoded = verifyJWT(token);
    const uid = decoded.sub;

    if (!uid) {
      return reply.status(401).send({
        error: 'Invalid token',
        message: 'Token does not contain valid user information'
      });
    }

    const sessionId = parseInt(request.params.id);
    if (isNaN(sessionId)) {
      return reply.status(400).send({
        error: 'Invalid session ID',
        message: 'Session ID must be a valid number'
      });
    }

    // Get current session info to prevent self-revocation
    const currentSession = await getCurrentSessionInfo(token);
    const currentSessionId = currentSession?.id;

    const success = await revokeSessionService(uid, sessionId, currentSessionId);

    if (success) {
      reply.send({
        success: true,
        message: 'Session revoked successfully'
      });
    } else {
      reply.status(500).send({
        error: 'Session revocation failed',
        message: 'Failed to revoke session'
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to revoke session';
    
    if (errorMessage.includes('current session')) {
      return reply.status(400).send({
        error: 'Invalid operation',
        message: errorMessage
      });
    }

    if (errorMessage.includes('not found')) {
      return reply.status(404).send({
        error: 'Session not found',
        message: errorMessage
      });
    }

    reply.status(500).send({
      error: 'Session revocation failed',
      message: errorMessage
    });
  }
};

export const revokeAllOtherSessions = async (
  request: FastifyRequest<TokenRequest>, 
  reply: FastifyReply
) => {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return reply.status(400).send(MISSING_TOKEN_ERROR);
    }

    // Extract UID from JWT
    const decoded = verifyJWT(token);
    const uid = decoded.sub;

    if (!uid) {
      return reply.status(401).send({
        error: 'Invalid token',
        message: 'Token does not contain valid user information'
      });
    }

    // Get current session info
    const currentSession = await getCurrentSessionInfo(token);
    if (!currentSession) {
      return reply.status(401).send({
        error: 'Current session not found',
        message: 'Could not identify current session'
      });
    }

    const revokedCount = await revokeAllOtherSessionsService(uid, currentSession.id);

    reply.send({
      success: true,
      message: `Successfully revoked ${revokedCount} other session(s)`,
      revoked_count: revokedCount
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to revoke sessions';
    
    reply.status(500).send({
      error: 'Session revocation failed',
      message: errorMessage
    });
  }
};

export const getLoginHistory = async (
  request: FastifyRequest<LoginHistoryRequest>, 
  reply: FastifyReply
) => {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return reply.status(400).send(MISSING_TOKEN_ERROR);
    }

    // Extract UID from JWT
    const decoded = verifyJWT(token);
    const uid = decoded.sub;

    if (!uid) {
      return reply.status(401).send({
        error: 'Invalid token',
        message: 'Token does not contain valid user information'
      });
    }

    // Parse limit parameter
    const limit = request.query?.limit ? parseInt(request.query.limit) : 50;
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return reply.status(400).send({
        error: 'Invalid limit',
        message: 'Limit must be a number between 1 and 100'
      });
    }

    const history = await getLoginHistoryService(uid, limit);

    reply.send({
      success: true,
      login_history: history,
      total_entries: history.length,
      limit_applied: limit
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get login history';
    
    reply.status(500).send({
      error: 'Login history retrieval failed',
      message: errorMessage
    });
  }
};
