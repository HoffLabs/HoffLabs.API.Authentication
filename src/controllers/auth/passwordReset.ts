import { FastifyRequest, FastifyReply } from 'fastify';
import { 
  requestPasswordResetService,
  validateResetTokenService,
  resetPasswordService,
  PasswordResetRequest,
  PasswordResetConfirm
} from '../../services/auth/passwordReset';

interface ForgotPasswordRequest {
  Body: PasswordResetRequest;
}

interface ValidateTokenRequest {
  Params: { token: string };
}

interface ResetPasswordRequest {
  Body: PasswordResetConfirm;
}

export const forgotPassword = async (
  request: FastifyRequest<ForgotPasswordRequest>, 
  reply: FastifyReply
) => {
  try {
    const { email } = request.body;

    if (!email) {
      return reply.status(400).send({
        error: 'Missing email',
        message: 'Email address is required'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return reply.status(400).send({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
    }

    const result = await requestPasswordResetService(email);

    // Always return success message for security
    reply.send({
      success: true,
      message: result.message,
      // Remove this in production - only for testing
      ...(result.token && { debug_token: result.token })
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process password reset request';
    
    reply.status(500).send({
      error: 'Password reset request failed',
      message: 'Unable to process password reset request. Please try again later.'
    });
  }
};

export const validateResetToken = async (
  request: FastifyRequest<ValidateTokenRequest>, 
  reply: FastifyReply
) => {
  try {
    const { token } = request.params;

    if (!token) {
      return reply.status(400).send({
        error: 'Missing token',
        message: 'Reset token is required'
      });
    }

    const result = await validateResetTokenService(token);

    if (result.valid) {
      reply.send({
        success: true,
        valid: true,
        message: result.message
      });
    } else {
      reply.status(400).send({
        success: false,
        valid: false,
        error: 'Invalid token',
        message: result.message
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to validate reset token';
    
    reply.status(500).send({
      error: 'Token validation failed',
      message: errorMessage
    });
  }
};

export const resetPassword = async (
  request: FastifyRequest<ResetPasswordRequest>, 
  reply: FastifyReply
) => {
  try {
    const { token, new_password } = request.body;

    if (!token || !new_password) {
      return reply.status(400).send({
        error: 'Missing required fields',
        message: 'Both token and new_password are required'
      });
    }

    // Basic password validation using the same validation as registration
    const { validatePassword } = await import('../auth');
    
    // Use stronger password validation
    if (new_password.length < 12) {
      return reply.status(400).send({
        error: 'Invalid password',
        message: 'Password must be at least 12 characters long and meet security requirements'
      });
    }
    
    // Additional security checks
    if (!/[a-z]/.test(new_password)) {
      return reply.status(400).send({
        error: 'Invalid password',
        message: 'Password must contain at least one lowercase letter'
      });
    }
    if (!/[A-Z]/.test(new_password)) {
      return reply.status(400).send({
        error: 'Invalid password',
        message: 'Password must contain at least one uppercase letter'
      });
    }
    if (!/\d/.test(new_password)) {
      return reply.status(400).send({
        error: 'Invalid password',
        message: 'Password must contain at least one number'
      });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(new_password)) {
      return reply.status(400).send({
        error: 'Invalid password',
        message: 'Password must contain at least one special character'
      });
    }

    const result = await resetPasswordService(token, new_password);

    if (result.success) {
      reply.send({
        success: true,
        message: result.message
      });
    } else {
      const statusCode = result.message.includes('expired') || result.message.includes('Invalid') ? 400 : 500;
      
      reply.status(statusCode).send({
        success: false,
        error: 'Password reset failed',
        message: result.message
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
    
    reply.status(500).send({
      error: 'Password reset failed',
      message: errorMessage
    });
  }
};
