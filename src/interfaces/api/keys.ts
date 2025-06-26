export interface ApiKey {
  id: number;
  user_uid: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  permissions: string[];
  scopes: string[];
  rate_limit: number | null;
  rate_limit_window: number | null; // in seconds
  is_active: boolean;
  last_used: Date | null;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ApiKeyUsage {
  id: number;
  api_key_id: number;
  endpoint: string;
  method: string;
  ip_address: string | null;
  user_agent: string | null;
  response_status: number;
  request_size: number | null;
  response_size: number | null;
  duration_ms: number;
  created_at: Date;
}

export interface ApiKeyQuota {
  id: number;
  api_key_id: number;
  quota_type: 'requests' | 'bandwidth' | 'storage';
  limit_value: number;
  used_value: number;
  reset_period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  reset_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ApiKeyPermission {
  id: number;
  name: string;
  description: string;
  resource: string;
  actions: string[];
  created_at: Date;
}

export interface ApiKeyRateLimit {
  id: number;
  api_key_id: number;
  requests_count: number;
  window_start: Date;
  window_end: Date;
  is_exceeded: boolean;
  created_at: Date;
}

export interface ApiKeyActivity {
  id: number;
  api_key_id: number;
  activity_type: 'created' | 'updated' | 'used' | 'rate_limited' | 'suspended' | 'deleted';
  description: string;
  metadata: Record<string, any> | null;
  created_at: Date;
}
