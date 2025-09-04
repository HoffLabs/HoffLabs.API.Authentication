import { FastifyInstance } from 'fastify';
import { login, register } from '../controllers/auth/auth';
import { refreshToken, validateRefreshToken, invalidateToken } from '../controllers/auth/jwt';
import { getProfile, updateProfile, changePassword, deleteAccount } from '../controllers/auth/profile';
import { getActiveSessions, revokeSession, revokeAllOtherSessions, getLoginHistory } from '../controllers/auth/sessions';
import { forgotPassword, validateResetToken, resetPassword } from '../controllers/auth/passwordReset';
import { sendVerificationEmail, verifyEmail, resendVerificationEmail } from '../controllers/auth/emailVerification';
import { ErrorSchema, UserSchema, LoginResponseSchema, SessionSchema, HealthCheckSchema } from '../interfaces/auth/common';

export default async function authRoutes(fastify: FastifyInstance) {
  // Authentication endpoints
  fastify.post('/login', {
    schema: {
      tags: ['Authentication'],
      summary: 'User login',
      description: 'Authenticate user and return JWT tokens',
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', description: 'Username or email' },
          password: { type: 'string', description: 'User password' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                uid: { type: 'string' },
                username: { type: 'string' },
                email: { type: 'string' },
                email_verified: { type: 'boolean' },
                created_at: { type: 'string' }
              }
            },
            access_token: { type: 'string' },
            refresh_token: { type: 'string' },
            expires_in: { type: 'number' }
          }
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            locked: { type: 'boolean' },
            attempts_remaining: { type: 'number' },
            warning: { type: 'string' },
            ban_reason: { type: 'string' }
          }
        },
        423: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            locked: { type: 'boolean' },
            locked_until: { type: 'string', format: 'date-time' },
            attempts_remaining: { type: 'number' }
          },
          description: 'Account is locked due to multiple failed login attempts'
        }
      }
    }
  }, login);
  
  fastify.post('/register', {
    schema: {
      tags: ['Authentication'],
      summary: 'User registration',
      description: 'Register a new user account',
      body: {
        type: 'object',
        required: ['username', 'password', 'email'],
        properties: {
          username: { type: 'string', description: 'Unique username' },
          password: { type: 'string', description: 'User password' },
          email: { type: 'string', format: 'email', description: 'User email address' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                email: { type: 'string' },
                created_at: { type: 'string' },
                updated_at: { type: 'string' }
              }
            },
            access_token: { type: 'string' },
            refresh_token: { type: 'string' },
            expires_in: { type: 'number' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            statusCode: { type: 'number' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, register);
  
  fastify.post('/logout', {
    schema: {
      tags: ['Authentication'],
      summary: 'User logout',
      description: 'Invalidate current session and tokens',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        401: ErrorSchema
      }
    }
  }, invalidateToken);
  
  // Token management endpoints
  fastify.post('/refresh', {
    schema: {
      tags: ['Authentication'],
      summary: 'Refresh access token',
      description: 'Generate new access token using refresh token',
      body: {
        type: 'object',
        required: ['refresh_token'],
        properties: {
          refresh_token: { type: 'string', description: 'Valid refresh token' }
        }
      },
      response: {
        200: LoginResponseSchema,
        401: ErrorSchema
      }
    }
  }, refreshToken);
  
  fastify.post('/validate', {
    schema: {
      tags: ['Authentication'],
      summary: 'Validate refresh token',
      description: 'Check if refresh token is valid',
      body: {
        type: 'object',
        required: ['refresh_token'],
        properties: {
          refresh_token: { type: 'string', description: 'Refresh token to validate' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' }
          }
        },
        400: ErrorSchema
      }
    }
  }, validateRefreshToken);
  
  // Profile management endpoints
  fastify.get('/profile', {
    schema: {
      tags: ['Profile'],
      summary: 'Get user profile',
      description: 'Retrieve current user profile information',
      security: [{ bearerAuth: [] }],
      response: {
        200: UserSchema,
        401: ErrorSchema
      }
    }
  }, getProfile);
  
  fastify.put('/profile', {
    schema: {
      tags: ['Profile'],
      summary: 'Update user profile',
      description: 'Update user profile information',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          username: { type: 'string', description: 'New username' },
          email: { type: 'string', format: 'email', description: 'New email address' }
        }
      },
      response: {
        200: UserSchema,
        400: ErrorSchema,
        401: ErrorSchema
      }
    }
  }, updateProfile);
  
  fastify.patch('/profile/password', {
    schema: {
      tags: ['Profile'],
      summary: 'Change password',
      description: 'Change user password',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['current_password', 'new_password'],
        properties: {
          current_password: { type: 'string', description: 'Current password' },
          new_password: { type: 'string', description: 'New password' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        400: ErrorSchema,
        401: ErrorSchema
      }
    }
  }, changePassword);
  
  fastify.delete('/profile', {
    schema: {
      tags: ['Profile'],
      summary: 'Delete account',
      description: 'Permanently delete user account',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        401: ErrorSchema
      }
    }
  }, deleteAccount);
  
  // Session management endpoints
  fastify.get('/sessions', {
    schema: {
      tags: ['Sessions'],
      summary: 'Get active sessions',
      description: 'Retrieve all active sessions for the user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            sessions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  created_at: { type: 'string', format: 'date-time' },
                  session_expires_at: { type: 'string', format: 'date-time' },
                  refresh_expires_at: { type: 'string', format: 'date-time' },
                  is_current: { type: 'boolean' }
                }
              }
            },
            total_sessions: { type: 'number' }
          }
        },
        401: ErrorSchema
      }
    }
  }, getActiveSessions);
  
  fastify.delete('/sessions/:id', {
    schema: {
      tags: ['Sessions'],
      summary: 'Revoke session',
      description: 'Revoke a specific session',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Session ID' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        401: ErrorSchema,
        404: ErrorSchema
      }
    }
  }, revokeSession);
  
  fastify.delete('/sessions/all', {
    schema: {
      tags: ['Sessions'],
      summary: 'Revoke all other sessions',
      description: 'Revoke all sessions except the current one',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            revoked_count: { type: 'number' }
          }
        },
        401: ErrorSchema
      }
    }
  }, revokeAllOtherSessions);
  
  fastify.get('/login-history', {
    schema: {
      tags: ['Sessions'],
      summary: 'Get login history',
      description: 'Retrieve user login history',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            login_history: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  login_at: { type: 'string', format: 'date-time' },
                  login_ip: { type: ['string', 'null'] },
                  user_agent: { type: ['string', 'null'] },
                  auth_method: { type: ['string', 'null'] }
                }
              }
            },
            total_entries: { type: 'number' },
            limit_applied: { type: 'number' }
          }
        },
        401: ErrorSchema
      }
    }
  }, getLoginHistory);
  
  // Email verification endpoints
  fastify.post('/send-verification', {
    schema: {
      tags: ['Email Verification'],
      summary: 'Send email verification',
      description: 'Send an email verification link to the specified email address',
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', description: 'User email address' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Success message' }
          }
        },
        400: ErrorSchema,
        500: ErrorSchema
      }
    }
  }, sendVerificationEmail);
  
  fastify.get('/verify-email', {
    schema: {
      tags: ['Email Verification'],
      summary: 'Verify email address',
      description: 'Verify email address using verification token',
      querystring: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', description: 'Email verification token' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Success message' },
            verified: { type: 'boolean', description: 'Verification status' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message' },
            verified: { type: 'boolean', description: 'Verification status' }
          }
        },
        500: ErrorSchema
      }
    }
  }, verifyEmail);
  
  fastify.post('/resend-verification', {
    schema: {
      tags: ['Email Verification'],
      summary: 'Resend email verification',
      description: 'Resend email verification for a user',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['user_uid'],
        properties: {
          user_uid: { type: 'string', description: 'User UID' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Success message' }
          }
        },
        400: ErrorSchema,
        500: ErrorSchema
      }
    }
  }, resendVerificationEmail);
  
  // Password reset endpoints
  fastify.post('/forgot-password', {
    schema: {
      tags: ['Password Reset'],
      summary: 'Request password reset',
      description: 'Send password reset email to user',
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', description: 'User email address' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        400: ErrorSchema
      }
    }
  }, forgotPassword);
  
  fastify.get('/reset/:token', {
    schema: {
      tags: ['Password Reset'],
      summary: 'Validate reset token',
      description: 'Check if password reset token is valid',
      params: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'Password reset token' }
        },
        required: ['token']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            email: { type: 'string', format: 'email' }
          }
        },
        400: ErrorSchema
      }
    }
  }, validateResetToken);
  
  fastify.post('/reset-password', {
    schema: {
      tags: ['Password Reset'],
      summary: 'Reset password',
      description: 'Reset user password using reset token',
      body: {
        type: 'object',
        required: ['token', 'new_password'],
        properties: {
          token: { type: 'string', description: 'Password reset token' },
          new_password: { type: 'string', description: 'New password' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        400: ErrorSchema
      }
    }
  }, resetPassword);
  
  // Health check
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Service health check',
      description: 'Check authentication service health',
      response: {
        200: HealthCheckSchema
      }
    }
  }, async (request, reply) => {
    reply.send({
      service: 'Authentication Service',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });
}
