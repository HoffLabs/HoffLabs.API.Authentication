import { FastifyRequest, FastifyReply } from 'fastify';

// Security middleware for authentication endpoints
export const securityMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  // Add security headers
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-XSS-Protection', '1; mode=block');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Add cache control headers for sensitive endpoints
  if (request.url.includes('/auth/') || request.url.includes('/jwt/')) {
    reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    reply.header('Pragma', 'no-cache');
    reply.header('Expires', '0');
    reply.header('Surrogate-Control', 'no-store');
  }
  
  // Validate request size to prevent DoS attacks
  const contentLength = request.headers['content-length'];
  if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
    return reply.status(413).send({ 
      error: 'Request payload too large',
      statusCode: 413
    });
  }
  
  // Check for suspicious user agents
  const userAgent = request.headers['user-agent'];
  if (!userAgent || userAgent.length < 10) {
    console.warn(`Suspicious request from ${request.ip}: Missing or short user agent`);
  }
  
  // Rate limit by IP for authentication endpoints
  if (request.url.includes('/login') || request.url.includes('/register')) {
    const ip = request.ip;
    const now = Date.now();
    const key = `auth_attempt_${ip}`;
    
    // Simple in-memory rate limiting (in production, use Redis or similar)
    if (!global.authAttempts) {
      global.authAttempts = new Map();
    }
    
    const attempts = global.authAttempts.get(key) || { count: 0, firstAttempt: now };
    
    // Reset counter if more than 15 minutes have passed
    if (now - attempts.firstAttempt > 15 * 60 * 1000) {
      attempts.count = 0;
      attempts.firstAttempt = now;
    }
    
    attempts.count++;
    global.authAttempts.set(key, attempts);
    
    // Block if too many attempts
    if (attempts.count > 10) {
      return reply.status(429).send({
        error: 'Too many authentication attempts from this IP',
        statusCode: 429,
        retryAfter: 900 // 15 minutes
      });
    }
  }
};

// JWT validation middleware
export const validateJWT = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return reply.status(401).send({
        error: 'Access token required',
        statusCode: 401
      });
    }
    
    // Verify token using Fastify's JWT plugin
    const decoded = request.server.jwt.verify(token);
    
    // Add user info to request for downstream handlers
    (request as any).user = decoded;
    
  } catch (error) {
    return reply.status(401).send({
      error: 'Invalid or expired token',
      statusCode: 401
    });
  }
};

// Declare global types for TypeScript
declare global {
  var authAttempts: Map<string, { count: number; firstAttempt: number }>;
}
