import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { ENCRYPTION_KEY } from '../config/env';



const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

export const hash = (input: string, salt: string = ''): string => {
  return createHash('sha256').update(input + salt).digest('hex');
};

export const encrypt = async (text: string): Promise<string> => {
  const key = ENCRYPTION_KEY;
  const iv = randomBytes(16);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(key, 'base64'), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, encrypted]).toString('base64');
};

export const decrypt = async (encrypted: string): Promise<string> => {
  const key = ENCRYPTION_KEY;
  const buffer = Buffer.from(encrypted, 'base64');
  const iv = buffer.subarray(0, 16);
  const data = buffer.subarray(16);
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, Buffer.from(key, 'base64'), iv);
  return decipher.update(data, undefined, 'utf8') + decipher.final('utf8');
};
