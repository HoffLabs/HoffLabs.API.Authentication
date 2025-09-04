import { FastifySchema } from 'fastify';

// Utility types for better type safety
export interface RouteSchemaBuilder {
  tag: string;
  summary: string;
  description?: string;
  authenticated?: boolean;
  body?: any;
  querystring?: any;
  params?: any;
  response?: Record<number, any>;
  examples?: Record<string, any>;
}

// Common response schemas
export const CommonResponses = {
  Success: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['message']
    }
  },
  
  NotFound: {
    404: {
      $ref: '#/components/schemas/Error'
    }
  },
  
  Unauthorized: {
    401: {
      $ref: '#/components/schemas/Error'
    }
  },
  
  ValidationError: {
    400: {
      $ref: '#/components/schemas/ValidationError'
    }
  },
  
  RateLimit: {
    429: {
      $ref: '#/components/schemas/Error'
    }
  },
  
  AccountLocked: {
    423: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        statusCode: { type: 'number' },
        locked: { type: 'boolean' },
        locked_until: { type: 'string', format: 'date-time' },
        attempts_remaining: { type: 'number' }
      }
    }
  }
};

// Schema builder function
export function buildRouteSchema(config: RouteSchemaBuilder): FastifySchema {
  const schema: FastifySchema = {
    tags: [config.tag],
    summary: config.summary,
    description: config.description || config.summary
  };

  // Add authentication if required
  if (config.authenticated) {
    schema.security = [{ bearerAuth: [] }];
  }

  // Add request schemas
  if (config.body) {
    schema.body = config.body;
  }
  
  if (config.querystring) {
    schema.querystring = config.querystring;
  }
  
  if (config.params) {
    schema.params = config.params;
  }

  // Build response schema
  const responses: Record<number, any> = {};
  
  if (config.response) {
    Object.assign(responses, config.response);
  }

  // Add common error responses
  if (config.authenticated) {
    responses[401] = CommonResponses.Unauthorized[401];
  }
  
  responses[400] = CommonResponses.ValidationError[400];
  responses[429] = CommonResponses.RateLimit[429];

  schema.response = responses;

  return schema;
}

