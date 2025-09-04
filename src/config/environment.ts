import dotenv from 'dotenv';

// Load .env file first
dotenv.config();

// Export environment variables with fallback values
export const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';
export const SMTP_HOST = process.env.SMTP_HOST || '';
export const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_PASS = process.env.SMTP_PASS || '';
export const TEST_EMAIL_RECIPIENT = process.env.TEST_EMAIL_RECIPIENT || 'aws-dev@hofflabs.org';

// Vault configuration (optional)
export const VAULT_ADDR = process.env.VAULT_ADDR;
export const VAULT_PASS = process.env.VAULT_PASS;

// Critical environment variables - MUST be set in production
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY must be set in production environment');
  }
  console.warn('⚠️  WARNING: Using default ENCRYPTION_KEY for development only');
  return 'dev_only_encryption_key_32_chars';
})();

export const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
  console.warn('⚠️  WARNING: Using default JWT_SECRET for development only');
  // Use a stronger default for development
  return 'dev_only_jwt_secret_key_for_development_with_sufficient_entropy_12345678';
})();

// Validate JWT secret strength
if (JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be at least 32 characters long for security');
  }
  console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters long');
}

// Database configuration
export const DB_HOST = process.env.DB_HOST || 'localhost';
export const DB_PORT = process.env.DB_PORT || '5432';
export const DB_USERNAME = process.env.DB_USERNAME || 'postgres';
export const DB_PASSWORD = process.env.DB_PASSWORD || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DB_PASSWORD must be set in production environment');
  }
  console.warn('⚠️  WARNING: Using default DB_PASSWORD for development only');
  return 'dev_password';
})();
export const DATABASE = process.env.DATABASE || 'Hofflabs';

// Environment settings
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const TEST_MODE = process.env.TEST_MODE === 'true';
