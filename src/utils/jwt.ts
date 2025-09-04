import { JWT_SECRET } from '../config/environment';
import jwt from 'jsonwebtoken';

export const verifyJWT = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const decodeJWT = (token: string): any => {
  return jwt.decode(token);
};

// Verify refresh token format
export const verifyRefreshTokenFormat = (refreshToken: string): boolean => {
  // Refresh token should be 128 characters: 64 (UID hex) + 64 (random hex)
  return typeof refreshToken === 'string' && refreshToken.length === 128;
};
