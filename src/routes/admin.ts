import { FastifyInstance } from 'fastify';
import { ErrorSchema, HealthCheckSchema } from '../interfaces/auth/common';

export default async function adminRoutes(fastify: FastifyInstance) {
  // User management endpoints
  fastify.get('/users', {
    schema: {
      tags: ['Admin - User Management'],
      summary: 'Get all users',
      description: 'Retrieve a list of all users (admin only)',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
          search: { type: 'string' },
          status: { type: 'string', enum: ['active', 'banned', 'pending'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  uid: { type: 'string' },
                  username: { type: 'string' },
                  email: { type: 'string' },
                  email_verified: { type: 'boolean' },
                  is_banned: { type: 'boolean' },
                  created_at: { type: 'string', format: 'date-time' },
                  last_login: { type: 'string', format: 'date-time' }
                }
              }
            },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' }
          }
        },
        401: ErrorSchema,
        403: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Admin user management endpoint not yet implemented'
    });
  });

  fastify.get('/users/:uid', {
    schema: {
      tags: ['Admin - User Management'],
      summary: 'Get user details',
      description: 'Get detailed information about a specific user (admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          uid: { type: 'string' }
        },
        required: ['uid']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            uid: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            email_verified: { type: 'boolean' },
            is_banned: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            last_login: { type: 'string', format: 'date-time' },
            login_count: { type: 'integer' },
            session_count: { type: 'integer' }
          }
        },
        401: ErrorSchema,
        403: ErrorSchema,
        404: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Admin user details endpoint not yet implemented'
    });
  });

  fastify.patch('/users/:uid/ban', {
    schema: {
      tags: ['Admin - User Management'],
      summary: 'Ban user',
      description: 'Ban or unban a user (admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          uid: { type: 'string' }
        },
        required: ['uid']
      },
      body: {
        type: 'object',
        required: ['banned'],
        properties: {
          banned: { type: 'boolean' },
          reason: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        401: ErrorSchema,
        403: ErrorSchema,
        404: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Admin user ban endpoint not yet implemented'
    });
  });

  // System stats endpoints
  fastify.get('/stats', {
    schema: {
      tags: ['Admin - System'],
      summary: 'Get system statistics',
      description: 'Get overall system statistics (admin only)',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            total_users: { type: 'integer' },
            active_users: { type: 'integer' },
            banned_users: { type: 'integer' },
            verified_users: { type: 'integer' },
            mfa_enabled_users: { type: 'integer' },
            total_sessions: { type: 'integer' },
            recent_registrations: { type: 'integer' },
            recent_logins: { type: 'integer' }
          }
        },
        401: ErrorSchema,
        403: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Admin statistics endpoint not yet implemented'
    });
  });

  // Audit logs
  fastify.get('/audit-logs', {
    schema: {
      tags: ['Admin - Audit'],
      summary: 'Get audit logs',
      description: 'Retrieve system audit logs (admin only)',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
          user_uid: { type: 'string' },
          action: { type: 'string' },
          resource: { type: 'string' },
          start_date: { type: 'string', format: 'date-time' },
          end_date: { type: 'string', format: 'date-time' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            logs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  user_uid: { type: 'string' },
                  action: { type: 'string' },
                  resource: { type: 'string' },
                  resource_id: { type: 'string' },
                  details: { type: 'object' },
                  ip_address: { type: 'string' },
                  user_agent: { type: 'string' },
                  success: { type: 'boolean' },
                  created_at: { type: 'string', format: 'date-time' }
                }
              }
            },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' }
          }
        },
        401: ErrorSchema,
        403: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Admin audit logs endpoint not yet implemented'
    });
  });

  // Feature flags
  fastify.get('/feature-flags', {
    schema: {
      tags: ['Admin - Feature Flags'],
      summary: 'Get feature flags',
      description: 'Retrieve all feature flags (admin only)',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              description: { type: 'string' },
              is_enabled: { type: 'boolean' },
              rollout_percentage: { type: 'number' },
              conditions: { type: 'object' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' }
            }
          }
        },
        401: ErrorSchema,
        403: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Admin feature flags endpoint not yet implemented'
    });
  });

  fastify.patch('/feature-flags/:id', {
    schema: {
      tags: ['Admin - Feature Flags'],
      summary: 'Update feature flag',
      description: 'Update a feature flag configuration (admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          is_enabled: { type: 'boolean' },
          rollout_percentage: { type: 'number', minimum: 0, maximum: 100 },
          conditions: { type: 'object' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        401: ErrorSchema,
        403: ErrorSchema,
        404: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Admin feature flag update endpoint not yet implemented'
    });
  });

  // Health check
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Admin service health check',
      description: 'Check admin service health',
      response: {
        200: HealthCheckSchema
      }
    }
  }, async (request, reply) => {
    reply.send({
      service: 'Admin Service',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });
}
