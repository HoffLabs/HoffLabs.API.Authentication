import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJWT } from '../../utils/jwt';
import { extractTokenFromRequest, MISSING_TOKEN_ERROR } from '../../utils/tokenExtractor';
import { 
  getProfileService, 
  updateProfileService, 
  changePasswordService, 
  deleteAccountService,
  ProfileUpdateData,
  PasswordChangeData 
} from '../../services/auth/profile';

interface ProfileRequest {
  Body?: ProfileUpdateData;
  Headers?: { authorization?: string };
}

interface PasswordChangeRequest {
  Body: PasswordChangeData;
  Headers?: { authorization?: string };
}

interface TokenRequest {
  Headers?: { authorization?: string };
}

export const getProfile = async (
  request: FastifyRequest<ProfileRequest>, 
  reply: FastifyReply
) => {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return reply.status(400).send(MISSING_TOKEN_ERROR);
    }

    // Extract UID from JWT
    const decoded = verifyJWT(token);
    const uid = decoded.sub;

    if (!uid) {
      return reply.status(401).send({
        error: 'Invalid token',
        message: 'Token does not contain valid user information'
      });
    }

    const profile = await getProfileService(uid);
    
    if (!profile) {
      return reply.status(404).send({
        error: 'Profile not found',
        message: 'User profile could not be retrieved'
      });
    }

    reply.send({
      success: true,
      profile: profile
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get profile';
    
    reply.status(500).send({
      error: 'Profile retrieval failed',
      message: errorMessage
    });
  }
};

export const updateProfile = async (
  request: FastifyRequest<ProfileRequest>, 
  reply: FastifyReply
) => {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return reply.status(400).send(MISSING_TOKEN_ERROR);
    }

    // Extract UID from JWT
    const decoded = verifyJWT(token);
    const uid = decoded.sub;

    if (!uid) {
      return reply.status(401).send({
        error: 'Invalid token',
        message: 'Token does not contain valid user information'
      });
    }

    if (!request.body) {
      return reply.status(400).send({
        error: 'Missing profile data',
        message: 'Profile update data is required'
      });
    }

    const updatedProfile = await updateProfileService(uid, request.body);
    
    if (!updatedProfile) {
      return reply.status(404).send({
        error: 'Profile not found',
        message: 'User profile could not be updated'
      });
    }

    reply.send({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
    
    if (errorMessage.includes('already exists')) {
      return reply.status(409).send({
        error: 'Conflict',
        message: errorMessage
      });
    }

    reply.status(500).send({
      error: 'Profile update failed',
      message: errorMessage
    });
  }
};

export const changePassword = async (
  request: FastifyRequest<PasswordChangeRequest>, 
  reply: FastifyReply
) => {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return reply.status(400).send(MISSING_TOKEN_ERROR);
    }

    // Extract UID from JWT
    const decoded = verifyJWT(token);
    const uid = decoded.sub;

    if (!uid) {
      return reply.status(401).send({
        error: 'Invalid token',
        message: 'Token does not contain valid user information'
      });
    }

    const { current_password, new_password } = request.body;

    if (!current_password || !new_password) {
      return reply.status(400).send({
        error: 'Missing password data',
        message: 'Both current_password and new_password are required'
      });
    }

    const success = await changePasswordService(uid, { current_password, new_password });
    
    if (success) {
      reply.send({
        success: true,
        message: 'Password changed successfully'
      });
    } else {
      reply.status(500).send({
        error: 'Password change failed',
        message: 'Failed to change password'
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
    
    if (errorMessage.includes('incorrect')) {
      return reply.status(400).send({
        error: 'Invalid current password',
        message: errorMessage
      });
    }

    if (errorMessage.includes('8 characters')) {
      return reply.status(400).send({
        error: 'Invalid new password',
        message: errorMessage
      });
    }

    reply.status(500).send({
      error: 'Password change failed',
      message: errorMessage
    });
  }
};

export const deleteAccount = async (
  request: FastifyRequest<TokenRequest>, 
  reply: FastifyReply
) => {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return reply.status(400).send(MISSING_TOKEN_ERROR);
    }

    // Extract UID from JWT
    const decoded = verifyJWT(token);
    const uid = decoded.sub;

    if (!uid) {
      return reply.status(401).send({
        error: 'Invalid token',
        message: 'Token does not contain valid user information'
      });
    }

    const success = await deleteAccountService(uid);
    
    if (success) {
      reply.send({
        success: true,
        message: 'Account has been deactivated successfully'
      });
    } else {
      reply.status(500).send({
        error: 'Account deletion failed',
        message: 'Failed to deactivate account'
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
    
    reply.status(500).send({
      error: 'Account deletion failed',
      message: errorMessage
    });
  }
};
