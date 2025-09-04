import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import authRoutes from './routes/auth';
import jwtRoutes from './routes/jwt';
import { ENCRYPTION_KEY, JWT_SECRET, DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DATABASE } from './config/environment';
import registerEnhancedSwagger from './config/swagger-enhanced';
import cookie from '@fastify/cookie';
import { initAuth } from './plugins/auth';
import { securityMiddleware } from './middleware/security';
const fastify = Fastify({ logger: true });

// Load environment variables
console.log('\x1b[36m%s\x1b[0m', 'Environment loaded..');
console.log('\x1b[36m%s\x1b[0m', 'Loading plugins..');

(async () => {
  await initAuth();
  startup();
})();

async function startup() {
  console.log('\x1b[36m%s\x1b[0m', 'Finalizing startup..');
  
  // Register Enhanced Swagger first
  await registerEnhancedSwagger(fastify);
  
  // Configure CORS securely
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3000', 'http://localhost:3001'];
  
  fastify.register(cors, { 
    origin: process.env.NODE_ENV === 'production' 
      ? allowedOrigins
      : true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });
  
  // Configure security headers
  fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  });
  
  // Enhanced rate limiting
  fastify.register(rateLimit, { 
    max: 100, 
    timeWindow: '1 minute',
    skipOnError: false,
    ban: 10, // Ban after 10 violations
    continueExceeding: false
  });
  
  // Register JWT plugin
  fastify.register(jwt, {
    secret: JWT_SECRET
  });
  
  // Register security middleware globally
  fastify.addHook('preHandler', securityMiddleware);
  
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(jwtRoutes, { prefix: '/jwt' });
  fastify.register(cookie);
  
  fastify.listen({ port: 3030 }, (err) => {
    if (err) throw err;
    console.log('\x1b[35m%s\x1b[0m', 'Private API running on port 3030');
  });
}

