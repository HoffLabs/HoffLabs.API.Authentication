import { FastifyInstance } from 'fastify';
import { ErrorSchema, HealthCheckSchema } from '../interfaces/auth/common';

export default async function deviceRoutes(fastify: FastifyInstance) {
  // Device management
  fastify.get('/user-devices', {
    schema: {
      tags: ['Device Management'],
      summary: 'Get user devices',
      description: 'Retrieve all devices associated with the current user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              device_id: { type: 'string' },
              device_name: { type: 'string' },
              device_type: { type: 'string', enum: ['mobile', 'desktop', 'tablet', 'other'] },
              operating_system: { type: 'string' },
              browser: { type: 'string' },
              ip_address: { type: 'string' },
              location: { type: 'string' },
              is_trusted: { type: 'boolean' },
              is_active: { type: 'boolean' },
              last_used: { type: 'string', format: 'date-time' },
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
      message: 'User devices endpoint not yet implemented'
    });
  });

  fastify.get('/devices/:id', {
    schema: {
      tags: ['Device Management'],
      summary: 'Get device details',
      description: 'Get detailed information about a specific device',
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
            device_id: { type: 'string' },
            device_name: { type: 'string' },
            device_type: { type: 'string', enum: ['mobile', 'desktop', 'tablet', 'other'] },
            operating_system: { type: 'string' },
            browser: { type: 'string' },
            ip_address: { type: 'string' },
            location: { type: 'string' },
            is_trusted: { type: 'boolean' },
            is_active: { type: 'boolean' },
            last_used: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            sessions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  session_id: { type: 'string' },
                  started_at: { type: 'string', format: 'date-time' },
                  ended_at: { type: 'string', format: 'date-time' },
                  is_active: { type: 'boolean' }
                }
              }
            }
          }
        },
        401: ErrorSchema,
        404: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Device details endpoint not yet implemented'
    });
  });

  fastify.patch('/devices/:id/trust', {
    schema: {
      tags: ['Device Management'],
      summary: 'Trust/untrust device',
      description: 'Mark a device as trusted or untrusted',
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
        required: ['trusted'],
        properties: {
          trusted: { type: 'boolean' },
          expires_at: { type: 'string', format: 'date-time' }
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
        404: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Device trust management endpoint not yet implemented'
    });
  });

  fastify.patch('/devices/:id/name', {
    schema: {
      tags: ['Device Management'],
      summary: 'Update device name',
      description: 'Update the name of a device',
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
        required: ['device_name'],
        properties: {
          device_name: { type: 'string', maxLength: 100 }
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
      message: 'Device name update endpoint not yet implemented'
    });
  });

  // Device security events
  fastify.get('/devices/:id/security-events', {
    schema: {
      tags: ['Device Security'],
      summary: 'Get device security events',
      description: 'Retrieve security events for a specific device',
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
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          event_type: { type: 'string', enum: ['login_attempt', 'suspicious_activity', 'location_change', 'new_device'] },
          limit: { type: 'integer', minimum: 1, maximum: 100 }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              event_type: { type: 'string', enum: ['login_attempt', 'suspicious_activity', 'location_change', 'new_device'] },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              ip_address: { type: 'string' },
              location: { type: 'string' },
              user_agent: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' }
            }
          }
        },
        401: ErrorSchema,
        404: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Device security events endpoint not yet implemented'
    });
  });

  // Device fingerprinting
  fastify.get('/devices/:id/fingerprint', {
    schema: {
      tags: ['Device Security'],
      summary: 'Get device fingerprint',
      description: 'Retrieve device fingerprint information',
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
            fingerprint_hash: { type: 'string' },
            screen_resolution: { type: 'string' },
            timezone: { type: 'string' },
            language: { type: 'string' },
            platform: { type: 'string' },
            webgl_vendor: { type: 'string' },
            webgl_renderer: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        401: ErrorSchema,
        404: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Device fingerprint endpoint not yet implemented'
    });
  });

  fastify.post('/devices/fingerprint', {
    schema: {
      tags: ['Device Security'],
      summary: 'Update device fingerprint',
      description: 'Update or create device fingerprint information',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['device_id'],
        properties: {
          device_id: { type: 'integer' },
          screen_resolution: { type: 'string' },
          timezone: { type: 'string' },
          language: { type: 'string' },
          platform: { type: 'string' },
          webgl_vendor: { type: 'string' },
          webgl_renderer: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            fingerprint_id: { type: 'integer' }
          }
        },
        401: ErrorSchema,
        400: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Device fingerprint update endpoint not yet implemented'
    });
  });

  // Trusted devices management
  fastify.get('/trusted-devices', {
    schema: {
      tags: ['Device Security'],
      summary: 'Get trusted devices',
      description: 'Retrieve all trusted devices for the current user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              device_id: { type: 'integer' },
              trusted_at: { type: 'string', format: 'date-time' },
              trusted_by: { type: 'string' },
              expires_at: { type: 'string', format: 'date-time' },
              is_active: { type: 'boolean' },
              device: {
                type: 'object',
                properties: {
                  device_name: { type: 'string' },
                  device_type: { type: 'string' },
                  operating_system: { type: 'string' },
                  browser: { type: 'string' }
                }
              }
            }
          }
        },
        401: ErrorSchema
      }
    }
  }, async (request, reply) => {
    reply.status(501).send({
      error: 'Not Implemented',
      message: 'Trusted devices endpoint not yet implemented'
    });
  });

  // Health check
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Device service health check',
      description: 'Check device management service health',
      response: {
        200: HealthCheckSchema
      }
    }
  }, async (request, reply) => {
    reply.send({
      service: 'Device Management Service',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });
}
