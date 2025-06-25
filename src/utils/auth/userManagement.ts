import { create, readSelect } from '../../database/utils/operations';
import { type User, type UserLoginHistory } from '../../interfaces/auth/user';
import { encryptPassword, generateUID } from '../../utils/auth/authEncryption';
import { encrypt, decrypt, hash } from '../../utils/crypto';



export async function createUser(userData: Partial<User>): Promise<User> {
    const defaultUserData: Partial<User> = {
      uid: await generateUID(),
      avatar: 'http://0.0.0.0:3000/avatars/user.png',
      username: await encrypt(userData.username as string) as unknown as string,
      username_hash: hash(userData.username as string),
      email: await encrypt(userData.email as string) as unknown as string,
      email_hash: hash(userData.email as string),
      first_name: '',
      last_name: '',
      password_hash: await encryptPassword(userData.password_hash as string) as unknown as string,
      role_id: 3,
      sub_roles: [],
      is_active: true,
      mfa_enabled: false,
      mfa_method_id: 1,
      email_verified: false,
      created_at: new Date(),
      login_attempts: 0,
      is_banned: false,
      is_shadowbanned: false,
    };
    return create<User>('users', defaultUserData);
  }
  
  export async function updateUserLoginHistory(uid: string, request: Partial<UserLoginHistory>) {
    await create<UserLoginHistory>('user_login_history', {
      user_uid: uid,
      login_at: new Date(),
      login_ip: await encrypt(request.login_ip as string),
      user_agent: request.user_agent,
      auth_method: 'default',
    });
  }