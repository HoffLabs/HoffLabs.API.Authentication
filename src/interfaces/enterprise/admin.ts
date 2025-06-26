// Admin and User Management Interfaces

export interface AdminUser {
  uid: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role_id: number;
  is_active: boolean;
  is_banned: boolean;
  is_shadowbanned: boolean;
  ban_reason?: string;
  email_verified: boolean;
  mfa_enabled: boolean;
  created_at: string;
  updated_at?: string;
  last_login?: string;
  login_attempts: number;
  locked_until?: string;
}

export interface UserSession {
  id: number;
  user_uid: string;
  session_expires_at: string;
  refresh_expires_at: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditLog {
  id: number;
  user_uid?: string;
  action: string;
  resource?: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  created_at: string;
}

export interface SystemConfig {
  id: number;
  key: string;
  value: any;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlag {
  id: number;
  name: string;
  description?: string;
  is_enabled: boolean;
  rollout_percentage: number;
  conditions?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserFeatureFlag {
  id: number;
  user_uid: string;
  feature_flag_id: number;
  is_enabled: boolean;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  banned_users: number;
  verified_users: number;
  mfa_enabled_users: number;
  total_sessions: number;
  recent_registrations: number;
  recent_logins: number;
}
