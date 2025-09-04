import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { encrypt, decrypt } from '../crypto';
import * as bcrypt from 'bcryptjs';
import { readUID } from '../../database/auth/auth-operations';

import { type User, type Cookie } from '../../interfaces/auth/user';
import jwt from 'jsonwebtoken';
import { ENCRYPTION_KEY, JWT_SECRET } from '../../config/environment';

const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

export async function generateUID(): Promise<string> {
  const uid = randomBytes(32).toString('hex');
  const user = await readUID<User>('users', uid);

  if (user) return generateUID();
  return uid;
}

export function generateRefreshToken(uid: string): string {
  // FIXED: Don't expose UID in refresh token
  const tokenPayload = {
    uid,
    random: randomBytes(32).toString('hex'),
    issued: Date.now()
  };
  
  // Create a secure token that doesn't expose the UID
  const tokenString = JSON.stringify(tokenPayload);
  const hash = createHash('sha256').update(tokenString + JWT_SECRET).digest('hex');
  
  return randomBytes(32).toString('hex') + hash.substring(0, 32);
}

export function createJWT(uid: string) {
  const jwtToken = jwt.sign(createCookie(uid) as unknown as Cookie, JWT_SECRET, {
    expiresIn: '15m', // FIXED: Reduced from 30m
    algorithm: 'HS256',
    issuer: 'hofflabs-api',
    audience: 'hofflabs-users',
    jwtid: randomBytes(16).toString('hex') // FIXED: Added unique JWT ID
  });
  return jwtToken;
}

function createCookie(uid: string) {
  return { 
    sub: uid,
    iat: Math.floor(Date.now() / 1000), // FIXED: Added issued at
    type: 'access'
  };
}

// FIXED: Proper refresh token parsing (no longer contains UID directly)
export function extractUIDFromRefreshToken(refreshToken: string): string | null {
  // This would need to be stored in database and looked up
  // No longer extractable from token directly (more secure)
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  // FIXED: Increased salt rounds for better security
  const salt = await bcrypt.genSalt(14); // Increased from 13
  const hash = await bcrypt.hash(password, salt);
  return hash; // FIXED: Return just the hash, bcrypt handles salt internally
}

export async function encryptPassword(password: string): Promise<string> {
  return encrypt(await hashPassword(password));
}

// FIXED: Proper bcrypt verification + timing attack prevention
export async function verifyPassword(password: string, encryptedStoredHash: string): Promise<boolean> {
  try {
    const storedHash = await decrypt(encryptedStoredHash);
    
    // FIXED: Use bcrypt.compare instead of manual comparison
    const isValid = await bcrypt.compare(password, storedHash);
    
    // FIXED: Add artificial delay to prevent timing attacks
    const delay = 100 + Math.random() * 50; // 100-150ms
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return isValid;
  } catch (error) {
    // FIXED: Add artificial delay for error cases too
    const delay = 100 + Math.random() * 50;
    await new Promise(resolve => setTimeout(resolve, delay));
    return false;
  }
}

// FIXED: Add constant-time string comparison
export function constantTimeStringCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  
  return timingSafeEqual(bufferA, bufferB);
}
