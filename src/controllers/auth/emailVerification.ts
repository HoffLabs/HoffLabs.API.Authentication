import { FastifyRequest, FastifyReply } from 'fastify';
import { 
  sendVerificationEmailService, 
  verifyEmailService, 
  resendVerificationEmailService 
} from '../../services/auth/emailVerification';

interface EmailVerificationBody {
  email: string;
}

interface VerifyEmailQuery {
  token: string;
}

interface ResendVerificationBody {
  user_uid: string;
}

export const sendVerificationEmail = async (request: FastifyRequest<{ Body: EmailVerificationBody }>, reply: FastifyReply) => {
  try {
    const { email } = request.body;

    if (!email) {
      return reply.status(400).send({ error: 'Email is required' });
    }

    if (!email.includes('@') || email.length > 254) {
      return reply.status(400).send({ error: 'Invalid email format' });
    }

    const result = await sendVerificationEmailService(email);

    if (result.success) {
      reply.status(200).send({ message: result.message });
    } else {
      reply.status(500).send({ error: result.message });
    }
  } catch (error) {
    console.error('Send verification email controller error:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
};

export const verifyEmail = async (request: FastifyRequest<{ Querystring: VerifyEmailQuery }>, reply: FastifyReply) => {
  try {
    const { token } = request.query;

    if (!token) {
      return reply.status(400).send({ error: 'Verification token is required' });
    }

    if (typeof token !== 'string' || token.length !== 64) {
      return reply.status(400).send({ error: 'Invalid token format' });
    }

    const result = await verifyEmailService(token);

    if (result.success) {
      // You might want to redirect to a success page in a real application
      reply.status(200).send({ 
        message: result.message,
        verified: true 
      });
    } else {
      reply.status(400).send({ 
        error: result.message,
        verified: false 
      });
    }
  } catch (error) {
    console.error('Verify email controller error:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
};

export const resendVerificationEmail = async (request: FastifyRequest<{ Body: ResendVerificationBody }>, reply: FastifyReply) => {
  try {
    const { user_uid } = request.body;

    if (!user_uid) {
      return reply.status(400).send({ error: 'User UID is required' });
    }

    const result = await resendVerificationEmailService(user_uid);

    if (result.success) {
      reply.status(200).send({ message: result.message });
    } else {
      reply.status(400).send({ error: result.message });
    }
  } catch (error) {
    console.error('Resend verification email controller error:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
};