// Pre-built schema configurations for common patterns
export const SchemaConfigs = {
  // Authentication schemas
  Login: buildRouteSchema({
    tag: 'Authentication',
    summary: 'User login',
    description: 'Authenticate user with username/email and password',
    body: { $ref: '#/components/schemas/UserLogin' },
    response: {
      200: { $ref: '#/components/schemas/LoginResponse' },
      423: CommonResponses.AccountLocked[423]
    }
  }),

  Register: buildRouteSchema({
    tag: 'Authentication',
    summary: 'User registration',
    description: 'Create a new user account',
    body: { $ref: '#/components/schemas/UserRegistration' },
    response: {
      201: { $ref: '#/components/schemas/LoginResponse' }
    }
  }),

  Logout: buildRouteSchema({
    tag: 'Authentication',
    summary: 'User logout',
    description: 'Invalidate current session and tokens',
    authenticated: true,
    response: {
      200: CommonResponses.Success[200]
    }
  }),

  RefreshToken: buildRouteSchema({
    tag: 'Authentication',
    summary: 'Refresh access token',
    description: 'Generate new access token using refresh token',
    body: { $ref: '#/components/schemas/RefreshTokenRequest' },
    response: {
      200: { $ref: '#/components/schemas/LoginResponse' }
    }
  }),

  // Profile schemas
  GetProfile: buildRouteSchema({
    tag: 'Profile',
    summary: 'Get user profile',
    description: 'Retrieve current user profile information',
    authenticated: true,
    response: {
      200: { $ref: '#/components/schemas/User' }
    }
  }),

  UpdateProfile: buildRouteSchema({
    tag: 'Profile',
    summary: 'Update user profile',
    description: 'Update user profile information',
    authenticated: true,
    body: {
      type: 'object',
      properties: {
        username: { type: 'string', minLength: 3, maxLength: 50 },
        email: { type: 'string', format: 'email' },
        first_name: { type: 'string', maxLength: 100 },
        last_name: { type: 'string', maxLength: 100 }
      },
      additionalProperties: false
    },
    response: {
      200: { $ref: '#/components/schemas/User' }
    }
  }),

  ChangePassword: buildRouteSchema({
    tag: 'Profile',
    summary: 'Change password',
    description: 'Change user password with current password verification',
    authenticated: true,
    body: { $ref: '#/components/schemas/ChangePasswordRequest' },
    response: {
      200: CommonResponses.Success[200]
    }
  }),

  DeleteAccount: buildRouteSchema({
    tag: 'Profile',
    summary: 'Delete account',
    description: 'Permanently delete user account and all associated data',
    authenticated: true,
    response: {
      200: CommonResponses.Success[200]
    }
  }),

  // Session management schemas
  GetSessions: buildRouteSchema({
    tag: 'Sessions',
    summary: 'Get active sessions',
    description: 'Retrieve all active sessions for the authenticated user',
    authenticated: true,
    response: {
      200: {
        type: 'array',
        items: { $ref: '#/components/schemas/Session' }
      }
    }
  }),

  RevokeSession: buildRouteSchema({
    tag: 'Sessions',
    summary: 'Revoke session',
    description: 'Revoke a specific user session',
    authenticated: true,
    params: {
      type: 'object',
      properties: {
        id: { $ref: '#/components/parameters/SessionID/schema' }
      },
      required: ['id']
    },
    response: {
      200: CommonResponses.Success[200],
      404: CommonResponses.NotFound[404]
    }
  }),

  GetLoginHistory: buildRouteSchema({
    tag: 'Sessions',
    summary: 'Get login history',
    description: 'Retrieve user login history with optional pagination',
    authenticated: true,
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        offset: { type: 'integer', minimum: 0, default: 0 }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/LoginHistory' }
          },
          pagination: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              limit: { type: 'integer' },
              offset: { type: 'integer' },
              has_more: { type: 'boolean' }
            }
          }
        }
      }
    }
  }),

  // Password reset schemas
  ForgotPassword: buildRouteSchema({
    tag: 'Password Reset',
    summary: 'Request password reset',
    description: 'Send password reset email to registered user',
    body: { $ref: '#/components/schemas/ForgotPasswordRequest' },
    response: {
      200: CommonResponses.Success[200]
    }
  }),

  ValidateResetToken: buildRouteSchema({
    tag: 'Password Reset',
    summary: 'Validate reset token',
    description: 'Check if password reset token is valid and not expired',
    params: {
      type: 'object',
      properties: {
        token: { $ref: '#/components/parameters/ResetToken/schema' }
      },
      required: ['token']
    },
    response: {
      200: {
        type: 'object',
        properties: {
          valid: { type: 'boolean' },
          email: { type: 'string', format: 'email' }
        },
        required: ['valid']
      }
    }
  }),

  ResetPassword: buildRouteSchema({
    tag: 'Password Reset',
    summary: 'Reset password',
    description: 'Reset user password using valid reset token',
    body: { $ref: '#/components/schemas/ResetPasswordRequest' },
    response: {
      200: CommonResponses.Success[200]
    }
  }),

  // Email verification schemas
  SendEmailVerification: buildRouteSchema({
    tag: 'Email Verification',
    summary: 'Send email verification',
    description: 'Send verification email to specified address',
    body: { $ref: '#/components/schemas/EmailVerificationRequest' },
    response: {
      200: CommonResponses.Success[200]
    }
  }),

  VerifyEmail: buildRouteSchema({
    tag: 'Email Verification',
    summary: 'Verify email address',
    description: 'Verify email address using token from verification email',
    querystring: {
      type: 'object',
      properties: {
        token: { type: 'string', minLength: 32, description: 'Email verification token' }
      },
      required: ['token']
    },
    response: {
      200: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          verified: { type: 'boolean' }
        },
        required: ['message', 'verified']
      }
    }
  }),

  ResendEmailVerification: buildRouteSchema({
    tag: 'Email Verification',
    summary: 'Resend email verification',
    description: 'Resend verification email for authenticated user',
    authenticated: true,
    response: {
      200: CommonResponses.Success[200]
    }
  }),

  // JWT utility schemas
  VerifyJWT: buildRouteSchema({
    tag: 'JWT',
    summary: 'Verify JWT token',
    description: 'Verify JWT token signature and validity',
    body: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'JWT token to verify' }
      },
      required: ['token']
    },
    response: {
      200: {
        type: 'object',
        properties: {
          valid: { type: 'boolean' },
          payload: { type: 'object' }
        },
        required: ['valid']
      }
    }
  }),

  DecodeJWT: buildRouteSchema({
    tag: 'JWT',
    summary: 'Decode JWT token',
    description: 'Decode JWT token without signature verification',
    body: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'JWT token to decode' }
      },
      required: ['token']
    },
    response: {
      200: {
        type: 'object',
        properties: {
          header: { type: 'object' },
          payload: { type: 'object' },
          signature: { type: 'string' }
        }
      }
    }
  }),

  GetTokenInfo: buildRouteSchema({
    tag: 'JWT',
    summary: 'Get token information',
    description: 'Get detailed information about a JWT token',
    body: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'JWT token to analyze' }
      },
      required: ['token']
    },
    response: {
      200: { $ref: '#/components/schemas/TokenInfo' }
    }
  }),

  // Health check schemas
  HealthCheck: buildRouteSchema({
    tag: 'Health',
    summary: 'Service health check',
    description: 'Check service health and database connectivity',
    response: {
      200: { $ref: '#/components/schemas/HealthCheck' },
      503: {
        type: 'object',
        properties: {
          service: { type: 'string' },
          status: { type: 'string', enum: ['unhealthy'] },
          timestamp: { type: 'string', format: 'date-time' },
          errors: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    }
  })
};

// Export individual schemas for easy importing
export const {
  Login,
  Register,
  Logout,
  RefreshToken,
  GetProfile,
  UpdateProfile,
  ChangePassword,
  DeleteAccount,
  GetSessions,
  RevokeSession,
  GetLoginHistory,
  ForgotPassword,
  ValidateResetToken,
  ResetPassword,
  SendEmailVerification,
  VerifyEmail,
  ResendEmailVerification,
  VerifyJWT,
  DecodeJWT,
  GetTokenInfo,
  HealthCheck
} = SchemaConfigs;
