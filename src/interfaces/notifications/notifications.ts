export interface Notification {
  id: number;
  user_uid: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'security';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  is_actionable: boolean;
  action_url: string | null;
  action_text: string | null;
  metadata: Record<string, any> | null;
  expires_at: Date | null;
  created_at: Date;
  read_at: Date | null;
}

export interface NotificationPreference {
  id: number;
  user_uid: string;
  notification_type: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'disabled';
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationTemplate {
  id: number;
  name: string;
  description: string | null;
  type: 'email' | 'push' | 'sms' | 'in_app';
  subject_template: string | null;
  body_template: string;
  variables: string[];
  is_active: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationDelivery {
  id: number;
  notification_id: number;
  delivery_method: 'email' | 'push' | 'sms' | 'in_app';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  recipient: string;
  external_id: string | null;
  error_message: string | null;
  delivered_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationQueue {
  id: number;
  notification_id: number;
  scheduled_at: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationSettings {
  id: number;
  user_uid: string;
  global_email_enabled: boolean;
  global_push_enabled: boolean;
  global_sms_enabled: boolean;
  timezone: string;
  language: string;
  digest_frequency: 'never' | 'daily' | 'weekly';
  created_at: Date;
  updated_at: Date;
}
