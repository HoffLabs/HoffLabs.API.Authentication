import { describe, it, expect, beforeAll } from 'bun:test';
import { ApiKey, ApiKeyUsage, ApiKeyQuota, ApiKeyPermission, ApiKeyRateLimit, ApiKeyActivity } from '../interfaces/api/keys';
import runDbSync from '../database/utils/sync';

describe('API Key Management System Tests', () => {
  beforeAll(async () => {
    await runDbSync();
  });

  describe('ApiKey Interface', () => {
    it('should create valid API key entries', () => {
      const apiKey: ApiKey = {
        id: 1,
        user_uid: 'user-123',
        name: 'Primary API Key',
        key_prefix: '123456',
        key_hash: 'hashed-key-string',
        permissions: ['read', 'write'],
        scopes: ['api', 'admin'],
        rate_limit: 1000,
        rate_limit_window: 3600, // 1 hour
        is_active: true,
        last_used: new Date(),
        expires_at: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(apiKey.name).toBe('Primary API Key');
      expect(apiKey.is_active).toBe(true);
      expect(apiKey.key_prefix).toBe('123456');
    });

    it('should handle expired API keys', () => {
      const apiKey: ApiKey = {
        id: 2,
        user_uid: 'user-456',
        name: 'Expired Key',
        key_prefix: '654321',
        key_hash: 'expired-key-hash',
        permissions: ['read'],
        scopes: [],
        rate_limit: null,
        rate_limit_window: null,
        is_active: false,
        last_used: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        expires_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(apiKey.expires_at!.getTime()).toBeLessThan(new Date().getTime());
      expect(apiKey.is_active).toBe(false);
    });

    it('should validate API key scopes', () => {
      const validScopes = ['api', 'admin', 'user'];

      const apiKey: ApiKey = {
        id: 3,
        user_uid: 'user-789',
        name: 'Admin Key',
        key_prefix: 'admin123',
        key_hash: 'admin-key-hash',
        permissions: ['read', 'write', 'delete'],
        scopes: ['api', 'admin'],
        rate_limit: 100,
        rate_limit_window: 3600, // 1 hour
        is_active: true,
        last_used: new Date(),
        expires_at: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      apiKey.scopes.forEach(scope => {
        expect(validScopes).toContain(scope);
      });
    });
  });

  describe('ApiKeyUsage Interface', () => {
    it('should log API key usage events', () => {
      const usage: ApiKeyUsage = {
        id: 1,
        api_key_id: 1,
        endpoint: '/api/users',
        method: 'GET',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        response_status: 200,
        request_size: 512,
        response_size: 2048,
        duration_ms: 150,
        created_at: new Date()
      };

      expect(usage.endpoint).toBe('/api/users');
      expect(usage.response_status).toBe(200);
    });

    it('should handle different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE'];

      methods.forEach(method => {
        const usage: ApiKeyUsage = {
          id: 2,
          api_key_id: 1,
          endpoint: '/api/example',
          method: method as any,
          ip_address: '127.0.0.1',
          user_agent: 'Test Agent',
          response_status: 200,
          request_size: 256,
          response_size: 512,
          duration_ms: 100,
          created_at: new Date()
        };

        expect(methods).toContain(usage.method);
      });
    });
  });

  describe('ApiKeyQuota Interface', () => {
    it('should define quota limits and usage', () => {
      const quota: ApiKeyQuota = {
        id: 1,
        api_key_id: 3,
        quota_type: 'requests',
        limit_value: 10000,
        used_value: 4500,
        reset_period: 'daily',
        reset_at: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(quota.limit_value).toBeGreaterThan(quota.used_value);
      expect(quota.reset_period).toBe('daily');
    });

    it('should handle bandwidth quotas', () => {
      const quota: ApiKeyQuota = {
        id: 2,
        api_key_id: 3,
        quota_type: 'bandwidth',
        limit_value: 5000000, // 5 GB
        used_value: 3000000, // 3 GB
        reset_period: 'monthly',
        reset_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(quota.quota_type).toBe('bandwidth');
      expect(quota.limit_value).toBeGreaterThan(quota.used_value);
    });
  });

  describe('ApiKeyPermission Interface', () => {
    it('should define valid permissions', () => {
      const permission: ApiKeyPermission = {
        id: 1,
        name: 'User Management',
        description: 'Allow management of user accounts',
        resource: 'users',
        actions: ['create', 'update', 'delete'],
        created_at: new Date()
      };

      expect(permission.resource).toBe('users');
      expect(permission.actions).toContain('update');
    });

    it('should validate action permissions', () => {
      const actions = ['create', 'read', 'update', 'delete', 'write'];

      const permission: ApiKeyPermission = {
        id: 2,
        name: 'Resource Access',
        description: 'Controls access to data resources',
        resource: 'data',
        actions: ['read', 'write'],
        created_at: new Date()
      };

      permission.actions.forEach(action => {
        expect(actions).toContain(action);
      });
    });
  });

  describe('ApiKeyRateLimit Interface', () => {
    it('should track rate limit windows', () => {
      const rateLimit: ApiKeyRateLimit = {
        id: 1,
        api_key_id: 3,
        requests_count: 450,
        window_start: new Date(Date.now() - 1800 * 1000), // 30 minutes ago
        window_end: new Date(Date.now() + 1800 * 1000), // 30 minutes from now
        is_exceeded: false,
        created_at: new Date()
      };

      expect(rateLimit.requests_count).toBeLessThan(1000);
      expect(rateLimit.is_exceeded).toBe(false);
    });

    it('should update for exceeded limits', () => {
      const rateLimit: ApiKeyRateLimit = {
        id: 2,
        api_key_id: 3,
        requests_count: 1200,
        window_start: new Date(Date.now() - 3600 * 1000), // 1 hour ago
        window_end: new Date(),
        is_exceeded: true,
        created_at: new Date()
      };

      expect(rateLimit.is_exceeded).toBe(true);
      expect(rateLimit.requests_count).toBeGreaterThan(1000);
    });
  });

  describe('ApiKeyActivity Interface', () => {
    it('should track API key activities', () => {
      const activity: ApiKeyActivity = {
        id: 1,
        api_key_id: 1,
        activity_type: 'used',
        description: 'API key was utilized in a request',
        metadata: { endpoint: '/api/data' },
        created_at: new Date()
      };

      expect(activity.activity_type).toBe('used');
      expect(activity.metadata).toHaveProperty('endpoint');
    });

    it('should log different activity types', () => {
      const activities = ['created', 'updated', 'used', 'rate_limited', 'suspended', 'deleted'];

      activities.forEach(type => {
        const activity: ApiKeyActivity = {
          id: 2,
          api_key_id: 2,
          activity_type: type as any,
          description: `API key was ${type}`,
          metadata: null,
          created_at: new Date()
        };

        expect(activities).toContain(activity.activity_type);
      });
    });
  });
});

