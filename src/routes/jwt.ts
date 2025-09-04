import { FastifyInstance } from 'fastify';
import { verifyToken, decodeToken, getTokenInfo } from '../controllers/auth/jwt';
import { ErrorSchema, TokenInfoSchema, HealthCheckSchema } from '../interfaces/auth/common';

export default async function jwtRoutes(fastify: FastifyInstance) {
  // JWT verification and analysis
  fastify.post('/verify', {
    schema: {
      tags: ['JWT'],
      summary: 'Verify JWT token',
      description: 'Verify the validity and signature of a JWT token',
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', description: 'JWT token to verify' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            payload: { type: 'object' }
          }
        },
        400: ErrorSchema
      }
    }
  }, verifyToken);
  
  fastify.post('/decode', {
    schema: {
      tags: ['JWT'],
      summary: 'Decode JWT token',
      description: 'Decode JWT token without verifying signature',
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', description: 'JWT token to decode' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            header: { type: 'object' },
            payload: { type: 'object' },
            signature: { type: 'string' }
          }
        },
        400: ErrorSchema
      }
    }
  }, decodeToken);
  
  fastify.post('/info', {
    schema: {
      tags: ['JWT'],
      summary: 'Get token information',
      description: 'Get detailed information about a JWT token',
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', description: 'JWT token to analyze' }
        }
      },
      response: {
        200: TokenInfoSchema,
        400: ErrorSchema
      }
    }
  }, getTokenInfo);
}
