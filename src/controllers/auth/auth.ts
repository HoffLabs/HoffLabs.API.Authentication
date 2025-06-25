import { FastifyRequest, FastifyReply } from 'fastify';
import { loginService, registerService } from '../../services/auth/auth';
import { type User, type UserLoginHistory } from '../../interfaces/auth/user';

interface AuthBody {
  username: string;
  password: string;
  email?: string;
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
    reply.send({
      user_uid: response.user_uid,
      user: response.user,
      access_token: response.access_token,
      jwt: response.access_token, // Add jwt alias for test compatibility
      refresh_token: response.refresh_token,
      expires_in: response.expires_in
    });
  } else {
    reply.status(500).send({ error: 'Login failed' });
  }
};

export const register = async (request: FastifyRequest<{ Body: AuthBody }>, reply: FastifyReply) => {

  const { username, password, email } = request.body;
  const newUser = { username: username, password_hash: password, email: email } as Partial<User>;
  const requestInfo = { login_ip: request.ip, user_agent: request.headers['user-agent']} as  Partial<UserLoginHistory>;
  if (!email) return reply.status(400).send({ error: 'Email is required' });
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