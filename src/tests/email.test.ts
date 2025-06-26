import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import runDbSync from '../database/utils/sync';
import { create, readSelect, update } from '../database/utils/operations';
import { User } from '../interfaces/auth/user';
import { hash } from '../utils/crypto';
import { randomBytes } from 'crypto';
import { encryptPassword } from '../utils/auth/authEncryption';
import {
  testEmailConnection,
  sendEmail,
  generatePasswordResetEmail,
  generateEmailVerificationEmail,
  sendPasswordResetEmail,
  sendEmailVerificationEmail
} from '../services/auth/email';
import {
  sendVerificationEmailService,
  verifyEmailService,
  validateVerificationTokenService,
  resendVerificationEmailService,
  generateVerificationToken
} from '../services/auth/emailVerification';
import {
  requestPasswordResetService,
  validateResetTokenService,
  resetPasswordService,
  generateResetToken
} from '../services/auth/passwordReset';

describe('Email Functionality Tests', () => {
  beforeAll(async () => {
    await runDbSync();
  });

  afterAll(async () => {
    // Clean up test users
    const testUsers = await readSelect<User>('users', ['id'], {});
    for (const user of testUsers) {
      if (user.id) {
        const userData = await readSelect<User>('users', ['*'], { id: user.id });
        if (userData.length > 0 && userData[0].username?.includes('test_')) {
          await update<User>('users', user.id, { is_active: false });
        }
      }
    }
  });

  describe('Email Service Configuration', () => {
    it('should handle missing SMTP configuration gracefully', async () => {
      // This test assumes SMTP is not configured in test environment
      const result = await testEmailConnection();
      
      // Should either succeed (if SMTP is configured) or fail gracefully
      expect(typeof result.success).toBe('boolean');
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });

    it('should generate password reset email template correctly', () => {
      const testData = {
        email: 'test@example.com',
        resetToken: 'abc123def456',
        username: 'testuser'
      };

      const emailOptions = generatePasswordResetEmail(testData);

      expect(emailOptions.to).toBe(testData.email);
      expect(emailOptions.subject).toContain('Reset Your Password');
      expect(emailOptions.html).toContain(testData.username);
      expect(emailOptions.html).toContain(testData.resetToken);
      expect(emailOptions.text).toContain(testData.username);
      expect(emailOptions.text).toContain(testData.resetToken);
    });

    it('should generate email verification template correctly', () => {
      const testData = {
        email: 'test@example.com',
        verificationToken: 'xyz789uvw012',
        username: 'testuser'
      };

      const emailOptions = generateEmailVerificationEmail(testData);

      expect(emailOptions.to).toBe(testData.email);
      expect(emailOptions.subject).toContain('Verify Your Email');
      expect(emailOptions.html).toContain(testData.username);
      expect(emailOptions.html).toContain(testData.verificationToken);
      expect(emailOptions.text).toContain(testData.username);
      expect(emailOptions.text).toContain(testData.verificationToken);
    });
  });

  describe('Email Verification Service', () => {
    let testUser: User;

    beforeAll(async () => {
      // Create test user
      const testUsername = `test_verification_${Date.now()}`;
      const testEmail = `test_verification_${Date.now()}@example.com`;
      const passwordHash = await encryptPassword('TestPassword123!');

      const userData = {
        uid: randomBytes(16).toString('hex'),
        username: testUsername,
        username_hash: hash(testUsername),
        email: testEmail,
        email_hash: hash(testEmail),
        password_hash: passwordHash,
        role_id: 1,
        mfa_method_id: 1,
        is_active: true,
        email_verified: false,
        login_attempts: 0,
        is_banned: false,
        is_shadowbanned: false
      };

      const createdUser = await create<User>('users', userData);
      const users = await readSelect<User>('users', ['*'], { id: createdUser.id });
      testUser = users[0];
    });

    it('should generate verification tokens correctly', () => {
      const token1 = generateVerificationToken();
      const token2 = generateVerificationToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1.length).toBe(64);
      expect(token2.length).toBe(64);
      expect(token1).not.toBe(token2); // Should be unique
    });

    it('should send verification email for existing user', async () => {
      const result = await sendVerificationEmailService(testUser.email);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Verification email sent');

      // Check that user was updated with verification token
      const updatedUsers = await readSelect<User>('users', ['*'], { id: testUser.id });
      const updatedUser = updatedUsers[0];
      
      expect(updatedUser.email_verification_token).toBeDefined();
      expect(updatedUser.email_verification_expires).toBeDefined();
      expect(updatedUser.email_verification_token!.length).toBe(64);
    });

    it('should handle non-existent email gracefully', async () => {
      const result = await sendVerificationEmailService('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('If the email exists');
    });

    it('should validate verification tokens correctly', async () => {
      // Get the current verification token
      const users = await readSelect<User>('users', ['*'], { id: testUser.id });
      const user = users[0];
      const validToken = user.email_verification_token!;

      // Test valid token
      const validResult = await validateVerificationTokenService(validToken);
      expect(validResult.valid).toBe(true);
      expect(validResult.user).toBeDefined();
      expect(validResult.user!.id).toBe(testUser.id);

      // Test invalid token format
      const invalidFormatResult = await validateVerificationTokenService('invalid');
      expect(invalidFormatResult.valid).toBe(false);
      expect(invalidFormatResult.message).toContain('Invalid verification token format');

      // Test non-existent token
      const nonExistentResult = await validateVerificationTokenService('a'.repeat(64));
      expect(nonExistentResult.valid).toBe(false);
      expect(nonExistentResult.message).toContain('Invalid or expired verification token');
    });

    it('should verify email successfully', async () => {
      // Get the current verification token
      const users = await readSelect<User>('users', ['*'], { id: testUser.id });
      const user = users[0];
      const token = user.email_verification_token!;

      const result = await verifyEmailService(token);

      expect(result.success).toBe(true);
      expect(result.message).toContain('verified successfully');

      // Check that user is now verified and token is cleared
      const verifiedUsers = await readSelect<User>('users', ['*'], { id: testUser.id });
      const verifiedUser = verifiedUsers[0];
      
      expect(verifiedUser.email_verified).toBe(true);
      expect(verifiedUser.email_verification_token).toBeNull();
      expect(verifiedUser.email_verification_expires).toBeNull();
    });

    it('should handle already verified email', async () => {
      const result = await sendVerificationEmailService(testUser.email);

      expect(result.success).toBe(true);
      expect(result.message).toContain('already verified');
    });

    it('should resend verification email for unverified user', async () => {
      // Create another test user for resend test
      const testUsername = `test_resend_${Date.now()}`;
      const testEmail = `test_resend_${Date.now()}@example.com`;
      const passwordHash = await encryptPassword('TestPassword123!');

      const userData = {
        uid: randomBytes(16).toString('hex'),
        username: testUsername,
        username_hash: hash(testUsername),
        email: testEmail,
        email_hash: hash(testEmail),
        password_hash: passwordHash,
        role_id: 1,
        mfa_method_id: 1,
        is_active: true,
        email_verified: false,
        login_attempts: 0,
        is_banned: false,
        is_shadowbanned: false
      };

      const createdUser = await create<User>('users', userData);
      const users = await readSelect<User>('users', ['*'], { id: createdUser.id });
      const newUser = users[0];

      const result = await resendVerificationEmailService(newUser.uid);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Verification email sent');

      // Check that user was updated with new verification token
      const updatedUsers = await readSelect<User>('users', ['*'], { id: newUser.id });
      const updatedUser = updatedUsers[0];
      
      expect(updatedUser.email_verification_token).toBeDefined();
      expect(updatedUser.email_verification_expires).toBeDefined();
    });
  });

  describe('Password Reset Service', () => {
    let testUser: User;

    beforeAll(async () => {
      // Create test user for password reset
      const testUsername = `test_reset_${Date.now()}`;
      const testEmail = `test_reset_${Date.now()}@example.com`;
      const passwordHash = await encryptPassword('OriginalPassword123!');

      const userData = {
        uid: randomBytes(16).toString('hex'),
        username: testUsername,
        username_hash: hash(testUsername),
        email: testEmail,
        email_hash: hash(testEmail),
        password_hash: passwordHash,
        role_id: 1,
        mfa_method_id: 1,
        is_active: true,
        email_verified: true,
        login_attempts: 0,
        is_banned: false,
        is_shadowbanned: false
      };

      const createdUser = await create<User>('users', userData);
      const users = await readSelect<User>('users', ['*'], { id: createdUser.id });
      testUser = users[0];
    });

    it('should generate reset tokens correctly', () => {
      const token1 = generateResetToken();
      const token2 = generateResetToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1.length).toBe(64);
      expect(token2.length).toBe(64);
      expect(token1).not.toBe(token2); // Should be unique
    });

    it('should request password reset for existing user', async () => {
      const result = await requestPasswordResetService(testUser.email);

      expect(result.message).toContain('password reset link has been sent');

      // Check that user was updated with reset token
      const updatedUsers = await readSelect<User>('users', ['*'], { id: testUser.id });
      const updatedUser = updatedUsers[0];
      
      expect(updatedUser.password_reset_token).toBeDefined();
      expect(updatedUser.password_reset_expires).toBeDefined();
      expect(updatedUser.password_reset_token!.length).toBe(64);
    });

    it('should handle non-existent email gracefully for password reset', async () => {
      const result = await requestPasswordResetService('nonexistent@example.com');

      expect(result.message).toContain('If the email exists');
    });

    it('should validate reset tokens correctly', async () => {
      // Get the current reset token
      const users = await readSelect<User>('users', ['*'], { id: testUser.id });
      const user = users[0];
      const validToken = user.password_reset_token!;

      // Test valid token
      const validResult = await validateResetTokenService(validToken);
      expect(validResult.valid).toBe(true);
      expect(validResult.message).toContain('valid');

      // Test invalid token format
      const invalidFormatResult = await validateResetTokenService('invalid');
      expect(invalidFormatResult.valid).toBe(false);
      expect(invalidFormatResult.message).toContain('Invalid reset token format');

      // Test non-existent token
      const nonExistentResult = await validateResetTokenService('b'.repeat(64));
      expect(nonExistentResult.valid).toBe(false);
      expect(nonExistentResult.message).toContain('Invalid or expired reset token');
    });

    it('should reset password successfully', async () => {
      // Get the current reset token
      const users = await readSelect<User>('users', ['*'], { id: testUser.id });
      const user = users[0];
      const token = user.password_reset_token!;
      const originalPasswordHash = user.password_hash;

      const newPassword = 'NewSecurePassword123!';
      const result = await resetPasswordService(token, newPassword);

      expect(result.success).toBe(true);
      expect(result.message).toContain('reset successfully');

      // Check that password was changed and token is cleared
      const resetUsers = await readSelect<User>('users', ['*'], { id: testUser.id });
      const resetUser = resetUsers[0];
      
      expect(resetUser.password_hash).not.toBe(originalPasswordHash);
      expect(resetUser.password_reset_token).toBeNull();
      expect(resetUser.password_reset_expires).toBeNull();
      expect(resetUser.last_password_change).toBeDefined();
    });

    it('should reject weak passwords', async () => {
      // Request new reset for testing
      await requestPasswordResetService(testUser.email);
      
      const users = await readSelect<User>('users', ['*'], { id: testUser.id });
      const user = users[0];
      const token = user.password_reset_token!;

      const result = await resetPasswordService(token, 'weak');

      expect(result.success).toBe(false);
      expect(result.message).toContain('at least 8 characters');
    });
  });

  describe('Email Template Content', () => {
    it('should include security warnings in password reset emails', () => {
      const testData = {
        email: 'test@example.com',
        resetToken: 'test-token',
        username: 'testuser'
      };

      const emailOptions = generatePasswordResetEmail(testData);

      expect(emailOptions.html).toContain('expire');
      expect(emailOptions.html).toContain("didn't request");
      expect(emailOptions.text).toContain('expire');
      expect(emailOptions.text).toContain("didn't request");
    });

    it('should include verification benefits in verification emails', () => {
      const testData = {
        email: 'test@example.com',
        verificationToken: 'test-token',
        username: 'testuser'
      };

      const emailOptions = generateEmailVerificationEmail(testData);

      expect(emailOptions.html).toContain('Secure your account');
      expect(emailOptions.html).toContain('Access all API features');
      expect(emailOptions.text).toContain('Secure your account');
      expect(emailOptions.text).toContain('Access all API features');
    });

    it('should use consistent branding', () => {
      const resetEmail = generatePasswordResetEmail({
        email: 'test@example.com',
        resetToken: 'token',
        username: 'user'
      });

      const verificationEmail = generateEmailVerificationEmail({
        email: 'test@example.com',
        verificationToken: 'token',
        username: 'user'
      });

      expect(resetEmail.html).toContain('Hofflabs API');
      expect(resetEmail.text).toContain('Hofflabs');
      expect(verificationEmail.html).toContain('Hofflabs API');
      expect(verificationEmail.text).toContain('Hofflabs');
    });
  });
});
