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
