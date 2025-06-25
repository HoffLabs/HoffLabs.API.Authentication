import { randomBytes } from 'crypto';
import { encrypt, decrypt} from '../crypto';
import * as bcrypt from 'bcryptjs';
import { readUID } from '../../database/auth/auth-operations';


import { type User, type Cookie } from '../../interfaces/auth/user';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config/env';

const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

export async function generateUID(): Promise<string> {
  const uid = randomBytes(32).toString('hex');
  const user = await readUID<User>('users', uid);

  if (user) return generateUID();
  return uid;
}

export function generateRefreshToken(uid: string): string {
  return uid + randomBytes(32).toString('hex');
}

export function createJWT(uid: string) {
  const jwtToken = jwt.sign(createCookie(uid) as unknown as Cookie, JWT_SECRET, {
    expiresIn: '30m',
    algorithm: 'HS256'
  });
  return jwtToken;
}

function createCookie(uid: string) {
  return { sub: uid }
}


export function splitRefreshToken(refreshToken: string): string {
  const uidLength = 64; // UID is 32 bytes = 64 hex characters
  const uid = refreshToken.slice(0, uidLength);
  const randomPart = refreshToken.slice(uidLength);
  return uid;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(13);
  const hash = await bcrypt.hash(password, salt);
  return `${salt}:${hash}`;
}

export async function encryptPassword(password: string): Promise<string> {
  return encrypt(await hashPassword(password));
}

export async function verifyPassword(password: string, encryptedStoredHash: string): Promise<boolean> {
  const storedHash = await decrypt(encryptedStoredHash);
  const [salt, hash] = storedHash.split(':');

  if (!salt || !hash) {
    return false;
  }

  const hashedInput = await bcrypt.hash(password, salt);
  return hashedInput === hash;
}