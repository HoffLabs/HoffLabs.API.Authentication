export interface AnalyticsEvent {
  id: number;
  user_uid: string | null;
  event_name: string;
  properties: Record<string, any>;
  session_id: string | null;
  timestamp: Date;
  ip_address: string | null;
  user_agent: string | null;
}

export interface UserMetrics {
  user_uid: string;
  total_sessions: number;
  total_session_duration: number;
  last_active: Date;
  total_events: number;
  page_views: number;
  feature_usage: Record<string, number>;
  calculated_at: Date;
}

export interface SystemMetrics {
  id: number;
  metric_name: string;
  metric_value: number;
  metric_type: 'counter' | 'gauge' | 'histogram';
  tags: Record<string, string>;
  timestamp: Date;
}

export interface DashboardWidget {
  id: number;
  name: string;
  type: 'chart' | 'metric' | 'table' | 'counter';
  query: string;
  config: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface AnalyticsReport {
  id: number;
  name: string;
  description: string | null;
  query: string;
  schedule: string | null;
  recipients: string[];
  format: 'json' | 'csv' | 'pdf';
  last_run: Date | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}
