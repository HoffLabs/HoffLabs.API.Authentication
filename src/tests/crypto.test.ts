import { describe, it, expect, beforeAll } from 'bun:test';
import { hash, encrypt, decrypt } from '../utils/crypto';
import { 
  hashPassword, 
  encryptPassword, 
  verifyPassword, 
  generateUID 
} from '../utils/auth/authEncryption';
import runDbSync from '../database/utils/sync';
import { randomBytes } from 'crypto';

describe('Cryptographic Utilities Tests', () => {
  beforeAll(async () => {
    await runDbSync(); // Initialize the database for UID generation
  });
  describe('Hashing Functions', () => {
    it('should hash strings consistently', () => {
      const input = 'test_string';
      const hash1 = hash(input);
      const hash2 = hash(input);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toBeDefined();
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBe(64); // SHA256 hex output
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hash('input1');
      const hash2 = hash('input2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty strings', () => {
      const emptyHash = hash('');
      expect(emptyHash).toBeDefined();
      expect(emptyHash.length).toBe(64);
    });

    it('should handle special characters', () => {
      const specialHash = hash('!@#$%^&*()_+{}[]|\\:";\'<>?,./');
      expect(specialHash).toBeDefined();
      expect(specialHash.length).toBe(64);
    });

    it('should handle unicode characters', () => {
      const unicodeHash = hash('测试🚀émojis');
      expect(unicodeHash).toBeDefined();
      expect(unicodeHash.length).toBe(64);
    });

    it('should hash with salt', () => {
      const input = 'test';
      const salt = 'salt';
      const hash1 = hash(input);
      const hash2 = hash(input, salt);
      
      expect(hash1).not.toBe(hash2);
      expect(hash2).toBeDefined();
      expect(hash2.length).toBe(64);
    });
  });

  describe('Encryption and Decryption', () => {
    const testData = [
      'simple string',
      'special chars !@#$%^&*()',
      'unicode: 测试🚀émojis',
      'numbers: 1234567890',
      'long string: ' + 'a'.repeat(1000),
      '',
      JSON.stringify({ test: 'object', number: 123 })
    ];

    testData.forEach((data, index) => {
      it(`should encrypt and decrypt data case ${index + 1}: "${data.slice(0, 50)}..."`, async () => {
        const encrypted = await encrypt(data);
        const decrypted = await decrypt(encrypted);
        
        expect(decrypted).toBe(data);
        expect(encrypted).not.toBe(data);
        expect(encrypted).toBeDefined();
      });
    });

    it('should produce different encrypted outputs for same input', async () => {
      const input = 'test_data';
      const encrypted1 = await encrypt(input);
      const encrypted2 = await encrypt(input);
      
      // Should be different due to random IV
      expect(encrypted1).not.toBe(encrypted2);
      
      // But should decrypt to same value
      const decrypted1 = await decrypt(encrypted1);
      const decrypted2 = await decrypt(encrypted2);
      expect(decrypted1).toBe(input);
      expect(decrypted2).toBe(input);
    });

    it('should handle large data', async () => {
      const largeData = 'x'.repeat(10000);
      const encrypted = await encrypt(largeData);
      const decrypted = await decrypt(encrypted);
      
      expect(decrypted).toBe(largeData);
    });

    it('should fail gracefully with invalid encrypted data', async () => {
      try {
        await decrypt('invalid_encrypted_data');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should fail gracefully with truncated encrypted data', async () => {
      const encrypted = await encrypt('test');
      const truncated = encrypted.slice(0, 10);
      
      try {
        await decrypt(truncated);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Password Hashing and Verification', () => {
    it('should hash passwords with salt', async () => {
      const password = 'test_password';
      const hashed = await hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.includes(':')).toBe(true); // Contains salt:hash
      
      const parts = hashed.split(':');
      expect(parts.length).toBe(2);
      expect(parts[0].length).toBeGreaterThan(0); // Salt
      expect(parts[1].length).toBeGreaterThan(0); // Hash
    });

    it('should create different hashes for same password', async () => {
      const password = 'test_password';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2); // Different due to random salt
    });

    it('should encrypt password hashes', async () => {
      const password = 'test_password';
      const encrypted = await encryptPassword(password);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(password);
      expect(encrypted.includes(':')).toBe(false); // Should be encrypted, not plain salt:hash
    });

    it('should verify passwords correctly', async () => {
      const password = 'test_password';
      const encrypted = await encryptPassword(password);
      
      const isValid = await verifyPassword(password, encrypted);
      expect(isValid).toBe(true);
      
      const isInvalid = await verifyPassword('wrong_password', encrypted);
      expect(isInvalid).toBe(false);
    });

    it('should handle empty passwords', async () => {
      const encrypted = await encryptPassword('');
      const isValid = await verifyPassword('', encrypted);
      expect(isValid).toBe(true);
    });

    it('should handle special characters in passwords', async () => {
      const password = '!@#$%^&*()_+{}[]|\\:";\'<>?,./测试🚀';
      const encrypted = await encryptPassword(password);
      const isValid = await verifyPassword(password, encrypted);
      expect(isValid).toBe(true);
    });

    it('should handle long passwords', async () => {
      const password = 'a'.repeat(1000);
      const encrypted = await encryptPassword(password);
      const isValid = await verifyPassword(password, encrypted);
      expect(isValid).toBe(true);
    });

    it('should fail verification with corrupted hash', async () => {
      const password = 'test_password';
      const encrypted = await encryptPassword(password);
      const corrupted = encrypted.slice(0, -5) + 'xxxxx';
      
      try {
        const isValid = await verifyPassword(password, corrupted);
        expect(isValid).toBe(false);
      } catch (error) {
        // May throw error due to decryption failure
        expect(error).toBeDefined();
      }
    });
  });

  describe('UID Generation', () => {
    it('should generate unique UIDs', async () => {
      const uid1 = await generateUID();
      const uid2 = await generateUID();
      
      expect(uid1).not.toBe(uid2);
      expect(uid1).toBeDefined();
      expect(uid2).toBeDefined();
    });

    it('should generate UIDs with correct format', async () => {
      const uid = await generateUID();
      
      expect(typeof uid).toBe('string');
      expect(uid.length).toBe(64); // 32 bytes in hex
      expect(/^[a-f0-9]+$/.test(uid)).toBe(true); // Only hex characters
    });

    it('should generate multiple unique UIDs', async () => {
      const uids = await Promise.all([
        generateUID(),
        generateUID(),
        generateUID(),
        generateUID(),
        generateUID()
      ]);
      
      const uniqueUids = new Set(uids);
      expect(uniqueUids.size).toBe(uids.length); // All should be unique
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null inputs in hash function', () => {
      // Hash function should handle null gracefully or throw
      const result1 = hash(null as any);
      const result2 = hash(undefined as any);
      expect(typeof result1).toBe('string');
      expect(typeof result2).toBe('string');
    });

    it('should handle null inputs in encrypt function', async () => {
      try {
        await encrypt(null as any);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle null inputs in decrypt function', async () => {
      try {
        await decrypt(null as any);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty string in decrypt', async () => {
      try {
        await decrypt('');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle malformed base64 in decrypt', async () => {
      try {
        await decrypt('not-base64-data!@#');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance and Consistency', () => {
    it('should perform encryption/decryption in reasonable time', async () => {
      const data = 'performance test data';
      const start = Date.now();
      
      const encrypted = await encrypt(data);
      const decrypted = await decrypt(encrypted);
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(1000); // Should complete within 1 second
      expect(decrypted).toBe(data);
    });

    it('should handle concurrent operations', async () => {
      const data = 'concurrent test';
      const operations = Array(10).fill(0).map(() => 
        encrypt(data).then(encrypted => decrypt(encrypted))
      );
      
      const results = await Promise.all(operations);
      results.forEach(result => {
        expect(result).toBe(data);
      });
    });

    it('should maintain hash consistency across calls', () => {
      const input = 'consistency_test';
      const hashes = Array(10).fill(0).map(() => hash(input));
      
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(1); // All should be the same
    });
  });
});
