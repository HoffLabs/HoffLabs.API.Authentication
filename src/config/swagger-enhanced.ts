import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { BACKEND_API_URL } from './environment';

// Schema definitions organized by category
export const SwaggerSchemas = {
  // Common schemas
  Error: {
    type: 'object',
    properties: {
      error: { type: 'string', description: 'Error message' },
      statusCode: { type: 'number', description: 'HTTP status code' },
      message: { type: 'string', description: 'Detailed error message' }
    },
    required: ['error', 'statusCode']
  },

  // User-related schemas
  User: {
    type: 'object',
    properties: {
      id: { type: 'integer', description: 'User ID' },
      uid: { type: 'string', description: 'Unique user identifier', pattern: '^[0-9a-f]{64}$' },
      avatar: { type: 'string', nullable: true, description: 'User avatar URL' },
      username: { type: 'string', description: 'Username', minLength: 3, maxLength: 50 },
      username_hash: { type: 'string', description: 'Hashed username for security' },
      email: { type: 'string', format: 'email', description: 'User email address' },
      email_hash: { type: 'string', description: 'Hashed email for security' },
      first_name: { type: 'string', nullable: true, description: 'User first name' },
      last_name: { type: 'string', nullable: true, description: 'User last name' },
      role_id: { type: 'integer', description: 'User role ID', default: 3 },
      sub_roles: { type: 'array', items: { type: 'integer' }, description: 'Additional sub-roles' },
      is_active: { type: 'boolean', description: 'Account status', default: true },
      mfa_enabled: { type: 'boolean', description: 'Multi-factor authentication status', default: false },
      mfa_method_id: { type: 'integer', description: 'MFA method ID', default: 1 },
      email_verified: { type: 'boolean', description: 'Email verification status', default: false },
      created_at: { type: 'string', format: 'date-time', description: 'Account creation timestamp' },
      updated_at: { type: 'string', format: 'date-time', nullable: true, description: 'Last update timestamp' },
      login_attempts: { type: 'integer', description: 'Failed login attempts', default: 0 },
      locked_until: { type: 'string', format: 'date-time', nullable: true, description: 'Account lock expiry' },
      is_banned: { type: 'boolean', description: 'Ban status', default: false },
      is_shadowbanned: { type: 'boolean', description: 'Shadow ban status', default: false },
      ban_reason: { type: 'string', nullable: true, description: 'Reason for ban' }
    },
    required: ['id', 'uid', 'username', 'email', 'role_id', 'created_at']
  },

  UserRegistration: {
    type: 'object',
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 50, description: 'Unique username' },
      email: { type: 'string', format: 'email', description: 'Valid email address' },
      password: { type: 'string', minLength: 8, description: 'Strong password (min 8 characters)' },
      first_name: { type: 'string', maxLength: 100, description: 'First name (optional)' },
      last_name: { type: 'string', maxLength: 100, description: 'Last name (optional)' }
    },
    required: ['username', 'email', 'password'],
    example: {
      username: 'johnsmith',
      email: 'john@example.com',
      password: 'StrongPassword123!',
      first_name: 'John',
      last_name: 'Smith'
    }
  },

  UserLogin: {
    type: 'object',
    properties: {
      username: { type: 'string', description: 'Username or email address' },
      password: { type: 'string', description: 'User password' }
    },
    required: ['username', 'password'],
    example: {
      username: 'johnsmith',
      password: 'StrongPassword123!'
    }
  },

  // Authentication response schemas
  LoginResponse: {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          uid: { type: 'string' },
          username: { type: 'string' },
          email: { type: 'string' },
          email_verified: { type: 'boolean' },
          first_name: { type: 'string', nullable: true },
          last_name: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      access_token: { type: 'string', description: 'JWT access token' },
      refresh_token: { type: 'string', description: 'Refresh token for getting new access tokens' },
      expires_in: { type: 'number', description: 'Access token expiry time in seconds' }
    },
    required: ['user', 'access_token', 'refresh_token', 'expires_in']
  },

  // Role and permission schemas
  Role: {
    type: 'object',
    properties: {
      id: { type: 'integer', description: 'Role ID' },
      name: { type: 'string', description: 'Role name' },
      description: { type: 'string', description: 'Role description' }
    },
    required: ['id', 'name']
  },

  // Session schemas
  Session: {
    type: 'object',
    properties: {
      id: { type: 'integer', description: 'Session ID' },
      user_uid: { type: 'string', description: 'User UID' },
      session_token: { type: 'string', description: 'Encrypted session token' },
      refresh_token: { type: 'string', description: 'Encrypted refresh token' },
      session_expires_at: { type: 'string', format: 'date-time', description: 'Session expiry time' },
      refresh_expires_at: { type: 'string', format: 'date-time', description: 'Refresh token expiry time' },
      created_at: { type: 'string', format: 'date-time', description: 'Session creation time' }
    },
    required: ['id', 'user_uid', 'session_expires_at', 'created_at']
  },

  LoginHistory: {
    type: 'object',
    properties: {
      id: { type: 'integer', description: 'History record ID' },
      user_uid: { type: 'string', description: 'User UID' },
      login_at: { type: 'string', format: 'date-time', description: 'Login timestamp' },
      login_ip: { type: 'string', nullable: true, description: 'IP address' },
      user_agent: { type: 'string', nullable: true, description: 'User agent string' },
      auth_method: { type: 'string', nullable: true, description: 'Authentication method used' }
    },
    required: ['id', 'user_uid', 'login_at']
  },

  // Token schemas
  TokenInfo: {
    type: 'object',
    properties: {
      valid: { type: 'boolean', description: 'Token validity status' },
      decoded: { 
        type: 'object',
        properties: {
          sub: { type: 'string', description: 'Subject (user UID)' },
          iat: { type: 'number', description: 'Issued at timestamp' },
          exp: { type: 'number', description: 'Expiry timestamp' },
          aud: { type: 'string', description: 'Audience' },
          iss: { type: 'string', description: 'Issuer' }
        }
      },
      expires_at: { type: 'string', format: 'date-time', description: 'Token expiry date' }
    },
    required: ['valid']
  },

  RefreshTokenRequest: {
    type: 'object',
    properties: {
      refresh_token: { type: 'string', description: 'Valid refresh token' }
    },
    required: ['refresh_token'],
    example: {
      refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  },

  // Password reset schemas
  ForgotPasswordRequest: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email', description: 'Registered email address' }
    },
    required: ['email'],
    example: {
      email: 'user@example.com'
    }
  },

  ResetPasswordRequest: {
    type: 'object',
    properties: {
      token: { type: 'string', description: 'Password reset token from email' },
      new_password: { type: 'string', minLength: 8, description: 'New password' }
    },
    required: ['token', 'new_password'],
    example: {
      token: 'reset_token_here',
      new_password: 'NewStrongPassword123!'
    }
  },

  ChangePasswordRequest: {
    type: 'object',
    properties: {
      current_password: { type: 'string', description: 'Current password' },
      new_password: { type: 'string', minLength: 8, description: 'New password' }
    },
    required: ['current_password', 'new_password']
  },

  // Email verification schemas
  EmailVerificationRequest: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email', description: 'Email address to verify' }
    },
    required: ['email']
  },

  // Health check schema
  HealthCheck: {
    type: 'object',
    properties: {
      service: { type: 'string', description: 'Service name' },
      status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'], description: 'Service status' },
      timestamp: { type: 'string', format: 'date-time', description: 'Health check timestamp' },
      version: { type: 'string', description: 'Service version' },
      database: { 
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['connected', 'disconnected'] },
          response_time: { type: 'number', description: 'Database response time in ms' }
        }
      }
    },
    required: ['service', 'status', 'timestamp']
  },

  // Generic response schemas
  SuccessMessage: {
    type: 'object',
    properties: {
      message: { type: 'string', description: 'Success message' },
      timestamp: { type: 'string', format: 'date-time', description: 'Response timestamp' }
    },
    required: ['message']
  },

  ValidationError: {
    type: 'object',
    properties: {
      error: { type: 'string', description: 'Validation error message' },
      statusCode: { type: 'number', default: 400 },
      validation: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string', description: 'Field name that failed validation' },
            message: { type: 'string', description: 'Validation error message' },
            value: { description: 'Invalid value that was provided' }
          }
        }
      }
    },
    required: ['error', 'statusCode']
  }
};

