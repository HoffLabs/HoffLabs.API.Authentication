export interface UserDevice {
  id: number;
  user_uid: string;
  device_id: string;
  device_name: string | null;
  device_type: 'mobile' | 'desktop' | 'tablet' | 'other';
  operating_system: string | null;
  browser: string | null;
  ip_address: string | null;
  location: string | null;
  is_trusted: boolean;
  is_active: boolean;
  last_used: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DeviceSession {
  id: number;
  device_id: number;
  session_id: string;
  started_at: Date;
  ended_at: Date | null;
  is_active: boolean;
}

export interface DeviceSecurityEvent {
  id: number;
  device_id: number;
  event_type: 'login_attempt' | 'suspicious_activity' | 'location_change' | 'new_device';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip_address: string | null;
  location: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface DeviceFingerprint {
  id: number;
  device_id: number;
  fingerprint_hash: string;
  screen_resolution: string | null;
  timezone: string | null;
  language: string | null;
  platform: string | null;
  webgl_vendor: string | null;
  webgl_renderer: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TrustedDevice {
  id: number;
  user_uid: string;
  device_id: number;
  trusted_at: Date;
  trusted_by: string; // user_uid of the user who trusted the device
  expires_at: Date | null;
  is_active: boolean;
}
