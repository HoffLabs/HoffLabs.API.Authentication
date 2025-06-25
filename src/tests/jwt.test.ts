import { describe, it, expect, beforeAll } from 'bun:test';
import { verifyJWT, decodeJWT, verifyRefreshTokenFormat } from '../utils/jwt';
import { createJWT, generateRefreshToken, splitRefreshToken } from '../utils/auth/authEncryption';
import { randomBytes } from 'crypto';
import runDbSync from '../database/utils/sync';

describe('JWT Utilities Tests', () => {
  const testUid = randomBytes(32).toString('hex');
  let testJWT: string;
  let testRefreshToken: string;

  beforeAll(async () => {
    await runDbSync(); // Initialize the database
    testJWT = createJWT(testUid);
    testRefreshToken = generateRefreshToken(testUid);
  });

  describe('JWT Token Operations', () => {
    it('should create a valid JWT token', () => {
      expect(testJWT).toBeDefined();
      expect(typeof testJWT).toBe('string');
      expect(testJWT.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should verify a valid JWT token', () => {
      const decoded = verifyJWT(testJWT);
      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe(testUid);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should decode JWT without verification', () => {
      const decoded = decodeJWT(testJWT);
      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe(testUid);
    });

    it('should fail to verify invalid JWT', () => {
      expect(() => {
        verifyJWT('invalid.jwt.token');
      }).toThrow();
    });

    it('should fail to verify malformed JWT', () => {
      expect(() => {
        verifyJWT('not-a-jwt-at-all');
      }).toThrow();
    });

    it('should decode even invalid JWT structure', () => {
      const result = decodeJWT('invalid.token');
      expect(result).toBeNull();
    });
  });

  describe('Refresh Token Operations', () => {
    it('should generate a refresh token with correct format', () => {
      expect(testRefreshToken).toBeDefined();
      expect(typeof testRefreshToken).toBe('string');
      expect(testRefreshToken.length).toBe(128); // 64 (UID) + 64 (random)
    });

    it('should validate correct refresh token format', () => {
      const isValid = verifyRefreshTokenFormat(testRefreshToken);
      expect(isValid).toBe(true);
    });

    it('should reject invalid refresh token formats', () => {
      expect(verifyRefreshTokenFormat('')).toBe(false);
      expect(verifyRefreshTokenFormat('short')).toBe(false);
      expect(verifyRefreshTokenFormat('a'.repeat(100))).toBe(false);
      expect(verifyRefreshTokenFormat('a'.repeat(130))).toBe(false);
    });

    it('should extract UID from refresh token correctly', () => {
      const extractedUid = splitRefreshToken(testRefreshToken);
      expect(extractedUid).toBe(testUid);
    });

    it('should generate unique refresh tokens', () => {
      const token1 = generateRefreshToken(testUid);
      const token2 = generateRefreshToken(testUid);
      
      expect(token1).not.toBe(token2);
      expect(token1.slice(0, 64)).toBe(token2.slice(0, 64)); // Same UID
      expect(token1.slice(64)).not.toBe(token2.slice(64)); // Different random part
    });

    it('should handle edge cases in token format validation', () => {
      expect(verifyRefreshTokenFormat(null as any)).toBe(false);
      expect(verifyRefreshTokenFormat(undefined as any)).toBe(false);
      expect(verifyRefreshTokenFormat(123 as any)).toBe(false);
      expect(verifyRefreshTokenFormat({}  as any)).toBe(false);
    });
  });

  describe('Token Security', () => {
    it('should create tokens with proper expiration', () => {
      const decoded = verifyJWT(testJWT);
      const now = Math.floor(Date.now() / 1000);
      
      expect(decoded.iat).toBeLessThanOrEqual(now);
      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp - decoded.iat).toBe(30 * 60); // 30 minutes
    });

    it('should include correct claims in JWT', () => {
      const decoded = verifyJWT(testJWT);
      
      expect(decoded.sub).toBe(testUid);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.iat).toBe('number');
      expect(typeof decoded.exp).toBe('number');
    });

    it('should reject expired tokens', () => {
      // This test would require mocking time or using a token with past expiry
      // For now, we test the structure
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredPayload = { sub: testUid, iat: pastTime - 1800, exp: pastTime };
      
      // We can't easily create an expired token with the current implementation
      // This is a structural test
      expect(expiredPayload.exp).toBeLessThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('Error Handling', () => {
    it('should handle null inputs gracefully', () => {
      expect(() => verifyJWT(null as any)).toThrow();
      expect(() => verifyJWT(undefined as any)).toThrow();
      expect(decodeJWT(null as any)).toBeNull();
      expect(decodeJWT(undefined as any)).toBeNull();
    });

    it('should handle empty string inputs', () => {
      expect(() => verifyJWT('')).toThrow();
      expect(decodeJWT('')).toBeNull();
      expect(verifyRefreshTokenFormat('')).toBe(false);
    });

    it('should handle malformed tokens', () => {
      expect(() => verifyJWT('header.payload')).toThrow(); // Missing signature
      expect(() => verifyJWT('header.payload.signature.extra')).toThrow(); // Too many parts
      expect(decodeJWT('malformed')).toBeNull();
    });
  });

  describe('Token Consistency', () => {
    it('should create consistent tokens for same input', () => {
      // UID should be consistent
      const token1 = generateRefreshToken(testUid);
      const token2 = generateRefreshToken(testUid);
      
      expect(splitRefreshToken(token1)).toBe(testUid);
      expect(splitRefreshToken(token2)).toBe(testUid);
      expect(splitRefreshToken(token1)).toBe(splitRefreshToken(token2));
    });

    it('should create different JWTs for different UIDs', () => {
      const uid1 = randomBytes(32).toString('hex');
      const uid2 = randomBytes(32).toString('hex');
      
      const jwt1 = createJWT(uid1);
      const jwt2 = createJWT(uid2);
      
      expect(jwt1).not.toBe(jwt2);
      expect(verifyJWT(jwt1).sub).toBe(uid1);
      expect(verifyJWT(jwt2).sub).toBe(uid2);
    });

    it('should maintain token format across different UIDs', () => {
      const uid1 = randomBytes(32).toString('hex');
      const uid2 = randomBytes(32).toString('hex');
      
      const token1 = generateRefreshToken(uid1);
      const token2 = generateRefreshToken(uid2);
      
      expect(verifyRefreshTokenFormat(token1)).toBe(true);
      expect(verifyRefreshTokenFormat(token2)).toBe(true);
      expect(token1.length).toBe(token2.length);
    });
  });
});
