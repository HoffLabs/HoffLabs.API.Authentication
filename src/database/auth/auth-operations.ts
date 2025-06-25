import { Pool, type QueryResult } from 'pg';
import { getDbPool } from '../utils/connect';
import { type User } from '../../interfaces/auth/user';
import { executeQuery } from '../utils/operations';

interface QueryResultRow {
    [key: string]: any;
}

interface QueryParams {
    text: string;
    values?: any[];
}

export async function userExists<T extends QueryResultRow>(
    username_hash?: string,
    email_hash?: string
  ): Promise<boolean> {
    if (!username_hash && !email_hash) throw new Error('Missing fields for user existence check');
  
    const query = {
      text:
        username_hash && email_hash
          ? 'SELECT 1 FROM users WHERE username_hash = $1 OR email_hash = $2'
          : 'SELECT 1 FROM users WHERE ' + (username_hash ? 'username_hash = $1' : 'email_hash = $1'),
      values: username_hash && email_hash ? [username_hash, email_hash] : [username_hash || email_hash],
    };
  
    const result = await executeQuery<T>(query);
    return Array.isArray(result) && result.length > 0;
  }

export async function readUser<T extends QueryResultRow>(username_hash?: string, email_hash?: string): Promise<T | null> {
    if (!username_hash && !email_hash) return null;
    var query = {} as QueryParams;
    if (username_hash && email_hash) {
        query = {
            text: 'SELECT * FROM users WHERE username_hash = $1 OR email_hash = $2',
            values: [username_hash, email_hash],
        };
    } else if (username_hash && !email_hash) {
        query = {
            text: 'SELECT * FROM users WHERE username_hash = $1',
            values: [username_hash],
        };
    } else {
        query = {
            text: 'SELECT * FROM users WHERE email_hash = $1',
            values: [email_hash],
        };
    }
    const result = await executeQuery<T>(query);
    return result[0] || null;
}


export async function readUID<T extends QueryResultRow>(table: string, uid: string): Promise<T | null> {
    const query = {
        text: `SELECT * FROM ${table} WHERE uid = $1`,
        values: [uid],
    };

    const result = await executeQuery<T>(query);
    return result[0] || null;
}



// Login attempt tracking functions
export async function incrementLoginAttempts(username_hash: string): Promise<number> {
    const query = {
        text: 'UPDATE users SET login_attempts = login_attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE username_hash = $1 RETURNING login_attempts',
        values: [username_hash],
    };
    const result = await executeQuery<{ login_attempts: number }>(query);
    return result[0]?.login_attempts || 0;
}

export async function lockUserAccount(username_hash: string, lockDurationMinutes: number = 30): Promise<void> {
    const lockUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
    const query = {
        text: 'UPDATE users SET locked_until = $1, updated_at = CURRENT_TIMESTAMP WHERE username_hash = $2',
        values: [lockUntil.toISOString(), username_hash],
    };
    await executeQuery(query);
}

export async function resetLoginAttempts(username_hash: string): Promise<void> {
    const query = {
        text: 'UPDATE users SET login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE username_hash = $1',
        values: [username_hash],
    };
    await executeQuery(query);
}

export async function isAccountLocked(username_hash: string): Promise<boolean> {
    const query = {
        text: 'SELECT locked_until FROM users WHERE username_hash = $1',
        values: [username_hash],
    };
    const result = await executeQuery<{ locked_until: string | null }>(query);
    const lockedUntil = result[0]?.locked_until;
    
    if (!lockedUntil) return false;
    
    const now = new Date();
    const lockExpiry = new Date(lockedUntil);
    
    if (now >= lockExpiry) {
        // Lock has expired, reset it
        await resetLoginAttempts(username_hash);
        return false;
    }
    
    return true;
}

export async function recordLoginAttempt(user_uid: string, login_ip: string | null, user_agent: string | null, success: boolean): Promise<void> {
    const query = {
        text: 'INSERT INTO user_login_history (user_uid, login_ip, user_agent, auth_method) VALUES ($1, $2, $3, $4)',
        values: [user_uid, login_ip, user_agent, success ? 'password_success' : 'password_failed'],
    };
    await executeQuery(query);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

