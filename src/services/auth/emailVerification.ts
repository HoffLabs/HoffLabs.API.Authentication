import { User } from '../../interfaces/auth/user';
import { readSelect, update } from '../../database/utils/operations';
import { hash } from '../../utils/crypto';
import { randomBytes } from 'crypto';
import { sendEmailVerificationEmail } from './email';

export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationConfirm {
  token: string;
}

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24; // 24 hours expiry for verification tokens

export const generateVerificationToken = (): string => {
  return randomBytes(32).toString('hex');
};

export const sendVerificationEmailService = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Find user by email hash
    const emailHash = hash(email);
    const users = await readSelect<User>('users', ['*'], { email_hash: emailHash });
    
    if (users.length === 0) {
      // For security, don't reveal if email exists or not
      return { 
        success: true,
        message: 'If the email exists in our system, a verification link has been sent.' 
      };
    }

    const user = users[0];
    
    // Check if user is active
    if (!user.is_active) {
      return { 
        success: true,
        message: 'If the email exists in our system, a verification link has been sent.' 
      };
    }

    // Check if email is already verified
    if (user.email_verified) {
      return {
        success: true,
        message: 'Email is already verified.'
      };
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Update user with verification token
    await update<User>('users', user.id, {
      email_verification_token: verificationToken,
      email_verification_expires: verificationExpires,
      updated_at: new Date()
    });

    // Send verification email
    const emailResult = await sendEmailVerificationEmail({
      email: user.email,
      verificationToken,
      username: user.username
    });

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      return {
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      };
    }

    return {
      success: true,
      message: 'Verification email sent successfully.'
    };
  } catch (error) {
    console.error('Send verification email service error:', error);
    return { 
      success: false,
      message: 'Failed to send verification email. Please try again later.' 
    };
  }
};

export const validateVerificationTokenService = async (token: string): Promise<{ valid: boolean; message: string; user?: User }> => {
  try {
    if (!token || token.length !== 64) {
      return { valid: false, message: 'Invalid verification token format' };
    }

    // Find user by verification token
    const users = await readSelect<User>('users', ['*'], { email_verification_token: token });
    
    if (users.length === 0) {
      return { valid: false, message: 'Invalid or expired verification token' };
    }

    const user = users[0];

    // Check if token is expired
    if (!user.email_verification_expires || new Date() > new Date(user.email_verification_expires)) {
      // Clear expired token
      await update<User>('users', user.id, {
        email_verification_token: null,
        email_verification_expires: null,
        updated_at: new Date()
      });
      return { valid: false, message: 'Verification token has expired' };
    }

    // Check if user is active
    if (!user.is_active) {
      return { valid: false, message: 'Invalid or expired verification token' };
    }

    // Check if email is already verified
    if (user.email_verified) {
      return { valid: false, message: 'Email is already verified' };
    }

    return { valid: true, message: 'Verification token is valid', user };
  } catch (error) {
    console.error('Validate verification token service error:', error);
    return { valid: false, message: 'Invalid or expired verification token' };
  }
};

export const verifyEmailService = async (token: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate token first
    const tokenValidation = await validateVerificationTokenService(token);
    if (!tokenValidation.valid || !tokenValidation.user) {
      return { success: false, message: tokenValidation.message };
    }

    const user = tokenValidation.user;

    // Update user to mark email as verified and clear verification token
    await update<User>('users', user.id, {
      email_verified: true,
      email_verification_token: null,
      email_verification_expires: null,
      updated_at: new Date()
    });

    return { success: true, message: 'Email verified successfully! You can now access all features.' };
  } catch (error) {
    console.error('Verify email service error:', error);
    return { success: false, message: 'Failed to verify email. Please try again.' };
  }
};

export const clearExpiredVerificationTokensService = async (): Promise<number> => {
  try {
    // This would be better implemented as a scheduled job
    // For now, it can be called manually or on server startup
    
    const expiredUsers = await readSelect<User>('users', ['id'], {});
    let clearedCount = 0;

    for (const user of expiredUsers) {
      const fullUser = await readSelect<User>('users', ['*'], { id: user.id });
      if (fullUser.length > 0) {
        const userData = fullUser[0];
        if (userData.email_verification_expires && new Date() > new Date(userData.email_verification_expires)) {
          await update<User>('users', userData.id, {
            email_verification_token: null,
            email_verification_expires: null,
            updated_at: new Date()
          });
          clearedCount++;
        }
      }
    }

    return clearedCount;
  } catch (error) {
    console.error('Clear expired verification tokens service error:', error);
    return 0;
  }
};

export const resendVerificationEmailService = async (userUid: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Find user by UID
    const users = await readSelect<User>('users', ['*'], { uid: userUid });
    
    if (users.length === 0) {
      return { success: false, message: 'User not found' };
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return { success: false, message: 'Account is not active' };
    }

    // Check if email is already verified
    if (user.email_verified) {
      return {
        success: true,
        message: 'Email is already verified.'
      };
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Update user with new verification token
    await update<User>('users', user.id, {
      email_verification_token: verificationToken,
      email_verification_expires: verificationExpires,
      updated_at: new Date()
    });

    // Send verification email
    const emailResult = await sendEmailVerificationEmail({
      email: user.email,
      verificationToken,
      username: user.username
    });

    if (!emailResult.success) {
      console.error('Failed to resend verification email:', emailResult.error);
      return {
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      };
    }

    return {
      success: true,
      message: 'Verification email sent successfully.'
    };
  } catch (error) {
    console.error('Resend verification email service error:', error);
    return { 
      success: false,
      message: 'Failed to send verification email. Please try again later.' 
    };
  }
};
