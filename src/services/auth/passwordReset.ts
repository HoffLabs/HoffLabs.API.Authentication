import { User } from '../../interfaces/auth/user';
import { readSelect, update } from '../../database/utils/operations';
import { hash, encrypt } from '../../utils/crypto';
import { encryptPassword } from '../../utils/auth/authEncryption';
import { randomBytes } from 'crypto';
import { sendPasswordResetEmail } from './email';

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

const RESET_TOKEN_EXPIRY_HOURS = 1; // 1 hour expiry for reset tokens

export const generateResetToken = (): string => {
  return randomBytes(32).toString('hex');
};

export const requestPasswordResetService = async (email: string): Promise<{ token?: string; message: string }> => {
  try {
    // Find user by email hash
    const emailHash = hash(email);
    const users = await readSelect<User>('users', ['*'], { email_hash: emailHash });
    
    if (users.length === 0) {
      // For security, don't reveal if email exists or not
      return { 
        message: 'If the email exists in our system, a password reset link has been sent.' 
      };
    }

    const user = users[0];
    
    // Check if user is active
    if (!user.is_active) {
      return { 
        message: 'If the email exists in our system, a password reset link has been sent.' 
      };
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Update user with reset token
    await update<User>('users', user.id, {
      password_reset_token: resetToken,
      password_reset_expires: resetExpires,
      updated_at: new Date()
    });

    // Send password reset email
    const emailResult = await sendPasswordResetEmail({
      email: user.email,
      resetToken,
      username: user.username
    });

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      // Still return success for security - don't reveal if email sending failed
    }

    return {
      message: 'If the email exists in our system, a password reset link has been sent.'
    };
  } catch (error) {
    console.error('Request password reset service error:', error);
    return { 
      message: 'If the email exists in our system, a password reset link has been sent.' 
    };
  }
};

export const validateResetTokenService = async (token: string): Promise<{ valid: boolean; message: string }> => {
  try {
    if (!token || token.length !== 64) {
      return { valid: false, message: 'Invalid reset token format' };
    }

    // Find user by reset token
    const users = await readSelect<User>('users', ['*'], { password_reset_token: token });
    
    if (users.length === 0) {
      return { valid: false, message: 'Invalid or expired reset token' };
    }

    const user = users[0];

    // Check if token is expired
    if (!user.password_reset_expires || new Date() > new Date(user.password_reset_expires)) {
      // Clear expired token
      await update<User>('users', user.id, {
        password_reset_token: null,
        password_reset_expires: null,
        updated_at: new Date()
      });
      return { valid: false, message: 'Reset token has expired' };
    }

    // Check if user is active
    if (!user.is_active) {
      return { valid: false, message: 'Invalid or expired reset token' };
    }

    return { valid: true, message: 'Reset token is valid' };
  } catch (error) {
    console.error('Validate reset token service error:', error);
    return { valid: false, message: 'Invalid or expired reset token' };
  }
};

export const resetPasswordService = async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate token first
    const tokenValidation = await validateResetTokenService(token);
    if (!tokenValidation.valid) {
      return { success: false, message: tokenValidation.message };
    }

    // Validate new password
    if (newPassword.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters long' };
    }

    // Find user by reset token
    const users = await readSelect<User>('users', ['*'], { password_reset_token: token });
    const user = users[0];

    // Hash and encrypt new password
    const newPasswordHash = await encryptPassword(newPassword);

    // Update user with new password and clear reset token
    await update<User>('users', user.id, {
      password_hash: newPasswordHash,
      password_reset_token: null,
      password_reset_expires: null,
      last_password_change: new Date(),
      updated_at: new Date()
    });

    return { success: true, message: 'Password has been reset successfully' };
  } catch (error) {
    console.error('Reset password service error:', error);
    return { success: false, message: 'Failed to reset password. Please try again.' };
  }
};

export const clearExpiredResetTokensService = async (): Promise<number> => {
  try {
    // This would be better implemented as a scheduled job
    // For now, it can be called manually or on server startup
    
    const expiredUsers = await readSelect<User>('users', ['id'], {});
    let clearedCount = 0;

    for (const user of expiredUsers) {
      const fullUser = await readSelect<User>('users', ['*'], { id: user.id });
      if (fullUser.length > 0) {
        const userData = fullUser[0];
        if (userData.password_reset_expires && new Date() > new Date(userData.password_reset_expires)) {
          await update<User>('users', userData.id, {
            password_reset_token: null,
            password_reset_expires: null,
            updated_at: new Date()
          });
          clearedCount++;
        }
      }
    }

    return clearedCount;
  } catch (error) {
    console.error('Clear expired reset tokens service error:', error);
    return 0;
  }
};
