export interface AuditLog {
  id: number;
  user_uid: string | null;
  action: string;
  resource: string | null;
  resource_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  created_at: Date;
}

export interface SystemConfig {
  id: number;
  key: string;
  value: any;
  description: string | null;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FeatureFlag {
  id: number;
  name: string;
  description: string | null;
  is_enabled: boolean;
  rollout_percentage: number;
  conditions: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface UserFeatureFlag {
  id: number;
  user_uid: string;
  feature_flag_id: number;
  is_enabled: boolean;
  created_at: Date;
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
