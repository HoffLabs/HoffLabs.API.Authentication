import { FastifyInstance } from 'fastify';
import { ErrorSchema, HealthCheckSchema } from '../interfaces/auth/common';

export default async function emailRoutes(fastify: FastifyInstance) {
  // Email templates management
  fastify.get('/templates', {
    schema: {
      tags: ['Email Templates'],
      summary: 'Get email templates',
      description: 'Retrieve all email templates (admin only)',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          active_only: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              description: { type: 'string' },
              subject: { type: 'string' },
              html_content: { type: 'string' },
              text_content: { type: 'string' },
              variables: { type: 'array', items: { type: 'string' } },
              category: { type: 'string' },
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
      message: 'Email templates endpoint not yet implemented'
    });
  });

  fastify.post('/templates', {
    schema: {
      tags: ['Email Templates'],
      summary: 'Create email template',
      description: 'Create a new email template (admin only)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'subject', 'html_content'],
        properties: {
          name: { type: 'string', maxLength: 100 },
          description: { type: 'string' },
          subject: { type: 'string' },
          html_content: { type: 'string' },
          text_content: { type: 'string' },
          variables: { type: 'array', items: { type: 'string' } },
          category: { type: 'string' },
          is_active: { type: 'boolean' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            template_id: { type: 'integer' }
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
      message: 'Email template creation endpoint not yet implemented'
    });
  });

  fastify.get('/templates/:id', {
    schema: {
      tags: ['Email Templates'],
      summary: 'Get email template',
      description: 'Get a specific email template (admin only)',
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
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            subject: { type: 'string' },
            html_content: { type: 'string' },
            text_content: { type: 'string' },
            variables: { type: 'array', items: { type: 'string' } },
            category: { type: 'string' },
            is_active: { type: 'boolean' },
            created_by: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
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
      message: 'Email template details endpoint not yet implemented'
    });
  });

  // Email campaigns
  fastify.get('/campaigns', {
    schema: {
      tags: ['Email Campaigns'],
      summary: 'Get email campaigns',
      description: 'Retrieve all email campaigns (admin only)',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'] },
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            campaigns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  template_id: { type: 'integer' },
                  subject: { type: 'string' },
                  sender_name: { type: 'string' },
                  sender_email: { type: 'string' },
                  status: { type: 'string', enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'] },
                  scheduled_at: { type: 'string', format: 'date-time' },
                  sent_at: { type: 'string', format: 'date-time' },
                  recipient_count: { type: 'integer' },
                  delivered_count: { type: 'integer' },
                  opened_count: { type: 'integer' },
                  clicked_count: { type: 'integer' },
                  bounced_count: { type: 'integer' },
                  unsubscribed_count: { type: 'integer' },
                  created_by: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' }
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
      message: 'Email campaigns endpoint not yet implemented'
    });
  });

  fastify.post('/campaigns', {
    schema: {
      tags: ['Email Campaigns'],
      summary: 'Create email campaign',
      description: 'Create a new email campaign (admin only)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'template_id', 'subject', 'sender_name', 'sender_email'],
        properties: {
          name: { type: 'string', maxLength: 100 },
          description: { type: 'string' },
          template_id: { type: 'integer' },
          subject: { type: 'string' },
          sender_name: { type: 'string' },
          sender_email: { type: 'string', format: 'email' },
          scheduled_at: { type: 'string', format: 'date-time' },
          recipient_list_ids: { type: 'array', items: { type: 'integer' } },
          recipient_emails: { type: 'array', items: { type: 'string', format: 'email' } }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            campaign_id: { type: 'integer' }
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
      message: 'Email campaign creation endpoint not yet implemented'
    });
  });

  fastify.post('/campaigns/:id/send', {
    schema: {
      tags: ['Email Campaigns'],
      summary: 'Send email campaign',
      description: 'Send or schedule an email campaign (admin only)',
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
          send_immediately: { type: 'boolean' },
          scheduled_at: { type: 'string', format: 'date-time' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            campaign_id: { type: 'integer' },
            estimated_recipients: { type: 'integer' }
          }
        },
        401: ErrorSchema,
        403: ErrorSchema,
        404: ErrorSchema,
        400: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Send email campaign endpoint not yet implemented'
    });
  });

  // Email lists and subscribers
  fastify.get('/lists', {
    schema: {
      tags: ['Email Lists'],
      summary: 'Get email lists',
      description: 'Retrieve all email lists (admin only)',
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
              subscriber_count: { type: 'integer' },
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
      message: 'Email lists endpoint not yet implemented'
    });
  });

  fastify.post('/lists', {
    schema: {
      tags: ['Email Lists'],
      summary: 'Create email list',
      description: 'Create a new email list (admin only)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', maxLength: 100 },
          description: { type: 'string' },
          is_active: { type: 'boolean' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            list_id: { type: 'integer' }
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
      message: 'Email list creation endpoint not yet implemented'
    });
  });

  fastify.get('/lists/:id/subscribers', {
    schema: {
      tags: ['Email Lists'],
      summary: 'Get list subscribers',
      description: 'Get subscribers for a specific email list (admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      },
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['subscribed', 'unsubscribed', 'bounced'] },
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            subscribers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  email: { type: 'string', format: 'email' },
                  user_uid: { type: 'string' },
                  status: { type: 'string', enum: ['subscribed', 'unsubscribed', 'bounced'] },
                  subscribed_at: { type: 'string', format: 'date-time' },
                  unsubscribed_at: { type: 'string', format: 'date-time' },
                  metadata: { type: 'object' }
                }
              }
            },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' }
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
      message: 'List subscribers endpoint not yet implemented'
    });
  });

  // Email analytics and tracking
  fastify.get('/campaigns/:id/analytics', {
    schema: {
      tags: ['Email Analytics'],
      summary: 'Get campaign analytics',
      description: 'Get analytics for a specific email campaign (admin only)',
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
            campaign_id: { type: 'integer' },
            total_sent: { type: 'integer' },
            delivered_count: { type: 'integer' },
            opened_count: { type: 'integer' },
            clicked_count: { type: 'integer' },
            bounced_count: { type: 'integer' },
            unsubscribed_count: { type: 'integer' },
            delivery_rate: { type: 'number' },
            open_rate: { type: 'number' },
            click_rate: { type: 'number' },
            bounce_rate: { type: 'number' },
            unsubscribe_rate: { type: 'number' },
            top_links: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  clicks: { type: 'integer' }
                }
              }
            }
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
      message: 'Campaign analytics endpoint not yet implemented'
    });
  });

  // Email configuration
  fastify.get('/configuration', {
    schema: {
      tags: ['Email Configuration'],
      summary: 'Get email configuration',
      description: 'Get email service configuration (admin only)',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            provider: { type: 'string' },
            sender_domain: { type: 'string' },
            default_sender_name: { type: 'string' },
            default_sender_email: { type: 'string', format: 'email' },
            webhook_url: { type: 'string' },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        401: ErrorSchema,
        403: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Email configuration endpoint not yet implemented'
    });
  });

  fastify.patch('/configuration', {
    schema: {
      tags: ['Email Configuration'],
      summary: 'Update email configuration',
      description: 'Update email service configuration (admin only)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          provider: { type: 'string' },
          api_key: { type: 'string' },
          sender_domain: { type: 'string' },
          default_sender_name: { type: 'string' },
          default_sender_email: { type: 'string', format: 'email' },
          webhook_url: { type: 'string' },
          is_active: { type: 'boolean' }
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
        400: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Email configuration update endpoint not yet implemented'
    });
  });

  // Health check
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Email service health check',
      description: 'Check email management service health',
      response: {
        200: HealthCheckSchema
      }
    }
  }, async (request, reply) => {
    reply.send({
      service: 'Email Management Service',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });
}
