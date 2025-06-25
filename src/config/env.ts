import {getSecret} from './vault';
import type {Vault}  from '../interfaces/vault'

export const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';
export const SMTP_HOST = process.env.SMTP_HOST || '';
export const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_PASS = process.env.SMTP_PASS || '';
export const TEST_EMAIL_RECIPIENT = process.env.TEST_EMAIL_RECIPIENT || 'aws-dev@hofflabs.org';

//Vault specific
export const VAULT_ADDR = process.env.VAULT_ADDR;
export const VAULT_PASS = process.env.VAULT_PASS;
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || (await getSecret('/v1/secrets/data/api/database/aes_key')).key as string;
export const JWT_SECRET = process.env.JWT_SECRET || (await getSecret('/v1/secrets/data/api/authentication/jwt_token')).key as string;
export const DB_HOST = process.env.DB_HOST || (await getSecret('/v1/secrets/data/api/database/connection')).host as string;
export const DB_PORT = process.env.DB_PORT || (await getSecret('/v1/secrets/data/api/database/connection')).port as string;
export const DB_USERNAME = process.env.DB_USERNAME || (await getSecret('/v1/secrets/data/api/database/connection')).username as string;
export const DB_PASSWORD = process.env.DB_PASSWORD || (await getSecret('/v1/secrets/data/api/database/connection')).password as string;
export const DATABASE = process.env.DATABASE || (await getSecret('/v1/secrets/data/api/database/connection')).database as string;