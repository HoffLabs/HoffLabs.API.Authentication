import {getSecret} from './vault';
import type {Vault}  from '../interfaces/vault'

export async function loadEnvironment() {
    const ENCRYPTION_KEY_SECRET = await getSecret('/v1/secrets/data/api/database/aes_key');
    const JWT_SECRET_SECRET = await getSecret('/v1/secrets/data/api/authentication/jwt_token');
    const DB_CONNECTION_SECRET = await getSecret('/v1/secrets/data/api/database/connection');

    return {
        BACKEND_API_URL: process.env.BACKEND_API_URL || 'http://localhost:3000',
        SMTP_HOST: process.env.SMTP_HOST || '',
        SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
        SMTP_USER: process.env.SMTP_USER || '',
        SMTP_PASS: process.env.SMTP_PASS || '',
        TEST_EMAIL_RECIPIENT: process.env.TEST_EMAIL_RECIPIENT || 'aws-dev@hofflabs.org',

        //Vault specific
        VAULT_ADDR: process.env.VAULT_ADDR,
        VAULT_PASS: process.env.VAULT_PASS,
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || ENCRYPTION_KEY_SECRET.key as string,
        JWT_SECRET: process.env.JWT_SECRET || JWT_SECRET_SECRET.key as string,
        DB_HOST: process.env.DB_HOST || DB_CONNECTION_SECRET.host as string,
        DB_PORT: process.env.DB_PORT || DB_CONNECTION_SECRET.port as string,
        DB_USERNAME: process.env.DB_USERNAME || DB_CONNECTION_SECRET.username as string,
        DB_PASSWORD: process.env.DB_PASSWORD || DB_CONNECTION_SECRET.password as string,
        DATABASE: process.env.DATABASE || DB_CONNECTION_SECRET.database as string,
    };
}
