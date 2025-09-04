import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { ENCRYPTION_KEY } from '../config/environment';



const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

export const hash = (input: string, salt: string = ''): string => {
  return createHash('sha256').update(input + salt).digest('hex');
};

// Derive key from ENCRYPTION_KEY for AES-256-CBC (32 bytes needed)
function deriveKey(keyString: string): Buffer {
  if (!keyString) {
    throw new Error('Encryption key is required');
  }
  
  // If key is already 32 bytes (for base64), use it directly
  if (keyString.length >= 44) { // 32 bytes base64 encoded is ~44 chars
    try {
      const keyBuffer = Buffer.from(keyString, 'base64');
      if (keyBuffer.length >= 32) {
        return keyBuffer.subarray(0, 32);
      }
    } catch (e) {
      // Fall through to hash-based derivation
    }
  }
  
  // Derive key using PBKDF2 for better security
  const { pbkdf2Sync } = require('crypto');
  return pbkdf2Sync(keyString, 'hofflabs-salt', 10000, 32, 'sha256');
}

export const encrypt = async (text: string): Promise<string> => {
  if (!text) {
    throw new Error('Text to encrypt cannot be empty');
  }
  
  try {
    const key = deriveKey(ENCRYPTION_KEY);
    const iv = randomBytes(16);
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    
    // Combine IV + encrypted data and encode as base64
    return Buffer.concat([iv, encrypted]).toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

export const decrypt = async (encryptedData: string): Promise<string> => {
  if (!encryptedData) {
    throw new Error('Encrypted data cannot be empty');
  }
  
  try {
    const key = deriveKey(ENCRYPTION_KEY);
    const buffer = Buffer.from(encryptedData, 'base64');
    
    if (buffer.length < 16) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = buffer.subarray(0, 16);
    const data = buffer.subarray(16);
    
    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    return decipher.update(data, undefined, 'utf8') + decipher.final('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed');
  }
};
