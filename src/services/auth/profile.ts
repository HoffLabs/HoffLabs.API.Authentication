import { User } from '../../interfaces/auth/user';
import { readUID } from '../../database/auth/auth-operations';
import { update, readSelect } from '../../database/utils/operations';
import { encrypt, decrypt, hash } from '../../utils/crypto';
import { verifyPassword, encryptPassword } from '../../utils/auth/authEncryption';

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  avatar?: string;
  username?: string;
  email?: string;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

export const getProfileService = async (uid: string): Promise<Partial<User> | null> => {
  try {
    const user = await readUID<User>('users', uid);
    if (!user) {
      return null;
    }

    // Decrypt sensitive fields for profile display
    const decryptedUsername = await decrypt(user.username);
    const decryptedEmail = await decrypt(user.email);

    // Return safe profile data (no password hash, tokens, etc.)
    return {
      uid: user.uid,
      username: decryptedUsername,
      email: decryptedEmail,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar: user.avatar,
      role_id: user.role_id,
      sub_roles: user.sub_roles,
      email_verified: user.email_verified,
      mfa_enabled: user.mfa_enabled,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_password_change: user.last_password_change
    };
  } catch (error) {
    console.error('Get profile service error:', error);
    return null;
  }
};

export const updateProfileService = async (uid: string, profileData: ProfileUpdateData): Promise<Partial<User> | null> => {
  try {
    const user = await readUID<User>('users', uid);
    if (!user) {
      throw new Error('User not found');
    }

    const updateData: Partial<User> = {
      updated_at: new Date()
    };

    // Handle non-encrypted fields
    if (profileData.first_name !== undefined) {
      updateData.first_name = profileData.first_name;
    }
    if (profileData.last_name !== undefined) {
      updateData.last_name = profileData.last_name;
    }
    if (profileData.avatar !== undefined) {
      updateData.avatar = profileData.avatar;
    }

    // Handle encrypted fields (username/email)
    if (profileData.username !== undefined) {
      // Check if username is already taken
      const usernameHash = hash(profileData.username);
      const existingUsers = await readSelect<User>('users', ['id'], { username_hash: usernameHash });
      if (existingUsers.length > 0 && existingUsers[0].id !== user.id) {
        throw new Error('Username already exists');
      }
      updateData.username = await encrypt(profileData.username);
      updateData.username_hash = usernameHash;
    }

    if (profileData.email !== undefined) {
      // Check if email is already taken
      const emailHash = hash(profileData.email);
      const existingUsers = await readSelect<User>('users', ['id'], { email_hash: emailHash });
      if (existingUsers.length > 0 && existingUsers[0].id !== user.id) {
        throw new Error('Email already exists');
      }
      updateData.email = await encrypt(profileData.email);
      updateData.email_hash = emailHash;
      updateData.email_verified = false; // Reset verification when email changes
    }

    const updatedUser = await update<User>('users', user.id, updateData);
    
    // Return safe profile data
    return await getProfileService(uid);
  } catch (error) {
    console.error('Update profile service error:', error);
    throw error;
  }
};

export const changePasswordService = async (uid: string, passwordData: PasswordChangeData): Promise<boolean> => {
  try {
    const user = await readUID<User>('users', uid);
    if (!user || !user.password_hash) {
      throw new Error('User not found or invalid');
    }

    // Verify current password
    const isValidPassword = await verifyPassword(passwordData.current_password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password (add your validation rules)
    if (passwordData.new_password.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    // Hash and encrypt new password
    const newPasswordHash = await encryptPassword(passwordData.new_password);
    
    await update<User>('users', user.id, {
      password_hash: newPasswordHash,
      last_password_change: new Date(),
      updated_at: new Date()
    });

    return true;
  } catch (error) {
    console.error('Change password service error:', error);
    throw error;
  }
};

export const deleteAccountService = async (uid: string): Promise<boolean> => {
  try {
    const user = await readUID<User>('users', uid);
    if (!user) {
      throw new Error('User not found');
    }

    // Soft delete - mark as inactive instead of hard delete
    await update<User>('users', user.id, {
      is_active: false,
      updated_at: new Date()
    });

    // Note: user_sessions will be cleaned up by foreign key CASCADE
    // when we implement hard delete later
    
    return true;
  } catch (error) {
    console.error('Delete account service error:', error);
    throw error;
  }
};
