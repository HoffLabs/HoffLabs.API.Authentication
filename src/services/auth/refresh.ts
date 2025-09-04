import { UserSession, User } from '../../interfaces/auth/user';
import { findSessionByRawRefreshToken, updateUserSession } from '../../utils/auth/sessionManagement';
import { createJWT, generateRefreshToken, splitRefreshToken } from '../../utils/auth/authEncryption';
import { verifyRefreshTokenFormat } from '../../utils/jwt';
import { getProfileByUid } from './profile';

export interface RefreshTokenResponse {
  user_uid: string;
  user: User; // Add full user object
  jwt: string;
  refresh_token: string;
  jwt_expiry: Date;
  refresh_token_expiry: Date;
  session_id: number;
}

export const refreshTokenService = async (refreshToken: string): Promise<RefreshTokenResponse | null> => {
  try {
    // Validate refresh token format
    if (!verifyRefreshTokenFormat(refreshToken)) {
      throw new Error('Invalid refresh token format');
    }

    // Find session by refresh token (this handles UID extraction, validation, and expiry checks)
    const session = await findSessionByRawRefreshToken(refreshToken);
    
    if (!session) {
      throw new Error('Invalid or expired refresh token');
    }

    // Get full user data for the response
    const user = await getProfileByUid(session.user_uid);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new tokens using session's user_uid
    const newJwt = createJWT(session.user_uid);
    const newRefreshToken = generateRefreshToken(session.user_uid);
    
    // Update session using your session management utility
    const updatedSession = await updateUserSession(session.id, newRefreshToken, newJwt);

    return {
      user_uid: session.user_uid,
      user: user, // Include full user object
      jwt: newJwt,
      refresh_token: newRefreshToken,
      jwt_expiry: updatedSession.session_expires_at,
      refresh_token_expiry: updatedSession.refresh_expires_at,
      session_id: updatedSession.id
    };

  } catch (error) {
    console.error('Refresh token service error:', error);
    return null;
  }
};

export const validateRefreshTokenService = async (refreshToken: string): Promise<boolean> => {
  try {
    // Validate refresh token format
    if (!verifyRefreshTokenFormat(refreshToken)) {
      return false;
    }

    // Find session by refresh token (this will handle encryption internally)
    const session = await findSessionByRawRefreshToken(refreshToken);
    
    return session !== null;

  } catch (error) {
    console.error('Validate refresh token service error:', error);
    return false;
  }
};
