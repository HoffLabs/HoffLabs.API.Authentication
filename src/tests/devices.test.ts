import { describe, it, expect, beforeAll } from 'bun:test';
import { 
  UserDevice, 
  DeviceSession, 
  DeviceSecurityEvent, 
  DeviceFingerprint, 
  TrustedDevice 
} from '../interfaces/devices/devices';
import runDbSync from '../database/utils/sync';

describe('Device Management System Tests', () => {
  beforeAll(async () => {
    await runDbSync();
  });

  describe('UserDevice Interface', () => {
    it('should create valid device entries', () => {
      const device: UserDevice = {
        id: 1,
        user_uid: 'user-123',
        device_id: 'device-abc-123',
        device_name: 'John\'s iPhone',
        device_type: 'mobile',
        operating_system: 'iOS 16.1',
        browser: 'Safari',
        ip_address: '192.168.1.100',
        location: 'San Francisco, CA',
        is_trusted: true,
        is_active: true,
        last_used: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(device.device_type).toBe('mobile');
      expect(device.is_trusted).toBe(true);
      expect(device.device_name).toBe('John\'s iPhone');
    });

    it('should handle different device types', () => {
      const deviceTypes = ['mobile', 'desktop', 'tablet', 'other'];

      deviceTypes.forEach(type => {
        const device: UserDevice = {
          id: 1,
          user_uid: 'user-123',
          device_id: `device-${type}-123`,
          device_name: null,
          device_type: type as any,
          operating_system: null,
          browser: null,
          ip_address: '127.0.0.1',
          location: null,
          is_trusted: false,
          is_active: true,
          last_used: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        };

        expect(deviceTypes).toContain(device.device_type);
      });
    });

    it('should handle untrusted devices', () => {
      const device: UserDevice = {
        id: 2,
        user_uid: 'user-456',
        device_id: 'unknown-device-789',
        device_name: null,
        device_type: 'other',
        operating_system: 'Unknown',
        browser: 'Unknown Browser',
        ip_address: '45.123.45.67',
        location: 'Unknown Location',
        is_trusted: false,
        is_active: false,
        last_used: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(device.is_trusted).toBe(false);
      expect(device.is_active).toBe(false);
    });
  });

  describe('DeviceSession Interface', () => {
    it('should track device sessions', () => {
      const session: DeviceSession = {
        id: 1,
        device_id: 1,
        session_id: 'session-abc-123',
        started_at: new Date(),
        ended_at: null,
        is_active: true
      };

      expect(session.is_active).toBe(true);
      expect(session.ended_at).toBeNull();
    });

    it('should handle ended sessions', () => {
      const session: DeviceSession = {
        id: 2,
        device_id: 1,
        session_id: 'session-xyz-789',
        started_at: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        ended_at: new Date(),
        is_active: false
      };

      expect(session.is_active).toBe(false);
      expect(session.ended_at).not.toBeNull();
    });
  });

  describe('DeviceSecurityEvent Interface', () => {
    it('should track login attempts', () => {
      const event: DeviceSecurityEvent = {
        id: 1,
        device_id: 1,
        event_type: 'login_attempt',
        description: 'Successful login from trusted device',
        severity: 'low',
        ip_address: '192.168.1.100',
        location: 'San Francisco, CA',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1)',
        created_at: new Date()
      };

      expect(event.event_type).toBe('login_attempt');
      expect(event.severity).toBe('low');
    });

    it('should track suspicious activity', () => {
      const event: DeviceSecurityEvent = {
        id: 2,
        device_id: 2,
        event_type: 'suspicious_activity',
        description: 'Multiple failed login attempts from new device',
        severity: 'high',
        ip_address: '45.123.45.67',
        location: 'Unknown Location',
        user_agent: 'Suspicious User Agent',
        created_at: new Date()
      };

      expect(event.event_type).toBe('suspicious_activity');
      expect(event.severity).toBe('high');
    });

    it('should validate event types and severities', () => {
      const eventTypes = ['login_attempt', 'suspicious_activity', 'location_change', 'new_device'];
      const severities = ['low', 'medium', 'high', 'critical'];

      eventTypes.forEach(eventType => {
        severities.forEach(severity => {
          const event: DeviceSecurityEvent = {
            id: 1,
            device_id: 1,
            event_type: eventType as any,
            description: `Test event: ${eventType}`,
            severity: severity as any,
            ip_address: '127.0.0.1',
            location: null,
            user_agent: null,
            created_at: new Date()
          };

          expect(eventTypes).toContain(event.event_type);
          expect(severities).toContain(event.severity);
        });
      });
    });
  });

  describe('DeviceFingerprint Interface', () => {
    it('should create device fingerprints', () => {
      const fingerprint: DeviceFingerprint = {
        id: 1,
        device_id: 1,
        fingerprint_hash: 'sha256:abcd1234567890...',
        screen_resolution: '1920x1080',
        timezone: 'America/Los_Angeles',
        language: 'en-US',
        platform: 'MacIntel',
        webgl_vendor: 'Apple Inc.',
        webgl_renderer: 'Apple M1 Pro',
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(fingerprint.fingerprint_hash.startsWith('sha256:')).toBe(true);
      expect(fingerprint.screen_resolution).toBe('1920x1080');
      expect(fingerprint.timezone).toBe('America/Los_Angeles');
    });

    it('should handle mobile fingerprints', () => {
      const fingerprint: DeviceFingerprint = {
        id: 2,
        device_id: 2,
        fingerprint_hash: 'sha256:mobile1234567890...',
        screen_resolution: '375x812',
        timezone: 'America/New_York',
        language: 'en-US',
        platform: 'iPhone',
        webgl_vendor: null,
        webgl_renderer: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(fingerprint.screen_resolution).toBe('375x812');
      expect(fingerprint.platform).toBe('iPhone');
      expect(fingerprint.webgl_vendor).toBeNull();
    });
  });

  describe('TrustedDevice Interface', () => {
    it('should create trusted device entries', () => {
      const trustedDevice: TrustedDevice = {
        id: 1,
        user_uid: 'user-123',
        device_id: 1,
        trusted_at: new Date(),
        trusted_by: 'user-123',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        is_active: true
      };

      expect(trustedDevice.is_active).toBe(true);
      expect(trustedDevice.trusted_by).toBe('user-123');
      expect(trustedDevice.expires_at).not.toBeNull();
    });

    it('should handle permanent trusted devices', () => {
      const trustedDevice: TrustedDevice = {
        id: 2,
        user_uid: 'user-456',
        device_id: 2,
        trusted_at: new Date(),
        trusted_by: 'user-456',
        expires_at: null, // Never expires
        is_active: true
      };

      expect(trustedDevice.expires_at).toBeNull();
      expect(trustedDevice.is_active).toBe(true);
    });

    it('should handle revoked trusted devices', () => {
      const trustedDevice: TrustedDevice = {
        id: 3,
        user_uid: 'user-789',
        device_id: 3,
        trusted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        trusted_by: 'user-789',
        expires_at: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // 23 days from now
        is_active: false // Manually revoked
      };

      expect(trustedDevice.is_active).toBe(false);
      expect(trustedDevice.expires_at?.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Device Security Logic', () => {
    it('should identify potentially suspicious device activity', () => {
      const suspiciousEvents = [
        {
          event_type: 'login_attempt',
          description: 'Failed login attempt',
          severity: 'medium',
          count: 5
        },
        {
          event_type: 'location_change',
          description: 'Login from different country',
          severity: 'high',
          count: 1
        },
        {
          event_type: 'new_device',
          description: 'First login from unrecognized device',
          severity: 'medium',
          count: 1
        }
      ];

      const totalRiskScore = suspiciousEvents.reduce((score, event) => {
        const severityMultiplier = {
          'low': 1,
          'medium': 2,
          'high': 3,
          'critical': 4
        };
        return score + (event.count * severityMultiplier[event.severity as keyof typeof severityMultiplier]);
      }, 0);

      expect(totalRiskScore).toBe(15); // (5*2) + (1*3) + (1*2) = 15
    });

    it('should validate device trust expiration logic', () => {
      const now = Date.now();
      const expiredDevice: TrustedDevice = {
        id: 1,
        user_uid: 'user-123',
        device_id: 1,
        trusted_at: new Date(now - 35 * 24 * 60 * 60 * 1000), // 35 days ago
        trusted_by: 'user-123',
        expires_at: new Date(now - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        is_active: true
      };

      const isExpired = expiredDevice.expires_at && expiredDevice.expires_at.getTime() < now;
      expect(isExpired).toBe(true);

      const validDevice: TrustedDevice = {
        id: 2,
        user_uid: 'user-456',
        device_id: 2,
        trusted_at: new Date(now - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        trusted_by: 'user-456',
        expires_at: new Date(now + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        is_active: true
      };

      const isValidExpired = validDevice.expires_at && validDevice.expires_at.getTime() < now;
      expect(isValidExpired).toBe(false);
    });
  });
});
