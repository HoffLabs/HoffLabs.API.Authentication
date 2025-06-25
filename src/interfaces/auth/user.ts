export interface System {
  version: string;
  api_version: string;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
}

export interface MfaMethod {
  id: number;
  name: string;
  description: string | null;
}

export interface User {
  id: number;
  uid: string;
  avatar: string | null;
  username: string;
  username_hash: string;
  email: string;
  email_hash: string;
  first_name: string | null;
  last_name: string | null;
  password_hash: string | null;
  last_password_change: Date | null;
  password_reset_token: string | null;
  password_reset_expires: Date | null;
  role_id: number;
  sub_roles: string[];
  is_active: boolean;
  mfa_enabled: boolean;
  mfa_secret: string | null;
  mfa_method_id: number;
  email_verified: boolean;
  email_verification_token: string | null;
  email_verification_expires: Date | null;
  created_at: Date;
  updated_at: Date | null;
  login_attempts: number;
  locked_until: Date | null;
  is_banned: boolean;
  is_shadowbanned: boolean;
  ban_reason: string | null;
}

export interface UserSession {
  id: number;
  user_uid: string;
  session_token: string;
  refresh_token: string;
  session_expires_at: Date;
  refresh_expires_at: Date;
  created_at: Date;
}

export interface UserLoginHistory {
  id: number;
  user_uid: string;
  login_at: Date;
  login_ip: string | null;
  user_agent: string | null;
  auth_method: string | null;
}

export interface Cookie {
  sub: string;
}