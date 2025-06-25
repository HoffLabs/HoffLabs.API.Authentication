import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import authRoutes from './routes/auth';
import jwtRoutes from './routes/jwt';
import { ENCRYPTION_KEY, JWT_SECRET, DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DATABASE  } from './config/env';
import { registerSwagger } from './config/swagger';
import cookie from '@fastify/cookie';
import { initAuth } from './plugins/auth';
const fastify = Fastify({ logger: true });

// Load vault secrets during startup
console.log('\x1b[36m%s\x1b[0m', 'Loading environment..');
(async () => {
  await Promise.all([ENCRYPTION_KEY, JWT_SECRET, DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DATABASE ]);
  console.log('\x1b[36m%s\x1b[0m', 'Loading plugins..');
  await initAuth();
})().then(startup);

async function startup() {
  console.log('\x1b[36m%s\x1b[0m', 'Finalizing startup..');
  
  // Register Swagger first
  await registerSwagger(fastify);
  
  fastify.register(cors, { origin: '*' });
  fastify.register(helmet);
  fastify.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  
  // Register JWT plugin
  fastify.register(jwt, {
    secret: JWT_SECRET
  });
  
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(jwtRoutes, { prefix: '/jwt' });
  fastify.register(cookie);
  
  fastify.listen({ port: 3030 }, (err) => {
    if (err) throw err;
    console.log('\x1b[35m%s\x1b[0m', 'Private API running on port 3030');
  });
}

