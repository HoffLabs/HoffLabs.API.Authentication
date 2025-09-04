import { UserSession, UserLoginHistory } from '../../interfaces/auth/user';
import { readSelect, remove } from '../../database/utils/operations';
import { decrypt } from '../../utils/crypto';

export interface SessionInfo {
  id: number;
  created_at: Date;
  session_expires_at: Date;
  refresh_expires_at: Date;
  is_current?: boolean;
}

export interface LoginHistoryInfo {
  id: number;
  login_at: Date;
  login_ip: string | null;
  user_agent: string | null;
  auth_method: string | null;
}

export const getActiveSessionsService = async (uid: string, currentSessionId?: number): Promise<SessionInfo[]> => {
  try {
    // Get all active sessions for the user
    const sessions = await readSelect<UserSession>('user_sessions', ['*'], { user_uid: uid });
    
    // Filter out expired sessions and format response
    const now = new Date();
    const activeSessions = sessions
      .filter(session => {
        const expires = new Date(session.refresh_expires_at);
        return expires > now;
      })
      .map(session => ({
        id: session.id,
        created_at: session.created_at,
        session_expires_at: session.session_expires_at,
        refresh_expires_at: session.refresh_expires_at,
        is_current: session.id === currentSessionId
      }))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime()); // Most recent first

    return activeSessions;
  } catch (error) {
    return [];
  }
};

export const revokeSessionService = async (uid: string, sessionId: number, currentSessionId?: number): Promise<boolean> => {
  try {
    // Prevent users from revoking their current session (use logout instead)
    if (sessionId === currentSessionId) {
      throw new Error('Cannot revoke current session. Use logout instead.');
    }

    // Verify the session belongs to the user
    const sessions = await readSelect<UserSession>('user_sessions', ['id', 'user_uid'], { 
      id: sessionId, 
      user_uid: uid 
    });

    if (sessions.length === 0) {
      throw new Error('Session not found or does not belong to user');
    }

    // Remove the session
    await remove('user_sessions', sessionId);
    
    return true;
  } catch (error) {
    console.error('Revoke session service error:', error);
    throw error;
  }
};

export const revokeAllOtherSessionsService = async (uid: string, currentSessionId: number): Promise<number> => {
  try {
    // Get all sessions for the user except the current one
    const sessions = await readSelect<UserSession>('user_sessions', ['id'], { user_uid: uid });
    
    const otherSessions = sessions.filter(session => session.id !== currentSessionId);
    let revokedCount = 0;

    // Remove all other sessions
    for (const session of otherSessions) {
      try {
        await remove('user_sessions', session.id);
        revokedCount++;
      } catch (error) {
        console.error(`Failed to revoke session ${session.id}:`, error);
      }
    }

    return revokedCount;
  } catch (error) {
    console.error('Revoke all other sessions service error:', error);
    throw error;
  }
};

export const getLoginHistoryService = async (uid: string, limit: number = 50): Promise<LoginHistoryInfo[]> => {
  try {
    // Try with user_uid field first (main schema)
    let history: UserLoginHistory[] = [];
    
    try {
      history = await readSelect<UserLoginHistory>('user_login_history', ['*'], { user_uid: uid });
    } catch (uidError) {
      console.warn('Failed to query with user_uid, trying user_id:', uidError);
      // If user_uid fails, try with user_id field (alternate schema)
      // First get the user's numeric ID from the uid
      const users = await readSelect<any>('users', ['id'], { uid: uid });
      if (users.length > 0) {
        history = await readSelect<UserLoginHistory>('user_login_history', ['*'], { user_id: users[0].id });
      }
    }
    
    // Sort by login_at descending and limit results
    const sortedHistory = history
      .sort((a, b) => b.login_at.getTime() - a.login_at.getTime())
      .slice(0, limit)
      .map(entry => ({
        id: entry.id,
        login_at: entry.login_at,
        login_ip: entry.login_ip ? (typeof entry.login_ip === 'string' ? entry.login_ip : null) : null,
        user_agent: entry.user_agent,
        auth_method: entry.auth_method
      }));

    return sortedHistory;
  } catch (error) {
    console.error('Get login history service error:', error);
    return [];
  }
};

export const getCurrentSessionInfo = async (sessionToken: string): Promise<SessionInfo | null> => {
  try {
    // Get all sessions and find the one matching the token
    const sessions = await readSelect<UserSession>('user_sessions', ['*']);
    
    for (const session of sessions) {
      try {
        const decryptedToken = await decrypt(session.session_token);
        if (decryptedToken === sessionToken) {
          return {
            id: session.id,
            created_at: session.created_at,
            session_expires_at: session.session_expires_at,
            refresh_expires_at: session.refresh_expires_at,
            is_current: true
          };
        }
      } catch (decryptError) {
        // Skip this session if decryption fails
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Get current session info error:', error);
    return null;
  }
};
