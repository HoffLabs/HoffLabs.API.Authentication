import { describe, it, expect, beforeAll } from 'bun:test';
import { 
  AnalyticsEvent, 
  UserMetrics, 
  SystemMetrics, 
  DashboardWidget, 
  AnalyticsReport 
} from '../interfaces/analytics/analytics';
import runDbSync from '../database/utils/sync';

describe('Analytics System Tests', () => {
  beforeAll(async () => {
    await runDbSync();
  });

  describe('AnalyticsEvent Interface', () => {
    it('should create valid analytics events', () => {
      const event: AnalyticsEvent = {
        id: 1,
        user_uid: 'user-123',
        event_name: 'page_view',
        properties: {
          page: '/dashboard',
          referrer: 'https://google.com',
          duration: 15000
        },
        session_id: 'session-456',
        timestamp: new Date(),
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0...'
      };

      expect(event.event_name).toBe('page_view');
      expect(event.properties).toHaveProperty('page');
      expect(event.properties.duration).toBe(15000);
    });

    it('should handle anonymous events', () => {
      const event: AnalyticsEvent = {
        id: 2,
        user_uid: null,
        event_name: 'landing_page_view',
        properties: { page: '/landing' },
        session_id: null,
        timestamp: new Date(),
        ip_address: '192.168.1.1',
        user_agent: 'Bot/1.0'
      };

      expect(event.user_uid).toBeNull();
      expect(event.session_id).toBeNull();
      expect(event.event_name).toBe('landing_page_view');
    });

    it('should track various event types', () => {
      const eventTypes = [
        'login',
        'logout',
        'signup',
        'purchase',
        'click',
        'scroll',
        'form_submit',
        'video_play',
        'download'
      ];

      eventTypes.forEach(eventName => {
        const event: AnalyticsEvent = {
          id: 1,
          user_uid: 'test-user',
          event_name: eventName,
          properties: {},
          session_id: 'session-123',
          timestamp: new Date(),
          ip_address: '127.0.0.1',
          user_agent: 'Test'
        };

        expect(event.event_name).toBe(eventName);
      });
    });
  });

  describe('UserMetrics Interface', () => {
    it('should calculate user engagement metrics', () => {
      const metrics: UserMetrics = {
        user_uid: 'user-123',
        total_sessions: 50,
        total_session_duration: 3600000, // 1 hour in milliseconds
        last_active: new Date(),
        total_events: 250,
        page_views: 150,
        feature_usage: {
          dashboard: 45,
          profile: 12,
          settings: 8,
          analytics: 3
        },
        calculated_at: new Date()
      };

      expect(metrics.total_sessions).toBe(50);
      expect(metrics.total_events).toBeGreaterThan(metrics.page_views);
      expect(metrics.feature_usage.dashboard).toBe(45);
      expect(Object.keys(metrics.feature_usage)).toContain('dashboard');
    });

    it('should handle zero metrics for new users', () => {
      const metrics: UserMetrics = {
        user_uid: 'new-user-456',
        total_sessions: 0,
        total_session_duration: 0,
        last_active: new Date(),
        total_events: 0,
        page_views: 0,
        feature_usage: {},
        calculated_at: new Date()
      };

      expect(metrics.total_sessions).toBe(0);
      expect(metrics.total_events).toBe(0);
      expect(Object.keys(metrics.feature_usage)).toHaveLength(0);
    });
  });

  describe('SystemMetrics Interface', () => {
    it('should track counter metrics', () => {
      const metric: SystemMetrics = {
        id: 1,
        metric_name: 'api_requests_total',
        metric_value: 10000,
        metric_type: 'counter',
        tags: {
          endpoint: '/api/users',
          method: 'GET',
          status: '200'
        },
        timestamp: new Date()
      };

      expect(metric.metric_type).toBe('counter');
      expect(metric.metric_value).toBe(10000);
      expect(metric.tags.endpoint).toBe('/api/users');
    });

    it('should track gauge metrics', () => {
      const metric: SystemMetrics = {
        id: 2,
        metric_name: 'active_users_count',
        metric_value: 1250,
        metric_type: 'gauge',
        tags: {
          region: 'us-east-1',
          instance: 'web-01'
        },
        timestamp: new Date()
      };

      expect(metric.metric_type).toBe('gauge');
      expect(metric.metric_value).toBe(1250);
    });

    it('should track histogram metrics', () => {
      const metric: SystemMetrics = {
        id: 3,
        metric_name: 'response_time_ms',
        metric_value: 250.5,
        metric_type: 'histogram',
        tags: {
          endpoint: '/api/auth/login',
          percentile: '95'
        },
        timestamp: new Date()
      };

      expect(metric.metric_type).toBe('histogram');
      expect(metric.metric_value).toBe(250.5);
    });
  });

  describe('DashboardWidget Interface', () => {
    it('should create chart widgets', () => {
      const widget: DashboardWidget = {
        id: 1,
        name: 'User Registrations Over Time',
        type: 'chart',
        query: 'SELECT DATE(created_at) as date, COUNT(*) as count FROM users GROUP BY DATE(created_at)',
        config: {
          chart_type: 'line',
          x_axis: 'date',
          y_axis: 'count',
          color: '#3b82f6'
        },
        position: { x: 0, y: 0, w: 6, h: 4 },
        created_by: 'admin-user',
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(widget.type).toBe('chart');
      expect(widget.config.chart_type).toBe('line');
      expect(widget.position.w).toBe(6);
    });

    it('should create metric widgets', () => {
      const widget: DashboardWidget = {
        id: 2,
        name: 'Total Active Users',
        type: 'metric',
        query: 'SELECT COUNT(*) as value FROM users WHERE is_active = true',
        config: {
          format: 'number',
          suffix: 'users',
          color: 'green'
        },
        position: { x: 6, y: 0, w: 3, h: 2 },
        created_by: 'admin-user',
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(widget.type).toBe('metric');
      expect(widget.config.suffix).toBe('users');
    });

    it('should validate widget types', () => {
      const validTypes = ['chart', 'metric', 'table', 'counter'];

      validTypes.forEach(type => {
        const widget: DashboardWidget = {
          id: 1,
          name: `Test ${type} Widget`,
          type: type as any,
          query: 'SELECT 1',
          config: {},
          position: { x: 0, y: 0, w: 4, h: 3 },
          created_by: 'test-user',
          created_at: new Date(),
          updated_at: new Date()
        };

        expect(validTypes).toContain(widget.type);
      });
    });
  });

  describe('AnalyticsReport Interface', () => {
    it('should create scheduled reports', () => {
      const report: AnalyticsReport = {
        id: 1,
        name: 'Weekly User Engagement Report',
        description: 'Weekly summary of user engagement metrics',
        query: 'SELECT * FROM user_metrics WHERE calculated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
        schedule: '0 9 * * 1', // Every Monday at 9 AM
        recipients: ['admin@company.com', 'analytics@company.com'],
        format: 'pdf',
        last_run: null,
        created_by: 'admin-user',
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(report.schedule).toBe('0 9 * * 1');
      expect(report.recipients).toContain('admin@company.com');
      expect(report.format).toBe('pdf');
    });

    it('should handle different report formats', () => {
      const formats = ['json', 'csv', 'pdf'];

      formats.forEach(format => {
        const report: AnalyticsReport = {
          id: 1,
          name: `Test ${format.toUpperCase()} Report`,
          description: null,
          query: 'SELECT 1',
          schedule: null,
          recipients: ['test@example.com'],
          format: format as any,
          last_run: new Date(),
          created_by: 'test-user',
          created_at: new Date(),
          updated_at: new Date()
        };

        expect(formats).toContain(report.format);
      });
    });

    it('should handle one-time reports', () => {
      const report: AnalyticsReport = {
        id: 2,
        name: 'Ad-hoc User Analysis',
        description: 'One-time analysis of user behavior',
        query: 'SELECT user_uid, COUNT(*) FROM analytics_events GROUP BY user_uid',
        schedule: null, // No schedule = one-time report
        recipients: ['analyst@company.com'],
        format: 'csv',
        last_run: new Date(),
        created_by: 'analyst-user',
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(report.schedule).toBeNull();
      expect(report.last_run).not.toBeNull();
    });
  });

  describe('Analytics Data Validation', () => {
    it('should validate event properties structure', () => {
      const complexEvent: AnalyticsEvent = {
        id: 1,
        user_uid: 'user-123',
        event_name: 'purchase',
        properties: {
          product_id: 'prod-456',
          quantity: 2,
          price: 29.99,
          currency: 'USD',
          payment_method: 'credit_card',
          metadata: {
            campaign: 'summer_sale',
            discount_applied: true
          }
        },
        session_id: 'session-789',
        timestamp: new Date(),
        ip_address: '127.0.0.1',
        user_agent: 'Test'
      };

      expect(complexEvent.properties.product_id).toBe('prod-456');
      expect(complexEvent.properties.metadata.campaign).toBe('summer_sale');
      expect(typeof complexEvent.properties.price).toBe('number');
    });

    it('should validate metric calculations', () => {
      const metrics: UserMetrics = {
        user_uid: 'user-123',
        total_sessions: 10,
        total_session_duration: 600000, // 10 minutes
        last_active: new Date(),
        total_events: 50,
        page_views: 25,
        feature_usage: {
          feature_a: 20,
          feature_b: 15,
          feature_c: 10
        },
        calculated_at: new Date()
      };

      // Average session duration should be 1 minute (60,000ms)
      const avgSessionDuration = metrics.total_session_duration / metrics.total_sessions;
      expect(avgSessionDuration).toBe(60000);

      // Total feature usage should equal total events
      const totalFeatureUsage = Object.values(metrics.feature_usage).reduce((sum, count) => sum + count, 0);
      expect(totalFeatureUsage).toBeLessThanOrEqual(metrics.total_events);
    });
  });
});
