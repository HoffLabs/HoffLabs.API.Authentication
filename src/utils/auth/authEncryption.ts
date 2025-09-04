import { randomBytes } from 'crypto';
import { encrypt, decrypt} from '../crypto';
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
  // Create a completely opaque token that doesn't expose any user data
  const tokenData = {
    uid,
    random: randomBytes(32).toString('hex'),
    issued: Date.now(),
    nonce: randomBytes(16).toString('hex')
  };
  
  // Create a secure token using JWT for better security and validation
  const refreshToken = jwt.sign(
    { 
      sub: uid, 
      type: 'refresh',
      nonce: tokenData.nonce,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    {
      expiresIn: '7d', // Refresh tokens last longer
      algorithm: 'HS256',
      issuer: 'hofflabs-api',
      audience: 'hofflabs-refresh'
    }
  );
  
  return refreshToken;
}

export function createJWT(uid: string) {
  const jwtToken = jwt.sign(createCookie(uid) as unknown as Cookie, JWT_SECRET, {
    expiresIn: '15m', // Reduced from 30m for better security
    algorithm: 'HS256',
    issuer: 'hofflabs-api',
    audience: 'hofflabs-users',
    jwtid: randomBytes(16).toString('hex') // Add unique JWT ID
  });
  return jwtToken;
}

function createCookie(uid: string) {
  return { 
    sub: uid,
    iat: Math.floor(Date.now() / 1000), // Add issued at timestamp
    type: 'access'
  };
}


// Validate and extract UID from JWT-based refresh token
export function validateRefreshToken(refreshToken: string): { uid: string; valid: boolean } {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET, {
      issuer: 'hofflabs-api',
      audience: 'hofflabs-refresh'
    }) as any;
    
    if (decoded.type !== 'refresh') {
      return { uid: '', valid: false };
    }
    
    return { uid: decoded.sub, valid: true };
  } catch (error) {
    return { uid: '', valid: false };
  }
}

// Legacy function - deprecated, use validateRefreshToken instead
export function splitRefreshToken(refreshToken: string): string {
  console.warn('splitRefreshToken is deprecated - use validateRefreshToken instead');
  const result = validateRefreshToken(refreshToken);
  return result.valid ? result.uid : '';
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(14); // Increased from 13 for better security
  const hash = await bcrypt.hash(password, salt);
  return hash; // bcrypt handles salt internally, no need to separate
}

export async function encryptPassword(password: string): Promise<string> {
  return encrypt(await hashPassword(password));
}

export async function verifyPassword(password: string, encryptedStoredHash: string): Promise<boolean> {
  try {
    const storedHash = await decrypt(encryptedStoredHash);
    
    // Use bcrypt.compare for proper verification
    const isValid = await bcrypt.compare(password, storedHash);
    
    // Add artificial delay to prevent timing attacks
    const delay = 100 + Math.random() * 50; // 100-150ms
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return isValid;
  } catch (error) {
    // Add artificial delay for error cases too
    const delay = 100 + Math.random() * 50;
    await new Promise(resolve => setTimeout(resolve, delay));
    return false;
  }
}
