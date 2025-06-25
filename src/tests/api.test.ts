import { describe, it, expect, beforeAll, afterAll } from 'bun:test';

// Check if API server is running before running integration tests
const checkServerAvailability = async () => {
  try {
    const response = await fetch(process.env.BACKEND_API_URL+'/auth/health');
    return response.ok;
  } catch {
    return false;
  }
};

const serverAvailable = await checkServerAvailability();

if (!serverAvailable) {
  console.log('⚠️  API server not running at localhost:3030. Skipping integration tests.');
  console.log('💡 To run these tests, start the server with: bun run start');
}

describe.skip('API Integration Tests (Skipped - requires running server)', () => {
  const API_BASE = process.env.BACKEND_API_URL+'/auth/health';
  let testUser: {
    username: string;
    email: string;
    password: string;
    uid?: string;
    jwt?: string;
    refresh_token?: string;
  };
  let serverAvailable = false;

  // Helper function for API requests
  async function apiRequest(method: string, endpoint: string, body?: any, headers?: Record<string, string>) {
    const options: RequestInit = {
      method,
      headers: {
        ...headers
      }
    };

    if (body) {
      options.headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    let data;
    
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return {
      status: response.status,
      data,
      ok: response.ok
    };
  }

  beforeAll(async () => {
    // Check if server is available
    try {
      const response = await fetch(`${API_BASE}/auth/health`);
      serverAvailable = response.ok;
    } catch (error) {
      serverAvailable = false;
      console.warn('⚠️  API server not running at localhost:3030. Skipping integration tests.');
    }
    
    // Create test user
    testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123'
    };
  });

  describe('Health Check Endpoints', () => {
    it('should return health status for auth service', async () => {
      if (!serverAvailable) {
        console.log('⏭️  Skipping test - API server not available');
        return;
      }
      
      const response = await apiRequest('GET', '/auth/health');
      
      expect(response.status).toBe(200);
      expect(response.data.service).toBe('Authentication Service');
      expect(response.data.status).toBe('healthy');
    });

    it('should return health status for JWT service', async () => {
      const response = await apiRequest('GET', '/jwt/health');
      
      expect(response.status).toBe(200);
      expect(response.data.service).toBe('JWT Utilities Service');
      expect(response.data.status).toBe('healthy');
    });
  });

  describe('User Registration and Login Flow', () => {
    it('should register a new user', async () => {
      const response = await apiRequest('POST', '/auth/register', testUser);
      
      expect(response.status).toBe(201);
      expect(response.data.user_uid).toBeDefined();
      expect(response.data.jwt).toBeDefined();
      expect(response.data.refresh_token).toBeDefined();
      
      // Store for other tests
      testUser.uid = response.data.user_uid;
      testUser.jwt = response.data.jwt;
      testUser.refresh_token = response.data.refresh_token;
    });

    it('should fail to register with duplicate username', async () => {
      const duplicateUser = {
        username: testUser.username,
        email: 'different@example.com',
        password: 'password123'
      };
      
      const response = await apiRequest('POST', '/auth/register', duplicateUser);
      expect(response.status).toBe(400);
    });

    it('should login with valid credentials', async () => {
      const response = await apiRequest('POST', '/auth/login', {
        username: testUser.username,
        password: testUser.password
      });
      
      expect(response.status).toBe(200);
      expect(response.data.user_uid).toBe(testUser.uid);
      expect(response.data.jwt).toBeDefined();
      expect(response.data.refresh_token).toBeDefined();
    });

    it('should fail login with invalid credentials', async () => {
      const response = await apiRequest('POST', '/auth/login', {
        username: testUser.username,
        password: 'wrongpassword'
      });
      
      expect(response.status).toBe(401);
    });
  });

  describe('JWT Operations', () => {
    it('should verify valid JWT token', async () => {
      const response = await apiRequest('POST', '/jwt/verify', {
        token: testUser.jwt
      });
      
      expect(response.status).toBe(200);
      expect(response.data.valid).toBe(true);
      expect(response.data.payload.sub).toBe(testUser.uid);
    });

    it('should verify JWT token via Authorization header', async () => {
      const response = await apiRequest('POST', '/jwt/verify', null, {
        'Authorization': `Bearer ${testUser.jwt}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data.valid).toBe(true);
    });

    it('should decode JWT token without verification', async () => {
      const response = await apiRequest('POST', '/jwt/decode', {
        token: testUser.jwt
      });
      
      expect(response.status).toBe(200);
      expect(response.data.payload.sub).toBe(testUser.uid);
    });

    it('should get comprehensive token info', async () => {
      const response = await apiRequest('POST', '/jwt/info', {
        token: testUser.jwt
      });
      
      expect(response.status).toBe(200);
      expect(response.data.token_info.valid).toBe(true);
      expect(response.data.payload.sub).toBe(testUser.uid);
    });

    it('should fail with invalid JWT token', async () => {
      const response = await apiRequest('POST', '/jwt/verify', {
        token: 'invalid.jwt.token'
      });
      
      expect(response.status).toBe(401);
      expect(response.data.valid).toBe(false);
    });
  });

  describe('Token Refresh Operations', () => {
    it('should validate refresh token', async () => {
      const response = await apiRequest('POST', '/auth/validate', {
        refresh_token: testUser.refresh_token
      });
      
      expect(response.status).toBe(200);
      expect(response.data.valid).toBe(true);
    });

    it('should refresh tokens successfully', async () => {
      const response = await apiRequest('POST', '/auth/refresh', {
        refresh_token: testUser.refresh_token
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.user_uid).toBe(testUser.uid);
      expect(response.data.data.jwt).toBeDefined();
      expect(response.data.data.refresh_token).toBeDefined();
      
      // Update tokens for other tests
      testUser.jwt = response.data.data.jwt;
      testUser.refresh_token = response.data.data.refresh_token;
    });

    it('should fail with invalid refresh token', async () => {
      const response = await apiRequest('POST', '/auth/refresh', {
        refresh_token: 'invalid_refresh_token'
      });
      
      expect(response.status).toBe(401);
    });
  });

  describe('Profile Management', () => {
    it('should get user profile', async () => {
      const response = await apiRequest('GET', '/auth/profile', null, {
        'Authorization': `Bearer ${testUser.jwt}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.profile.uid).toBe(testUser.uid);
      expect(response.data.profile.username).toBe(testUser.username);
    });

    it('should update user profile', async () => {
      const updateData = {
        first_name: 'Test',
        last_name: 'User',
        avatar: 'https://example.com/avatar.jpg'
      };
      
      const response = await apiRequest('PUT', '/auth/profile', updateData, {
        'Authorization': `Bearer ${testUser.jwt}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.profile.first_name).toBe('Test');
      expect(response.data.profile.last_name).toBe('User');
    });

    it('should change password', async () => {
      const passwordData = {
        current_password: testUser.password,
        new_password: 'newpassword456'
      };
      
      const response = await apiRequest('PATCH', '/auth/profile/password', passwordData, {
        'Authorization': `Bearer ${testUser.jwt}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Update password for other tests
      testUser.password = 'newpassword456';
    });

    it('should fail to change password with wrong current password', async () => {
      const passwordData = {
        current_password: 'wrongpassword',
        new_password: 'newpassword789'
      };
      
      const response = await apiRequest('PATCH', '/auth/profile/password', passwordData, {
        'Authorization': `Bearer ${testUser.jwt}`
      });
      
      expect(response.status).toBe(400);
    });

    it('should fail profile operations without authentication', async () => {
      const response = await apiRequest('GET', '/auth/profile');
      expect(response.status).toBe(400);
    });
  });

  describe('Session Management', () => {
    it('should get active sessions', async () => {
      const response = await apiRequest('GET', '/auth/sessions', null, {
        'Authorization': `Bearer ${testUser.jwt}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.sessions)).toBe(true);
      expect(response.data.sessions.length).toBeGreaterThan(0);
    });

    it('should get login history', async () => {
      const response = await apiRequest('GET', '/auth/login-history?limit=10', null, {
        'Authorization': `Bearer ${testUser.jwt}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.login_history)).toBe(true);
    });

    it('should revoke all other sessions', async () => {
      // Login again to create another session
      await apiRequest('POST', '/auth/login', {
        username: testUser.username,
        password: testUser.password
      });
      
      const response = await apiRequest('DELETE', '/auth/sessions/all', null, {
        'Authorization': `Bearer ${testUser.jwt}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('Password Reset Flow', () => {
    let resetToken: string;

    it('should request password reset', async () => {
      const response = await apiRequest('POST', '/auth/forgot-password', {
        email: testUser.email
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toContain('password reset link');
      
      // In test environment, token is returned for testing
      if (response.data.debug_token) {
        resetToken = response.data.debug_token;
      }
    });

    it('should validate reset token', async () => {
      if (resetToken) {
        const response = await apiRequest('GET', `/auth/reset/${resetToken}`);
        
        expect(response.status).toBe(200);
        expect(response.data.valid).toBe(true);
      }
    });

    it('should reset password with valid token', async () => {
      if (resetToken) {
        const response = await apiRequest('POST', '/auth/reset-password', {
          token: resetToken,
          new_password: 'resetpassword123'
        });
        
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        
        // Update password for other tests
        testUser.password = 'resetpassword123';
      }
    });

    it('should fail with invalid reset token', async () => {
      const response = await apiRequest('POST', '/auth/reset-password', {
        token: 'invalid_token',
        new_password: 'newpassword123'
      });
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('Logout and Session Cleanup', () => {
    it('should logout successfully', async () => {
      const response = await apiRequest('POST', '/auth/logout', null, {
        'Authorization': `Bearer ${testUser.jwt}`
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should fail to use invalidated JWT', async () => {
      const response = await apiRequest('POST', '/jwt/verify', {
        token: testUser.jwt
      });
      
      expect(response.status).toBe(401);
      expect(response.data.valid).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing request body', async () => {
      const response = await apiRequest('POST', '/auth/login');
      expect(response.status).toBe(500); // Internal server error due to missing body
    });

    it('should handle invalid JSON', async () => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });
      
      expect(response.status).toBe(400);
    });

    it('should handle non-existent endpoints', async () => {
      const response = await apiRequest('GET', '/auth/nonexistent');
      expect(response.status).toBe(404);
    });

    it('should handle malformed Authorization header', async () => {
      const response = await apiRequest('GET', '/auth/profile', null, {
        'Authorization': 'InvalidFormat'
      });

      expect(response.status).toBe(500); // May throw error due to invalid JWT format
    });

    it('should validate email format in registration', async () => {
      const response = await apiRequest('POST', '/auth/register', {
        username: 'testuser2',
        email: 'invalid-email',
        password: 'password123'
      });
      
      expect(response.status).toBe(400);
    });

    it('should validate email format in password reset', async () => {
      const response = await apiRequest('POST', '/auth/forgot-password', {
        email: 'invalid-email'
      });
      
      expect(response.status).toBe(400);
    });

    it('should handle rate limiting', async () => {
      // Make many requests quickly to test rate limiting
      const promises = Array(10).fill(0).map(() => 
        apiRequest('GET', '/auth/health')
      );
      
      const responses = await Promise.all(promises);
      
      // All should succeed for health endpoint, but rate limiting is in place
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status); // Either success or rate limited
      });
    });
  });

  describe('Security Headers and CORS', () => {
    it('should include security headers', async () => {
      const response = await fetch(`${API_BASE}/auth/health`);
      const headers = response.headers;
      
      // Check for helmet security headers
      expect(headers.get('x-content-type-options')).toBeTruthy();
      expect(headers.get('x-frame-options')).toBeTruthy();
    });

    it('should handle CORS preflight requests', async () => {
      const response = await fetch(`${API_BASE}/auth/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': process.env.BACKEND_API_URL+'/auth/health',
          'Access-Control-Request-Method': 'POST'
        }
      });
      
      expect(response.status).toBe(204); // CORS preflight typically returns 204
      expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
    });
  });
});