// Tag definitions with descriptions
export const SwaggerTags = [
  {
    name: 'Authentication',
    description: 'User authentication endpoints including login, registration, and logout'
  },
  {
    name: 'JWT',
    description: 'JWT token utilities for verification, decoding, and analysis'
  },
  {
    name: 'Profile',
    description: 'User profile management including updates, password changes, and account deletion'
  },
  {
    name: 'Sessions',
    description: 'Session management including active sessions, revocation, and login history'
  },
  {
    name: 'Password Reset',
    description: 'Password reset functionality including forgot password and reset confirmation'
  },
  {
    name: 'Email Verification',
    description: 'Email verification processes for account security'
  },
  {
    name: 'Health',
    description: 'Service health checks and system status monitoring'
  }
];

// Security definitions
export const SwaggerSecurity = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT token obtained from /auth/login endpoint'
  },
  cookieAuth: {
    type: 'apiKey',
    in: 'cookie',
    name: 'session',
    description: 'Session cookie for browser-based authentication'
  }
};

// Enhanced Swagger configuration
export const registerEnhancedSwagger = async (fastify: FastifyInstance) => {
  const currentUrl = new URL(BACKEND_API_URL);
  
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'HoffLabs Authentication API',
        description: `
# HoffLabs Private Authentication API

A comprehensive authentication and user management system built with Fastify and PostgreSQL.

## Features
- 🔐 Secure user authentication with JWT tokens
- 🔑 Password reset and email verification
- 👤 User profile management
- 📱 Session management across devices
- 🛡️ Rate limiting and account lockout protection
- 📊 Login history and audit trails
- 🔧 JWT utilities and token analysis

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting
All endpoints are rate-limited to prevent abuse. Default limits:
- 100 requests per minute per IP
- Additional limits on sensitive endpoints (login, registration)

## Error Handling
All endpoints return consistent error responses with:
- \`error\`: Human-readable error message
- \`statusCode\`: HTTP status code
- \`message\`: Detailed error information (in development)
        `,
        version: '1.0.0',
        contact: {
          name: 'HoffLabs API Support',
          email: 'api-support@hofflabs.com',
          url: 'https://hofflabs.com/support'
        },
        license: {
          name: 'Private License',
          url: 'https://hofflabs.com/license'
        }
      },
      servers: [
        {
          url: currentUrl.origin,
          description: 'Development server'
        },
        {
          url: 'https://api.hofflabs.com',
          description: 'Production server'
        }
      ],
      tags: SwaggerTags,
      components: {
        schemas: SwaggerSchemas,
        securitySchemes: SwaggerSecurity,
        parameters: {
          UserUID: {
            name: 'uid',
            in: 'path',
            required: true,
            description: 'User unique identifier',
            schema: {
              type: 'string',
              pattern: '^[0-9a-f]{64}$'
            }
          },
          SessionID: {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Session ID',
            schema: {
              type: 'integer',
              minimum: 1
            }
          },
          ResetToken: {
            name: 'token',
            in: 'path',
            required: true,
            description: 'Password reset token',
            schema: {
              type: 'string',
              minLength: 32
            }
          }
        },
        responses: {
          UnauthorizedError: {
            description: 'Authentication required or invalid token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: {
                  error: 'Unauthorized',
                  statusCode: 401,
                  message: 'Invalid or missing authentication token'
                }
              }
            }
          },
          ValidationError: {
            description: 'Request validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          },
          NotFoundError: {
            description: 'Resource not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: {
                  error: 'Not Found',
                  statusCode: 404,
                  message: 'The requested resource was not found'
                }
              }
            }
          },
          RateLimitError: {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: {
                  error: 'Too Many Requests',
                  statusCode: 429,
                  message: 'Rate limit exceeded. Please try again later.'
                }
              }
            }
          },
          AccountLockedError: {
            description: 'Account is locked due to multiple failed login attempts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    statusCode: { type: 'number' },
                    locked: { type: 'boolean' },
                    locked_until: { type: 'string', format: 'date-time' },
                    attempts_remaining: { type: 'number' }
                  }
                },
                example: {
                  error: 'Account Locked',
                  statusCode: 423,
                  locked: true,
                  locked_until: '2024-01-01T12:00:00.000Z',
                  attempts_remaining: 0
                }
              }
            }
          }
        }
      }
    }
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayOperationId: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        // Add custom CSS or modify request if needed
        next();
      }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => {
      // Add runtime information
      swaggerObject.info.description += `\n\n**Server Time**: ${new Date().toISOString()}\n**Request ID**: ${request.id || 'N/A'}`;
      return swaggerObject;
    },
    transformSpecificationClone: true
  });

  // Add route to get OpenAPI spec as JSON
  fastify.get('/api-spec.json', {
    schema: {
      tags: ['Documentation'],
      summary: 'Get OpenAPI specification',
      description: 'Returns the complete OpenAPI specification as JSON',
      response: {
        200: {
          type: 'object',
          description: 'OpenAPI specification'
        }
      }
    }
  }, async (request, reply) => {
    reply.send(fastify.swagger());
  });
};

export default registerEnhancedSwagger;
