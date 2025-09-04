import { FastifyRequest, FastifyReply } from 'fastify';
import { loginService, registerService } from '../../services/auth/auth';
import { type User, type UserLoginHistory } from '../../interfaces/auth/user';

interface AuthBody {
  username: string;
  password: string;
  email?: string;
}

// Input validation and sanitization functions
function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  // Remove potentially dangerous characters
  return input.trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 255); // Limit length
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validateUsername(username: string): boolean {
  // Allow alphanumeric, underscore, hyphen, dot
  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  return usernameRegex.test(username) && username.length >= 3 && username.length <= 32;
}

function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome'];
  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    errors.push('Password contains common weak patterns');
  }
  
  // Check for sequential characters
  if (/123|abc|qwe/i.test(password)) {
    errors.push('Password should not contain sequential characters');
  }
  
  return { valid: errors.length === 0, errors };
}

export const login = async (request: FastifyRequest<{ Body: AuthBody }>, reply: FastifyReply) => {
  const { username, password } = request.body;
  const login_ip = request.ip;
  const user_agent = request.headers['user-agent'];
  
  const response = await loginService(username, password, login_ip, user_agent);
  
  if (response.error) {
    const statusCode = response.locked ? 423 : 401; // 423 = Locked
    return reply.status(statusCode).send({
      error: response.error,
      locked: response.locked,
      locked_until: response.locked_until,
      attempts_remaining: response.attempts_remaining,
      warning: response.warning,
      ban_reason: response.ban_reason
    });
  }
  
  if (response.success) {
    // Set secure httpOnly cookies for tokens and user data
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Access token cookie (15 minutes)
    reply.setCookie('access_token', response.access_token, {
      httpOnly: true,
      secure: isProduction, // Only HTTPS in production
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/'
    });
    
    // Refresh token cookie (7 days)
    reply.setCookie('refresh_token', response.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
    
    // User data cookie (non-httpOnly for frontend access, but still secure)
    reply.setCookie('user_data', JSON.stringify({
      uid: response.user?.uid,
      username: response.user?.username,
      email: response.user?.email,
      email_verified: response.user?.email_verified,
      created_at: response.user?.created_at,
      first_name: response.user?.first_name,
      last_name: response.user?.last_name
    }), {
      httpOnly: false, // Frontend needs to read user data
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    });
    
    // Send minimal response (tokens are now in cookies)
    reply.send({
      success: true,
      message: 'Login successful',
      user: response.user,
      expires_in: response.expires_in
    });
  } else {
    reply.status(500).send({ error: 'Login failed' });
  }
};

export const register = async (request: FastifyRequest<{ Body: AuthBody }>, reply: FastifyReply) => {
  const { username: rawUsername, password: rawPassword, email: rawEmail } = request.body;
  
  // Input validation and sanitization
  if (!rawUsername || !rawPassword || !rawEmail) {
    return reply.status(400).send({ error: 'Username, password, and email are required' });
  }
  
  const username = sanitizeString(rawUsername);
  const email = sanitizeString(rawEmail);
  const password = rawPassword; // Don't sanitize password, validate only
  
  // Validate username
  if (!validateUsername(username)) {
    return reply.status(400).send({ 
      error: 'Username must be 3-32 characters long and contain only letters, numbers, dots, hyphens, and underscores' 
    });
  }
  
  // Validate email
  if (!validateEmail(email)) {
    return reply.status(400).send({ error: 'Please provide a valid email address' });
  }
  
  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return reply.status(400).send({ 
      error: 'Password validation failed',
      details: passwordValidation.errors
    });
  }
  
  // Hash password before storing
  const { encryptPassword } = await import('../../utils/auth/authEncryption');
  const hashedPassword = await encryptPassword(password);
  
  const newUser = { 
    username: username, 
    password_hash: hashedPassword, // Store hashed password
    email: email 
  } as Partial<User>;
  
  const requestInfo = { 
    login_ip: request.ip, 
    user_agent: request.headers['user-agent']
  } as Partial<UserLoginHistory>;
  try {
    const user = await registerService(newUser, requestInfo);
    reply.status(201).send({
      ...user,
      jwt: user.access_token // Add jwt alias for test compatibility
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Registration failed';
    reply.status(400).send({ error: errorMessage });
  }
};