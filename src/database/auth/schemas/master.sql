CREATE TABLE IF NOT EXISTS system (
  version TEXT NOT NULL,
  api_version TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS mfa_methods (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  avatar TEXT,
  username TEXT NOT NULL UNIQUE,
  username_hash TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  email_hash TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  password_hash TEXT,
  last_password_change TIMESTAMPTZ,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMPTZ,
  role_id INTEGER NOT NULL DEFAULT 3,
  sub_roles JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret TEXT,
  mfa_method_id INTEGER NOT NULL DEFAULT 1,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verification_token TEXT,
  email_verification_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ,
  login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  is_shadowbanned BOOLEAN NOT NULL DEFAULT FALSE,
  ban_reason TEXT,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
  FOREIGN KEY (mfa_method_id) REFERENCES mfa_methods(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_uid TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  refresh_token TEXT NOT NULL UNIQUE,
  session_expires_at TIMESTAMPTZ NOT NULL,
  refresh_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_login_history (
  id SERIAL PRIMARY KEY,
  user_uid TEXT NOT NULL,
  login_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  login_ip TEXT,
  user_agent TEXT,
  auth_method TEXT,
  FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_system_version ON system(version);
CREATE INDEX idx_users_username_hash ON users(username_hash);
CREATE INDEX idx_users_email_hash ON users(email_hash);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;
CREATE INDEX idx_user_sessions_user_uid ON user_sessions(user_uid);
CREATE INDEX idx_user_sessions_session_expires_at ON user_sessions(session_expires_at);
CREATE INDEX idx_user_sessions_refresh_expires_at ON user_sessions(refresh_expires_at);
CREATE INDEX idx_user_login_history_user_uid ON user_login_history(user_uid);
CREATE INDEX idx_user_login_history_login_at ON user_login_history(login_at);

INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrator with full system access and control'),
  ('member', 'Standard user with access to core features'),
  ('guest', 'Limited access user for temporary or restricted use')
ON CONFLICT (name) DO NOTHING;

INSERT INTO mfa_methods (name, description) VALUES
  ('none', 'No multi-factor authentication enabled')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;

-- MFA Enhanced Tables
CREATE TABLE IF NOT EXISTS user_mfa_methods (
  id SERIAL PRIMARY KEY,
  user_uid TEXT NOT NULL,
  method_type TEXT NOT NULL, -- 'totp', 'yubikey', 'backup_codes'
  secret_encrypted TEXT, -- For TOTP secrets
  backup_codes_encrypted TEXT, -- JSON array of hashed backup codes
  yubikey_public_id TEXT, -- YubiKey public identifier
  is_enabled BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS yubikey_registrations (
  id SERIAL PRIMARY KEY,
  user_uid TEXT NOT NULL,
  public_id TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMPTZ,
  FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
);

-- API Keys Management
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  user_uid TEXT NOT NULL,
  key_id TEXT NOT NULL UNIQUE,
  key_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  permissions JSONB DEFAULT '[]'::JSONB,
  last_used TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  rate_limit INTEGER DEFAULT 1000,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
);

-- Device Management
CREATE TABLE IF NOT EXISTS trusted_devices (
  id SERIAL PRIMARY KEY,
  user_uid TEXT NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT, -- mobile, desktop, tablet
  browser TEXT,
  os TEXT,
  ip_address INET,
  fingerprint TEXT,
  last_seen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  is_trusted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE,
  UNIQUE(user_uid, device_id)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_uid TEXT,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE SET NULL
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_uid TEXT,
  type TEXT NOT NULL, -- info, warning, error, success
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
);

-- User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_uid TEXT NOT NULL UNIQUE,
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  theme TEXT DEFAULT 'light',
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  security_alerts BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
);

-- System Configuration
CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Third-party Integrations
CREATE TABLE IF NOT EXISTS integrations (
  id SERIAL PRIMARY KEY,
  user_uid TEXT NOT NULL,
  provider TEXT NOT NULL, -- google, github, slack, etc.
  provider_user_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scopes TEXT[],
  metadata JSONB DEFAULT '{}'::JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE,
  UNIQUE(user_uid, provider)
);

-- Mobile Devices
CREATE TABLE IF NOT EXISTS mobile_devices (
  id SERIAL PRIMARY KEY,
  user_uid TEXT NOT NULL,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL, -- ios, android
  app_version TEXT,
  os_version TEXT,
  device_model TEXT,
  push_enabled BOOLEAN DEFAULT TRUE,
  biometric_enabled BOOLEAN DEFAULT FALSE,
  last_active TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE,
  UNIQUE(device_token)
);

-- Email Management
CREATE TABLE IF NOT EXISTS email_change_requests (
  id SERIAL PRIMARY KEY,
  user_uid TEXT NOT NULL,
  new_email TEXT NOT NULL,
  verification_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
);

-- Analytics
CREATE TABLE IF NOT EXISTS user_analytics (
  id SERIAL PRIMARY KEY,
  user_uid TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::JSONB,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
);

-- Rate Limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id SERIAL PRIMARY KEY,
  identifier TEXT NOT NULL, -- user_uid, ip_address, api_key_id
  identifier_type TEXT NOT NULL, -- user, ip, api_key
  endpoint TEXT NOT NULL,
  requests_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(identifier, identifier_type, endpoint)
);

-- Extended Indexes
CREATE INDEX IF NOT EXISTS idx_user_mfa_methods_user_uid ON user_mfa_methods(user_uid);
CREATE INDEX IF NOT EXISTS idx_yubikey_registrations_user_uid ON yubikey_registrations(user_uid);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_uid ON api_keys(user_uid);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_id ON api_keys(key_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_uid ON trusted_devices(user_uid);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_uid ON audit_logs(user_uid);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_uid ON notifications(user_uid);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_webhooks_user_uid ON webhooks(user_uid);
CREATE INDEX IF NOT EXISTS idx_integrations_user_uid ON integrations(user_uid);
CREATE INDEX IF NOT EXISTS idx_mobile_devices_user_uid ON mobile_devices(user_uid);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_uid ON user_analytics(user_uid);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, identifier_type);

-- Insert enhanced MFA methods
INSERT INTO mfa_methods (name, description) VALUES
  ('totp', 'Time-based One-Time Password (Google Authenticator, Authy, etc.)'),
  ('yubikey', 'YubiKey hardware security key'),
  ('backup_codes', 'Single-use backup codes for account recovery')
ON CONFLICT (name) DO NOTHING;

-- Insert default system configuration
INSERT INTO system_config (key, value, description, is_public) VALUES
('app_name', '"Hofflabs API"', 'Application name', true),
('app_version', '"1.0.0"', 'Application version', true),
('maintenance_mode', 'false', 'Maintenance mode status', true),
('registration_enabled', 'true', 'User registration enabled', true),
('max_login_attempts', '5', 'Maximum login attempts before lockout', false),
('session_timeout', '86400', 'Session timeout in seconds', false),
('password_min_length', '8', 'Minimum password length', true),
('mfa_required', 'false', 'MFA required for all users', false)
ON CONFLICT (key) DO NOTHING;

-- Insert default feature flags
INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage) VALUES
('advanced_analytics', 'Advanced analytics and reporting', false, 0),
('mobile_app_access', 'Mobile application access', true, 100),
('api_v2', 'API version 2 features', false, 10),
('webhooks', 'Webhook functionality', true, 100),
('integrations', 'Third-party integrations', true, 100),
('premium_features', 'Premium subscription features', false, 0)
ON CONFLICT (name) DO NOTHING;
