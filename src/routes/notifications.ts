import { FastifyInstance } from 'fastify';
import { ErrorSchema, HealthCheckSchema } from '../interfaces/auth/common';

export default async function notificationRoutes(fastify: FastifyInstance) {
  // User notifications
  fastify.get('/user', {
    schema: {
      tags: ['Notifications'],
      summary: 'Get user notifications',
      description: 'Retrieve notifications for the current user',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          unread_only: { type: 'boolean' },
          type: { type: 'string', enum: ['info', 'warning', 'error', 'success', 'security'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
          offset: { type: 'integer', minimum: 0 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            notifications: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  title: { type: 'string' },
                  message: { type: 'string' },
                  type: { type: 'string', enum: ['info', 'warning', 'error', 'success', 'security'] },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                  is_read: { type: 'boolean' },
                  is_actionable: { type: 'boolean' },
                  action_url: { type: 'string' },
                  action_text: { type: 'string' },
                  metadata: { type: 'object' },
                  expires_at: { type: 'string', format: 'date-time' },
                  created_at: { type: 'string', format: 'date-time' },
                  read_at: { type: 'string', format: 'date-time' }
                }
              }
            },
            total: { type: 'integer' },
            unread_count: { type: 'integer' }
          }
        },
        401: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'User notifications endpoint not yet implemented'
    });
  });

  fastify.patch('/user/:id/read', {
    schema: {
      tags: ['Notifications'],
      summary: 'Mark notification as read',
      description: 'Mark a specific notification as read',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
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
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Mark notification as read endpoint not yet implemented'
    });
  });

  fastify.patch('/user/read-all', {
    schema: {
      tags: ['Notifications'],
      summary: 'Mark all notifications as read',
      description: 'Mark all notifications as read for the current user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            updated_count: { type: 'integer' }
          }
        },
        401: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Mark all notifications as read endpoint not yet implemented'
    });
  });

  fastify.delete('/user/:id', {
    schema: {
      tags: ['Notifications'],
      summary: 'Delete notification',
      description: 'Delete a specific notification',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
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
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Delete notification endpoint not yet implemented'
    });
  });

  // Notification preferences
  fastify.get('/preferences', {
    schema: {
      tags: ['Notification Preferences'],
      summary: 'Get notification preferences',
      description: 'Retrieve notification preferences for the current user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              notification_type: { type: 'string' },
              email_enabled: { type: 'boolean' },
              push_enabled: { type: 'boolean' },
              sms_enabled: { type: 'boolean' },
              in_app_enabled: { type: 'boolean' },
              frequency: { type: 'string', enum: ['immediate', 'daily', 'weekly', 'disabled'] },
              quiet_hours_start: { type: 'string' },
              quiet_hours_end: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' }
            }
          }
        },
        401: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Notification preferences endpoint not yet implemented'
    });
  });

  fastify.patch('/preferences/:id', {
    schema: {
      tags: ['Notification Preferences'],
      summary: 'Update notification preference',
      description: 'Update a specific notification preference',
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
          email_enabled: { type: 'boolean' },
          push_enabled: { type: 'boolean' },
          sms_enabled: { type: 'boolean' },
          in_app_enabled: { type: 'boolean' },
          frequency: { type: 'string', enum: ['immediate', 'daily', 'weekly', 'disabled'] },
          quiet_hours_start: { type: 'string' },
          quiet_hours_end: { type: 'string' }
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
        404: ErrorSchema,
        400: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Update notification preference endpoint not yet implemented'
    });
  });

  // Global notification settings
  fastify.get('/settings', {
    schema: {
      tags: ['Notification Settings'],
      summary: 'Get notification settings',
      description: 'Retrieve global notification settings for the current user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            global_email_enabled: { type: 'boolean' },
            global_push_enabled: { type: 'boolean' },
            global_sms_enabled: { type: 'boolean' },
            timezone: { type: 'string' },
            language: { type: 'string' },
            digest_frequency: { type: 'string', enum: ['never', 'daily', 'weekly'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        401: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Notification settings endpoint not yet implemented'
    });
  });

  fastify.patch('/settings', {
    schema: {
      tags: ['Notification Settings'],
      summary: 'Update notification settings',
      description: 'Update global notification settings for the current user',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          global_email_enabled: { type: 'boolean' },
          global_push_enabled: { type: 'boolean' },
          global_sms_enabled: { type: 'boolean' },
          timezone: { type: 'string' },
          language: { type: 'string' },
          digest_frequency: { type: 'string', enum: ['never', 'daily', 'weekly'] }
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
        400: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Update notification settings endpoint not yet implemented'
    });
  });

  // Admin endpoints (for managing templates and sending notifications)
  fastify.get('/templates', {
    schema: {
      tags: ['Notification Templates'],
      summary: 'Get notification templates',
      description: 'Retrieve notification templates (admin only)',
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
              type: { type: 'string', enum: ['email', 'push', 'sms', 'in_app'] },
              subject_template: { type: 'string' },
              body_template: { type: 'string' },
              variables: { type: 'array', items: { type: 'string' } },
              is_active: { type: 'boolean' },
              created_by: { type: 'string' },
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
      message: 'Notification templates endpoint not yet implemented'
    });
  });

  fastify.post('/send', {
    schema: {
      tags: ['Notification Management'],
      summary: 'Send notification',
      description: 'Send a notification to user(s) (admin only)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['title', 'message', 'recipients'],
        properties: {
          title: { type: 'string' },
          message: { type: 'string' },
          type: { type: 'string', enum: ['info', 'warning', 'error', 'success', 'security'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          recipients: { type: 'array', items: { type: 'string' } },
          delivery_methods: { type: 'array', items: { type: 'string', enum: ['email', 'push', 'sms', 'in_app'] } },
          action_url: { type: 'string' },
          action_text: { type: 'string' },
          expires_at: { type: 'string', format: 'date-time' },
          scheduled_at: { type: 'string', format: 'date-time' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            notification_id: { type: 'integer' },
            recipients_count: { type: 'integer' }
          }
        },
        401: ErrorSchema,
        403: ErrorSchema,
        400: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Send notification endpoint not yet implemented'
    });
  });

  // Health check
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Notifications service health check',
      description: 'Check notifications service health',
      response: {
        200: HealthCheckSchema
      }
    }
  }, async (request, reply) => {
    reply.send({
      service: 'Notifications Service',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });
}
