import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export const registerSwagger = async (fastify: FastifyInstance) => {
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Hofflabs Private Authentication API',
        description: 'Private API for authentication, JWT management, and user services for Hofflabs platform',
        version: '1.0.0',
        contact: {
          name: 'Hofflabs',
          email: 'api@hofflabs.com'
        }
      },
      host: 'localhost:3030',
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'Authentication', description: 'User authentication endpoints' },
        { name: 'JWT', description: 'JWT token utilities' },
        { name: 'Profile', description: 'User profile management' },
        { name: 'Sessions', description: 'Session management' },
        { name: 'Password Reset', description: 'Password reset functionality' },
        { name: 'Health', description: 'Service health checks' }
      ],
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'JWT token in the format: Bearer {token}'
        }
      },
      definitions: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/definitions/User' },
            access_token: { type: 'string' },
            refresh_token: { type: 'string' },
            expires_in: { type: 'number' }
          }
        },
        Session: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            device_info: { type: 'string' },
            ip_address: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            last_accessed: { type: 'string', format: 'date-time' },
            is_active: { type: 'boolean' }
          }
        },
        TokenInfo: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            decoded: { type: 'object' },
            expires_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            statusCode: { type: 'number' },
            message: { type: 'string' }
          }
        },
        HealthCheck: {
          type: 'object',
          properties: {
            service: { type: 'string' },
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject) => {
      return swaggerObject;
    },
    transformSpecificationClone: true
  });
};
