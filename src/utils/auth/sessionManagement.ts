import { type UserSession } from '../../interfaces/auth/user';
import { create, readSelect, update } from '../../database/utils/operations';
import { encrypt, decrypt } from '../crypto';
import { verifyJWT } from '../jwt';
import { splitRefreshToken } from './authEncryption';

export async function createUserSession(uid: string, refreshToken: string, jwt: string, ip?: string, userAgent?: string): Promise<UserSession> {
  const jwtExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  const refreshExpire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days (reduced from 90 days)

  const session = await create<UserSession>('user_sessions', {
    user_uid: uid,
    session_token: await encrypt(jwt),
    refresh_token: await encrypt(refreshToken),
    session_expires_at: jwtExpire,
    refresh_expires_at: refreshExpire,
    created_at: new Date(),
  });

  return session;
}

export async function updateUserSession(sessionId: number, refreshToken: string, jwt: string): Promise<UserSession> {
  const jwtExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  const refreshExpire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  const updatedSession = await update<UserSession>('user_sessions', sessionId, {
    session_token: await encrypt(jwt),
    refresh_token: await encrypt(refreshToken),
    session_expires_at: jwtExpire,
    refresh_expires_at: refreshExpire,
  });

  return updatedSession;
}

export async function findSessionByRawRefreshToken(refreshToken: string): Promise<UserSession | null> {
  try {
    // Use the new JWT-based refresh token validation
    const { validateRefreshToken } = await import('./authEncryption');
    const tokenValidation = validateRefreshToken(refreshToken);
    
    if (!tokenValidation.valid || !tokenValidation.uid) {
      return null;
    }
    
    // Get sessions for this specific user only
    const userSessions = await readSelect<UserSession>('user_sessions', ['*'], {
      user_uid: tokenValidation.uid
    });
    
    // Find the session that matches this refresh token
    // Since refresh tokens are now JWTs, we need to match them differently
    for (const session of userSessions) {
      try {
        // Check if refresh token is not expired
        if (new Date(session.refresh_expires_at) > new Date()) {
          // For JWT-based refresh tokens, we validate the token itself
          // rather than storing and comparing the raw token
          // This is more secure as we don't store the actual token value
          const storedRefreshToken = await decrypt(session.refresh_token);
          
          // Compare the refresh tokens directly
          if (storedRefreshToken === refreshToken) {
            return session;
          }
        }
      } catch (decryptError) {
        // Skip this session if decryption fails
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding session by raw refresh token:', error);
    return null;
  }
}

export async function findSessionByJWT(jwt: string): Promise<UserSession | null> {
  try {
    // Extract UID from JWT
    const decoded = verifyJWT(jwt);
    const uid = decoded.sub;
    
    if (!uid) {
      return null;
    }
    
    // Get sessions for this specific user only
    const userSessions = await readSelect<UserSession>('user_sessions', ['*'], {
      user_uid: uid
    });
    
    // Decrypt each session token to find the match
    for (const session of userSessions) {
      try {
        const decryptedSessionToken = await decrypt(session.session_token);
        
        if (decryptedSessionToken === jwt) {
          // Check if session is not expired
          if (new Date(session.session_expires_at) > new Date()) {
            return session;
          }
        }
      } catch (decryptError) {
        // Skip this session if decryption fails
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding session by JWT:', error);
    return null;
  }
}

export async function validateAndExtendSession(jwt: string): Promise<{ valid: boolean; session?: UserSession; extended?: boolean }> {
  try {
    const session = await findSessionByJWT(jwt);
    
    if (!session) {
      return { valid: false };
    }

    // Check if session is close to expiring (within 5 minutes) and extend it
    const now = new Date();
    const sessionExpiry = new Date(session.session_expires_at);
    const timeUntilExpiry = sessionExpiry.getTime() - now.getTime();
    const fiveMinutes = 5 * 60 * 1000;

    let extended = false;
    let updatedSession = session;

    if (timeUntilExpiry <= fiveMinutes && timeUntilExpiry > 0) {
      // Extend session by 15 minutes
      const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      
      updatedSession = await update<UserSession>('user_sessions', session.id, {
        session_expires_at: newExpiresAt,
      });
      extended = true;
    }

    return {
      valid: true,
      session: updatedSession,
      extended
    };

  } catch (error) {
    console.error('Session validation error:', error);
    return { valid: false };
  }
}

export async function invalidateSession(sessionId: number): Promise<void> {
  // Set expiry dates to past to invalidate the session
  await update('user_sessions', sessionId, {
    session_expires_at: new Date(Date.now() - 1000), // 1 second ago
    refresh_expires_at: new Date(Date.now() - 1000),
  });
}


