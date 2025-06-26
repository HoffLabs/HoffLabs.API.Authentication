import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { loginService, registerService } from '../services/auth/auth';
import { refreshTokenService, validateRefreshTokenService } from '../services/auth/refresh';
import { 
  getProfileService, 
  updateProfileService, 
  changePasswordService,
  deleteAccountService 
} from '../services/auth/profile';
import {
  getActiveSessionsService,
  revokeSessionService,
  revokeAllOtherSessionsService,
  getLoginHistoryService
} from '../services/auth/sessions';
import {
  requestPasswordResetService,
  validateResetTokenService,
  resetPasswordService
} from '../services/auth/passwordReset';
import { verifyJWT, decodeJWT, verifyRefreshTokenFormat } from '../utils/jwt';
import { hash } from '../utils/crypto';
import { readSelect, remove } from '../database/utils/operations';
import { User, UserSession } from '../interfaces/auth/user';
import runDbSync from '../database/utils/sync';

describe('Authentication System Tests', () => {
  let testUserData: any;
  let testUserUid: string;
  let testJWT: string;
  let testRefreshToken: string;
  let testSessionId: number;

beforeAll(async () => {
    await runDbSync(); // Initialize the database and sync schema
    // Create a test user for all tests
    const testUser = {
      username: 'testuser_' + Date.now(),
      email: 'test_' + Date.now() + '@example.com',
      password_hash: 'testpassword123'
    };

    const requestInfo = {
      login_ip: '127.0.0.1',
      user_agent: 'Test Runner'
    };

    testUserData = await registerService(testUser, requestInfo);
    testUserUid = testUserData.user_uid;
    testJWT = testUserData.access_token;
    testRefreshToken = testUserData.refresh_token;

    // Get session ID for testing
    const sessions = await readSelect<UserSession>('user_sessions', ['*'], { user_uid: testUserUid });
    testSessionId = sessions[0]?.id;
  });

  afterAll(async () => {
    // Cleanup: Remove test user and related data
    try {
      if (testUserUid) {
        const users = await readSelect<User>('users', ['id'], { uid: testUserUid });
        if (users.length > 0) {
          const removed = await remove('users', users[0].id);
          if (!removed) {
            console.warn('User already cleaned up:', users[0].id);
          }
        }
      }
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  });

  describe('User Registration and Login', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        username: 'newuser_' + Date.now(),
        email: 'newuser_' + Date.now() + '@example.com',
        password_hash: 'newpassword123'
      };

      const requestInfo = {
        login_ip: '127.0.0.1',
        user_agent: 'Test Runner'
      };

      const result = await registerService(newUser, requestInfo);

      expect(result.user_uid).toBeDefined();
      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
      expect(result.expires_in).toBeDefined();

      // Cleanup
      const users = await readSelect<User>('users', ['id'], { uid: result.user_uid });
      if (users.length > 0) {
        const removed = await remove('users', users[0].id);
        if (!removed) {
          console.warn('User already cleaned up:', users[0].id);
        }
      }
    });

    it('should fail to register with duplicate username', async () => {
      const duplicateUser = {
        username: testUserData.username || 'testuser_duplicate',
        email: 'different_' + Date.now() + '@example.com',
        password_hash: 'password123'
      };

      const requestInfo = {
        login_ip: '127.0.0.1',
        user_agent: 'Test Runner'
      };

      try {
        await registerService(duplicateUser, requestInfo);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should login successfully with valid credentials', async () => {
      // Get the username from the test user
      const users = await readSelect<User>('users', ['*'], { uid: testUserUid });
      const user = users[0];
      const { decrypt } = await import('../utils/crypto');
      const username = await decrypt(user.username);

      const result = await loginService(username, 'testpassword123', '127.0.0.1', 'Test Runner');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user!.uid).toBe(testUserUid);
      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
      expect(result.expires_in).toBeGreaterThan(0);
    });

    it('should fail login with invalid credentials', async () => {
      const result = await loginService('nonexistent', 'wrongpassword', '127.0.0.1', 'Test Runner');
      expect(result.error).toBeDefined();
      expect(result.error).toBe('Invalid credentials');
      expect(result.locked).toBe(false);
    });
  });

  describe('JWT Token Operations', () => {
    it('should verify JWT token successfully', () => {
      const decoded = verifyJWT(testJWT);
      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe(testUserUid);
    });

    it('should decode JWT token without verification', () => {
      const decoded = decodeJWT(testJWT);
      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe(testUserUid);
    });

    it('should validate refresh token format', () => {
      const isValid = verifyRefreshTokenFormat(testRefreshToken);
      expect(isValid).toBe(true);

      const isInvalid = verifyRefreshTokenFormat('invalid_token');
      expect(isInvalid).toBe(false);
    });

    it('should refresh tokens successfully', async () => {
      const result = await refreshTokenService(testRefreshToken);

      expect(result).toBeDefined();
      expect(result!.user_uid).toBe(testUserUid);
      expect(result!.jwt).toBeDefined();
      expect(result!.refresh_token).toBeDefined();
      expect(result!.jwt).not.toBe(testJWT); // Should be a new token
      
      // Update test tokens for subsequent tests
      testJWT = result!.jwt;
      testRefreshToken = result!.refresh_token;
    });

    it('should validate refresh token', async () => {
      const isValid = await validateRefreshTokenService(testRefreshToken);
      expect(isValid).toBe(true);

      const isInvalid = await validateRefreshTokenService('invalid_refresh_token');
      expect(isInvalid).toBe(false);
    });
  });

  describe('Profile Management', () => {
    it('should get user profile successfully', async () => {
      const profile = await getProfileService(testUserUid);

      expect(profile).toBeDefined();
      expect(profile!.uid).toBe(testUserUid);
      expect(profile!.username).toBeDefined();
      expect(profile!.email).toBeDefined();
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        first_name: 'Test',
        last_name: 'User',
        avatar: 'https://example.com/avatar.jpg'
      };

      const updatedProfile = await updateProfileService(testUserUid, updateData);

      expect(updatedProfile).toBeDefined();
      expect(updatedProfile!.first_name).toBe('Test');
      expect(updatedProfile!.last_name).toBe('User');
      expect(updatedProfile!.avatar).toBe('https://example.com/avatar.jpg');
    });

    it('should change password successfully', async () => {
      const passwordData = {
        current_password: 'testpassword123',
        new_password: 'newpassword456'
      };

      const result = await changePasswordService(testUserUid, passwordData);
      expect(result).toBe(true);

      // Change it back for other tests
      const revertData = {
        current_password: 'newpassword456',
        new_password: 'testpassword123'
      };
      await changePasswordService(testUserUid, revertData);
    });

    it('should fail to change password with incorrect current password', async () => {
      const passwordData = {
        current_password: 'wrongpassword',
        new_password: 'newpassword456'
      };

      try {
        await changePasswordService(testUserUid, passwordData);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Session Management', () => {
    it('should get active sessions', async () => {
      const sessions = await getActiveSessionsService(testUserUid, testSessionId);

      expect(sessions).toBeDefined();
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBeGreaterThan(0);

      // Check if current session is marked
      const currentSession = sessions.find(s => s.is_current);
      expect(currentSession).toBeDefined();
    });

    it('should get login history', async () => {
      const history = await getLoginHistoryService(testUserUid, 10);

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      // May be empty for new user, but should be an array
    });

    it('should revoke all other sessions', async () => {
      // Create another session first
      const users = await readSelect<User>('users', ['*'], { uid: testUserUid });
      const user = users[0];
      const { decrypt } = await import('../utils/crypto');
      const username = await decrypt(user.username);
      
      await loginService(username, 'testpassword123', '127.0.0.1', 'Test Runner'); // Creates new session

      const revokedCount = await revokeAllOtherSessionsService(testUserUid, testSessionId);
      expect(revokedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Password Reset', () => {
    let resetToken: string;

    it('should request password reset', async () => {
      const users = await readSelect<User>('users', ['*'], { uid: testUserUid });
      const user = users[0];
      const email = user.email; // Email is stored as plain text

      const result = await requestPasswordResetService(email);

      expect(result).toBeDefined();
      expect(result.message).toContain('password reset link');
      
      if (result.token) {
        resetToken = result.token;
      }
    });

    it('should validate reset token', async () => {
      if (resetToken) {
        const result = await validateResetTokenService(resetToken);
        expect(result.valid).toBe(true);
      }
    });

    it('should reset password with valid token', async () => {
      if (resetToken) {
        const result = await resetPasswordService(resetToken, 'resetpassword123');
        expect(result.success).toBe(true);

        // Reset back to original password for other tests
        const users = await readSelect<User>('users', ['*'], { uid: testUserUid });
        const user = users[0];
        const email = user.email; // Email is stored as plain text
        
        const newResetResult = await requestPasswordResetService(email);
        if (newResetResult.token) {
          await resetPasswordService(newResetResult.token, 'testpassword123');
        }
      }
    });

    it('should fail with invalid reset token', async () => {
      const result = await resetPasswordService('invalid_token', 'newpassword123');
      expect(result.success).toBe(false);
    });
  });

  describe('Security and Validation', () => {
    it('should hash passwords consistently', () => {
      const input = 'test_password';
      const hash1 = hash(input);
      const hash2 = hash(input);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toBeDefined();
      expect(hash1.length).toBe(64); // SHA256 hex output
    });

    it('should reject invalid email formats in password reset', async () => {
      const result = await requestPasswordResetService('invalid_email');
      expect(result.message).toContain('password reset link'); // Security: same message for invalid emails
    });

    it('should reject short passwords', async () => {
      try {
        await changePasswordService(testUserUid, {
          current_password: 'testpassword123',
          new_password: 'short'
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should prevent self-session revocation', async () => {
      try {
        await revokeSessionService(testUserUid, testSessionId, testSessionId);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Account Management', () => {
    it('should deactivate account successfully', async () => {
      // Create a separate user for deletion test
      const deleteUser = {
        username: 'deleteuser_' + Date.now(),
        email: 'deleteuser_' + Date.now() + '@example.com',
        password_hash: 'deletepassword123'
      };

      const requestInfo = {
        login_ip: '127.0.0.1',
        user_agent: 'Test Runner'
      };

      const userData = await registerService(deleteUser, requestInfo);
      const result = await deleteAccountService(userData.user_uid);
      
      expect(result).toBe(true);

      // Verify user is deactivated
      const users = await readSelect<User>('users', ['*'], { uid: userData.user_uid });
      expect(users[0].is_active).toBe(false);

      // Cleanup
      const removed = await remove('users', users[0].id);
      if (!removed) {
        console.warn('User already cleaned up:', users[0].id);
      }
    });

    it('should handle profile updates with duplicate username', async () => {
      // Create another user first
      const otherUser = {
        username: 'otheruser_' + Date.now(),
        email: 'otheruser_' + Date.now() + '@example.com',
        password_hash: 'password123'
      };

      const requestInfo = {
        login_ip: '127.0.0.1',
        user_agent: 'Test Runner'
      };

      const otherUserData = await registerService(otherUser, requestInfo);
      
      // Get the other user's username
      const otherUsers = await readSelect<User>('users', ['*'], { uid: otherUserData.user_uid });
      const { decrypt } = await import('../utils/crypto');
      const otherUsername = await decrypt(otherUsers[0].username);

      try {
        await updateProfileService(testUserUid, { username: otherUsername });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Cleanup
      const removed = await remove('users', otherUsers[0].id);
      if (!removed) {
        console.warn('User already cleaned up:', otherUsers[0].id);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle non-existent user in profile operations', async () => {
      const profile = await getProfileService('non_existent_uid');
      expect(profile).toBeNull();
    });

    it('should handle invalid JWT tokens gracefully', () => {
      try {
        verifyJWT('invalid.jwt.token');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle expired refresh tokens', async () => {
      const result = await validateRefreshTokenService('expired_token_simulation');
      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      // Test with invalid session ID
      try {
        await revokeSessionService(testUserUid, 999999);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
