import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export const registerSwagger = async (fastify: FastifyInstance) => {
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Hofflabs Private Authentication API',
        description: 'Production-ready authentication API with JWT management, user profiles, sessions, password reset, email verification, and enterprise interface definitions for Hofflabs platform',
        version: '1.5.0',
        contact: {
          name: 'Hofflabs',
          email: 'api@hofflabs.com'
        },
        license: {
          name: 'Private License',
          url: 'https://hofflabs.com/license'
        }
      },
      host: 'localhost:3030',
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        // Core implemented features
        { name: 'Authentication', description: 'User registration, login, logout, and token management' },
        { name: 'JWT', description: 'JWT token verification, decoding, and utilities' },
        { name: 'Profile', description: 'User profile management and updates' },
        { name: 'Sessions', description: 'Active session management and revocation' },
        { name: 'Password Reset', description: 'Password reset request and validation' },
        { name: 'Email Verification', description: 'Email verification and resend functionality' },
        { name: 'Health', description: 'Service health checks and status' },
        
        // Enterprise features (placeholder implementations)
        { name: 'Admin - User Management', description: 'User administration and management (placeholder)' },
        { name: 'Admin - System', description: 'System statistics and configuration (placeholder)' },
        { name: 'Admin - Audit', description: 'Audit logs and system monitoring (placeholder)' },
        { name: 'Admin - Feature Flags', description: 'Feature flag management (placeholder)' },
        
        { name: 'Analytics - Events', description: 'Event tracking and analytics (placeholder)' },
        { name: 'Analytics - Metrics', description: 'User and system metrics (placeholder)' },
        { name: 'Analytics - Dashboard', description: 'Analytics dashboard and widgets (placeholder)' },
        { name: 'Analytics - Reports', description: 'Analytics reports and automation (placeholder)' },
        
        { name: 'Device Management', description: 'Device tracking and management (placeholder)' },
        { name: 'Device Security', description: 'Device security and fingerprinting (placeholder)' },
        
        { name: 'API Keys', description: 'API key management and configuration (placeholder)' },
        { name: 'API Keys - Analytics', description: 'API key usage analytics (placeholder)' },
        { name: 'API Keys - Permissions', description: 'API key permissions management (placeholder)' },
        
        { name: 'Notifications', description: 'User notification management (placeholder)' },
        { name: 'Notification Preferences', description: 'Notification preferences and settings (placeholder)' },
        { name: 'Notification Settings', description: 'Global notification settings (placeholder)' },
        { name: 'Notification Templates', description: 'Notification template management (placeholder)' },
        { name: 'Notification Management', description: 'Notification sending and management (placeholder)' },
        
        { name: 'Email Templates', description: 'Email template management (placeholder)' },
        { name: 'Email Campaigns', description: 'Email campaign management (placeholder)' },
        { name: 'Email Lists', description: 'Email list and subscriber management (placeholder)' },
        { name: 'Email Analytics', description: 'Email campaign analytics (placeholder)' },
        { name: 'Email Configuration', description: 'Email service configuration (placeholder)' }
      ],
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'JWT token in the format: Bearer {token}'
        }
      },
      definitions: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/definitions/User' },
            access_token: { type: 'string' },
            refresh_token: { type: 'string' },
            expires_in: { type: 'number' }
          }
        },
        Session: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            device_info: { type: 'string' },
            ip_address: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            last_accessed: { type: 'string', format: 'date-time' },
            is_active: { type: 'boolean' }
          }
        },
        TokenInfo: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            decoded: { type: 'object' },
            expires_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            statusCode: { type: 'number' },
            message: { type: 'string' }
          }
        },
        HealthCheck: {
          type: 'object',
          properties: {
            service: { type: 'string' },
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_uid: { type: 'string', nullable: true },
            action: { type: 'string' },
            resource: { type: 'string', nullable: true },
            resource_id: { type: 'string', nullable: true },
            details: { type: 'object', nullable: true },
            ip_address: { type: 'string', nullable: true },
            user_agent: { type: 'string', nullable: true },
            success: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        SystemConfig: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            key: { type: 'string' },
            value: { type: 'object' },
            description: { type: 'string', nullable: true },
            is_public: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        FeatureFlag: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            is_enabled: { type: 'boolean' },
            rollout_percentage: { type: 'integer', minimum: 0, maximum: 100 },
            conditions: { type: 'object' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        AdminStats: {
          type: 'object',
          properties: {
            total_users: { type: 'integer' },
            active_users: { type: 'integer' },
            banned_users: { type: 'integer' },
            verified_users: { type: 'integer' },
            mfa_enabled_users: { type: 'integer' },
            total_sessions: { type: 'integer' },
            recent_registrations: { type: 'integer' },
            recent_logins: { type: 'integer' }
          }
        },
        AnalyticsEvent: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_uid: { type: 'string', nullable: true },
            event_name: { type: 'string' },
            properties: { type: 'object' },
            session_id: { type: 'string', nullable: true },
            timestamp: { type: 'string', format: 'date-time' },
            ip_address: { type: 'string', nullable: true },
            user_agent: { type: 'string', nullable: true }
          }
        },
        UserDevice: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_uid: { type: 'string' },
            device_id: { type: 'string' },
            device_name: { type: 'string', nullable: true },
            device_type: { type: 'string', enum: ['mobile', 'desktop', 'tablet', 'other'] },
            operating_system: { type: 'string', nullable: true },
            browser: { type: 'string', nullable: true },
            ip_address: { type: 'string', nullable: true },
            location: { type: 'string', nullable: true },
            is_trusted: { type: 'boolean' },
            is_active: { type: 'boolean' },
            last_used: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        ApiKey: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_uid: { type: 'string' },
            name: { type: 'string' },
            key_prefix: { type: 'string' },
            key_hash: { type: 'string' },
            permissions: { type: 'array', items: { type: 'string' } },
            scopes: { type: 'array', items: { type: 'string' } },
            rate_limit: { type: 'integer', nullable: true },
            rate_limit_window: { type: 'integer', nullable: true },
            is_active: { type: 'boolean' },
            last_used: { type: 'string', format: 'date-time', nullable: true },
            expires_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_uid: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            type: { type: 'string', enum: ['info', 'warning', 'error', 'success', 'security'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            is_read: { type: 'boolean' },
            is_actionable: { type: 'boolean' },
            action_url: { type: 'string', nullable: true },
            action_text: { type: 'string', nullable: true },
            metadata: { type: 'object', nullable: true },
            expires_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            read_at: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        // ADMIN & AUDIT INTERFACES
        UserFeatureFlag: {
          type: 'object',
          required: ['id', 'user_uid', 'feature_flag_id', 'is_enabled', 'created_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            user_uid: { type: 'string', description: 'User unique identifier' },
            feature_flag_id: { type: 'integer', description: 'Feature flag ID' },
            is_enabled: { type: 'boolean', description: 'Whether feature is enabled for user' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' }
          }
        },
        
        // ANALYTICS INTERFACES
        UserMetrics: {
          type: 'object',
          required: ['user_uid', 'total_sessions', 'total_session_duration', 'last_active', 'total_events', 'page_views', 'feature_usage', 'calculated_at'],
          properties: {
            user_uid: { type: 'string', description: 'User unique identifier' },
            total_sessions: { type: 'integer', description: 'Total number of sessions' },
            total_session_duration: { type: 'integer', description: 'Total session duration in milliseconds' },
            last_active: { type: 'string', format: 'date-time', description: 'Last activity timestamp' },
            total_events: { type: 'integer', description: 'Total number of events tracked' },
            page_views: { type: 'integer', description: 'Total page views' },
            feature_usage: { type: 'object', description: 'Feature usage statistics' },
            calculated_at: { type: 'string', format: 'date-time', description: 'Metrics calculation timestamp' }
          }
        },
        SystemMetrics: {
          type: 'object',
          required: ['id', 'metric_name', 'metric_value', 'metric_type', 'tags', 'timestamp'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            metric_name: { type: 'string', description: 'Metric name' },
            metric_value: { type: 'number', description: 'Metric value' },
            metric_type: { type: 'string', enum: ['counter', 'gauge', 'histogram'], description: 'Type of metric' },
            tags: { type: 'object', description: 'Metric tags for categorization' },
            timestamp: { type: 'string', format: 'date-time', description: 'Metric timestamp' }
          }
        },
        DashboardWidget: {
          type: 'object',
          required: ['id', 'name', 'type', 'query', 'config', 'position', 'created_by', 'created_at', 'updated_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            name: { type: 'string', description: 'Widget display name' },
            type: { type: 'string', enum: ['chart', 'metric', 'table', 'counter'], description: 'Widget type' },
            query: { type: 'string', description: 'Data query for the widget' },
            config: { type: 'object', description: 'Widget configuration' },
            position: {
              type: 'object',
              required: ['x', 'y', 'w', 'h'],
              properties: {
                x: { type: 'integer', description: 'X position' },
                y: { type: 'integer', description: 'Y position' },
                w: { type: 'integer', description: 'Width' },
                h: { type: 'integer', description: 'Height' }
              }
            },
            created_by: { type: 'string', description: 'Creator user ID' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        AnalyticsReport: {
          type: 'object',
          required: ['id', 'name', 'query', 'recipients', 'format', 'created_by', 'created_at', 'updated_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            name: { type: 'string', description: 'Report name' },
            description: { type: 'string', nullable: true, description: 'Report description' },
            query: { type: 'string', description: 'Data query for the report' },
            schedule: { type: 'string', nullable: true, description: 'Cron schedule for automated reports' },
            recipients: { type: 'array', items: { type: 'string', format: 'email' }, description: 'Report recipients' },
            format: { type: 'string', enum: ['json', 'csv', 'pdf'], description: 'Report format' },
            last_run: { type: 'string', format: 'date-time', nullable: true, description: 'Last execution timestamp' },
            created_by: { type: 'string', description: 'Creator user ID' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        
        // DEVICE MANAGEMENT INTERFACES
        DeviceSession: {
          type: 'object',
          required: ['id', 'device_id', 'session_id', 'started_at', 'is_active'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            device_id: { type: 'integer', description: 'Device ID' },
            session_id: { type: 'string', description: 'Session identifier' },
            started_at: { type: 'string', format: 'date-time', description: 'Session start time' },
            ended_at: { type: 'string', format: 'date-time', nullable: true, description: 'Session end time' },
            is_active: { type: 'boolean', description: 'Whether session is active' }
          }
        },
        DeviceSecurityEvent: {
          type: 'object',
          required: ['id', 'device_id', 'event_type', 'description', 'severity', 'created_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            device_id: { type: 'integer', description: 'Device ID' },
            event_type: { type: 'string', enum: ['login_attempt', 'suspicious_activity', 'location_change', 'new_device'], description: 'Event type' },
            description: { type: 'string', description: 'Event description' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Event severity' },
            ip_address: { type: 'string', nullable: true, description: 'IP address' },
            location: { type: 'string', nullable: true, description: 'Geographic location' },
            user_agent: { type: 'string', nullable: true, description: 'User agent string' },
            created_at: { type: 'string', format: 'date-time', description: 'Event timestamp' }
          }
        },
        DeviceFingerprint: {
          type: 'object',
          required: ['id', 'device_id', 'fingerprint_hash', 'created_at', 'updated_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            device_id: { type: 'integer', description: 'Device ID' },
            fingerprint_hash: { type: 'string', description: 'Device fingerprint hash' },
            screen_resolution: { type: 'string', nullable: true, description: 'Screen resolution' },
            timezone: { type: 'string', nullable: true, description: 'Device timezone' },
            language: { type: 'string', nullable: true, description: 'Device language' },
            platform: { type: 'string', nullable: true, description: 'Device platform' },
            webgl_vendor: { type: 'string', nullable: true, description: 'WebGL vendor' },
            webgl_renderer: { type: 'string', nullable: true, description: 'WebGL renderer' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        TrustedDevice: {
          type: 'object',
          required: ['id', 'user_uid', 'device_id', 'trusted_at', 'trusted_by', 'is_active'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            user_uid: { type: 'string', description: 'User unique identifier' },
            device_id: { type: 'integer', description: 'Device ID' },
            trusted_at: { type: 'string', format: 'date-time', description: 'Trust establishment timestamp' },
            trusted_by: { type: 'string', description: 'User who trusted the device' },
            expires_at: { type: 'string', format: 'date-time', nullable: true, description: 'Trust expiration timestamp' },
            is_active: { type: 'boolean', description: 'Whether trust is active' }
          }
        },
        
        // API KEY MANAGEMENT INTERFACES
        ApiKeyUsage: {
          type: 'object',
          required: ['id', 'api_key_id', 'endpoint', 'method', 'response_status', 'duration_ms', 'created_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            api_key_id: { type: 'integer', description: 'API key ID' },
            endpoint: { type: 'string', description: 'API endpoint accessed' },
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], description: 'HTTP method' },
            ip_address: { type: 'string', nullable: true, description: 'Client IP address' },
            user_agent: { type: 'string', nullable: true, description: 'Client user agent' },
            response_status: { type: 'integer', description: 'HTTP response status code' },
            request_size: { type: 'integer', nullable: true, description: 'Request size in bytes' },
            response_size: { type: 'integer', nullable: true, description: 'Response size in bytes' },
            duration_ms: { type: 'integer', description: 'Request duration in milliseconds' },
            created_at: { type: 'string', format: 'date-time', description: 'Usage timestamp' }
          }
        },
        ApiKeyQuota: {
          type: 'object',
          required: ['id', 'api_key_id', 'quota_type', 'limit_value', 'used_value', 'reset_period', 'reset_at', 'created_at', 'updated_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            api_key_id: { type: 'integer', description: 'API key ID' },
            quota_type: { type: 'string', enum: ['requests', 'bandwidth', 'storage'], description: 'Type of quota' },
            limit_value: { type: 'integer', description: 'Quota limit' },
            used_value: { type: 'integer', description: 'Current usage' },
            reset_period: { type: 'string', enum: ['hourly', 'daily', 'weekly', 'monthly'], description: 'Reset frequency' },
            reset_at: { type: 'string', format: 'date-time', description: 'Next reset timestamp' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        ApiKeyPermission: {
          type: 'object',
          required: ['id', 'name', 'description', 'resource', 'actions', 'created_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            name: { type: 'string', description: 'Permission name' },
            description: { type: 'string', description: 'Permission description' },
            resource: { type: 'string', description: 'Resource being controlled' },
            actions: { type: 'array', items: { type: 'string' }, description: 'Allowed actions' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' }
          }
        },
        ApiKeyRateLimit: {
          type: 'object',
          required: ['id', 'api_key_id', 'requests_count', 'window_start', 'window_end', 'is_exceeded', 'created_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            api_key_id: { type: 'integer', description: 'API key ID' },
            requests_count: { type: 'integer', description: 'Number of requests in window' },
            window_start: { type: 'string', format: 'date-time', description: 'Rate limit window start' },
            window_end: { type: 'string', format: 'date-time', description: 'Rate limit window end' },
            is_exceeded: { type: 'boolean', description: 'Whether rate limit was exceeded' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' }
          }
        },
        ApiKeyActivity: {
          type: 'object',
          required: ['id', 'api_key_id', 'activity_type', 'description', 'created_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            api_key_id: { type: 'integer', description: 'API key ID' },
            activity_type: { type: 'string', enum: ['created', 'updated', 'used', 'rate_limited', 'suspended', 'deleted'], description: 'Activity type' },
            description: { type: 'string', description: 'Activity description' },
            metadata: { type: 'object', nullable: true, description: 'Additional activity data' },
            created_at: { type: 'string', format: 'date-time', description: 'Activity timestamp' }
          }
        },
        
        // NOTIFICATION SYSTEM INTERFACES
        NotificationPreference: {
          type: 'object',
          required: ['id', 'user_uid', 'notification_type', 'email_enabled', 'push_enabled', 'sms_enabled', 'in_app_enabled', 'frequency', 'created_at', 'updated_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            user_uid: { type: 'string', description: 'User unique identifier' },
            notification_type: { type: 'string', description: 'Type of notification' },
            email_enabled: { type: 'boolean', description: 'Email notifications enabled' },
            push_enabled: { type: 'boolean', description: 'Push notifications enabled' },
            sms_enabled: { type: 'boolean', description: 'SMS notifications enabled' },
            in_app_enabled: { type: 'boolean', description: 'In-app notifications enabled' },
            frequency: { type: 'string', enum: ['immediate', 'daily', 'weekly', 'disabled'], description: 'Notification frequency' },
            quiet_hours_start: { type: 'string', nullable: true, description: 'Quiet hours start time (HH:MM)' },
            quiet_hours_end: { type: 'string', nullable: true, description: 'Quiet hours end time (HH:MM)' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        NotificationTemplate: {
          type: 'object',
          required: ['id', 'name', 'type', 'body_template', 'variables', 'is_active', 'created_by', 'created_at', 'updated_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            name: { type: 'string', description: 'Template name' },
            description: { type: 'string', nullable: true, description: 'Template description' },
            type: { type: 'string', enum: ['email', 'push', 'sms', 'in_app'], description: 'Notification type' },
            subject_template: { type: 'string', nullable: true, description: 'Subject template (for email)' },
            body_template: { type: 'string', description: 'Body template' },
            variables: { type: 'array', items: { type: 'string' }, description: 'Template variables' },
            is_active: { type: 'boolean', description: 'Whether template is active' },
            created_by: { type: 'string', description: 'Creator user ID' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        NotificationDelivery: {
          type: 'object',
          required: ['id', 'notification_id', 'delivery_method', 'status', 'recipient', 'created_at', 'updated_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            notification_id: { type: 'integer', description: 'Notification ID' },
            delivery_method: { type: 'string', enum: ['email', 'push', 'sms', 'in_app'], description: 'Delivery method' },
            status: { type: 'string', enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'], description: 'Delivery status' },
            recipient: { type: 'string', description: 'Recipient identifier' },
            external_id: { type: 'string', nullable: true, description: 'External service ID' },
            error_message: { type: 'string', nullable: true, description: 'Error message if failed' },
            delivered_at: { type: 'string', format: 'date-time', nullable: true, description: 'Delivery timestamp' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        NotificationQueue: {
          type: 'object',
          required: ['id', 'notification_id', 'scheduled_at', 'status', 'attempts', 'max_attempts', 'created_at', 'updated_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            notification_id: { type: 'integer', description: 'Notification ID' },
            scheduled_at: { type: 'string', format: 'date-time', description: 'Scheduled delivery time' },
            status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'], description: 'Queue status' },
            attempts: { type: 'integer', description: 'Number of delivery attempts' },
            max_attempts: { type: 'integer', description: 'Maximum allowed attempts' },
            error_message: { type: 'string', nullable: true, description: 'Error message if failed' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        NotificationSettings: {
          type: 'object',
          required: ['id', 'user_uid', 'global_email_enabled', 'global_push_enabled', 'global_sms_enabled', 'timezone', 'language', 'digest_frequency', 'created_at', 'updated_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            user_uid: { type: 'string', description: 'User unique identifier' },
            global_email_enabled: { type: 'boolean', description: 'Global email notifications enabled' },
            global_push_enabled: { type: 'boolean', description: 'Global push notifications enabled' },
            global_sms_enabled: { type: 'boolean', description: 'Global SMS notifications enabled' },
            timezone: { type: 'string', description: 'User timezone' },
            language: { type: 'string', description: 'User language preference' },
            digest_frequency: { type: 'string', enum: ['never', 'daily', 'weekly'], description: 'Digest email frequency' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        
        // EMAIL MANAGEMENT INTERFACES
        EmailTemplate: {
          type: 'object',
          required: ['id', 'name', 'subject', 'html_content', 'variables', 'is_active', 'created_by', 'created_at', 'updated_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            name: { type: 'string', description: 'Template name' },
            description: { type: 'string', nullable: true, description: 'Template description' },
            subject: { type: 'string', description: 'Email subject template' },
            html_content: { type: 'string', description: 'HTML email content' },
            text_content: { type: 'string', nullable: true, description: 'Plain text email content' },
            variables: { type: 'array', items: { type: 'string' }, description: 'Template variables' },
            category: { type: 'string', nullable: true, description: 'Template category' },
            is_active: { type: 'boolean', description: 'Whether template is active' },
            created_by: { type: 'string', description: 'Creator user ID' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        EmailCampaign: {
          type: 'object',
          required: ['id', 'name', 'template_id', 'subject', 'sender_name', 'sender_email', 'status', 'recipient_count', 'delivered_count', 'opened_count', 'clicked_count', 'bounced_count', 'unsubscribed_count', 'created_by', 'created_at', 'updated_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            name: { type: 'string', description: 'Campaign name' },
            description: { type: 'string', nullable: true, description: 'Campaign description' },
            template_id: { type: 'integer', description: 'Email template ID' },
            subject: { type: 'string', description: 'Email subject' },
            sender_name: { type: 'string', description: 'Sender display name' },
            sender_email: { type: 'string', format: 'email', description: 'Sender email address' },
            status: { type: 'string', enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'], description: 'Campaign status' },
            scheduled_at: { type: 'string', format: 'date-time', nullable: true, description: 'Scheduled send time' },
            sent_at: { type: 'string', format: 'date-time', nullable: true, description: 'Actual send time' },
            recipient_count: { type: 'integer', description: 'Total recipients' },
            delivered_count: { type: 'integer', description: 'Successfully delivered emails' },
            opened_count: { type: 'integer', description: 'Email opens' },
            clicked_count: { type: 'integer', description: 'Link clicks' },
            bounced_count: { type: 'integer', description: 'Bounced emails' },
            unsubscribed_count: { type: 'integer', description: 'Unsubscriptions' },
            created_by: { type: 'string', description: 'Creator user ID' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        EmailRecipient: {
          type: 'object',
          required: ['id', 'campaign_id', 'email', 'status', 'created_at', 'updated_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            campaign_id: { type: 'integer', description: 'Email campaign ID' },
            email: { type: 'string', format: 'email', description: 'Recipient email address' },
            user_uid: { type: 'string', nullable: true, description: 'User unique identifier' },
            variables: { type: 'object', nullable: true, description: 'Template variables for personalization' },
            status: { type: 'string', enum: ['pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed'], description: 'Recipient status' },
            sent_at: { type: 'string', format: 'date-time', nullable: true, description: 'Email sent timestamp' },
            delivered_at: { type: 'string', format: 'date-time', nullable: true, description: 'Email delivered timestamp' },
            opened_at: { type: 'string', format: 'date-time', nullable: true, description: 'Email opened timestamp' },
            clicked_at: { type: 'string', format: 'date-time', nullable: true, description: 'Link clicked timestamp' },
            bounced_at: { type: 'string', format: 'date-time', nullable: true, description: 'Email bounced timestamp' },
            unsubscribed_at: { type: 'string', format: 'date-time', nullable: true, description: 'Unsubscribed timestamp' },
            error_message: { type: 'string', nullable: true, description: 'Error message if delivery failed' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        EmailDelivery: {
          type: 'object',
          required: ['id', 'recipient_id', 'provider', 'status', 'created_at', 'updated_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            recipient_id: { type: 'integer', description: 'Email recipient ID' },
            external_id: { type: 'string', nullable: true, description: 'External service delivery ID' },
            provider: { type: 'string', description: 'Email service provider' },
            status: { type: 'string', enum: ['queued', 'sent', 'delivered', 'failed', 'bounced'], description: 'Delivery status' },
            error_code: { type: 'string', nullable: true, description: 'Error code if failed' },
            error_message: { type: 'string', nullable: true, description: 'Error message if failed' },
            delivered_at: { type: 'string', format: 'date-time', nullable: true, description: 'Delivery timestamp' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        EmailActivity: {
          type: 'object',
          required: ['id', 'recipient_id', 'activity_type', 'created_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            recipient_id: { type: 'integer', description: 'Email recipient ID' },
            activity_type: { type: 'string', enum: ['open', 'click', 'bounce', 'unsubscribe', 'spam_report'], description: 'Activity type' },
            url: { type: 'string', nullable: true, description: 'URL for click activities' },
            user_agent: { type: 'string', nullable: true, description: 'User agent string' },
            ip_address: { type: 'string', nullable: true, description: 'IP address' },
            created_at: { type: 'string', format: 'date-time', description: 'Activity timestamp' }
          }
        },
        EmailList: {
          type: 'object',
          required: ['id', 'name', 'subscriber_count', 'is_active', 'created_by', 'created_at', 'updated_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            name: { type: 'string', description: 'List name' },
            description: { type: 'string', nullable: true, description: 'List description' },
            subscriber_count: { type: 'integer', description: 'Number of subscribers' },
            is_active: { type: 'boolean', description: 'Whether list is active' },
            created_by: { type: 'string', description: 'Creator user ID' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        EmailSubscriber: {
          type: 'object',
          required: ['id', 'list_id', 'email', 'status', 'subscribed_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            list_id: { type: 'integer', description: 'Email list ID' },
            email: { type: 'string', format: 'email', description: 'Subscriber email address' },
            user_uid: { type: 'string', nullable: true, description: 'User unique identifier' },
            status: { type: 'string', enum: ['subscribed', 'unsubscribed', 'bounced'], description: 'Subscription status' },
            subscribed_at: { type: 'string', format: 'date-time', description: 'Subscription timestamp' },
            unsubscribed_at: { type: 'string', format: 'date-time', nullable: true, description: 'Unsubscription timestamp' },
            metadata: { type: 'object', nullable: true, description: 'Additional subscriber data' }
          }
        },
        EmailConfiguration: {
          type: 'object',
          required: ['id', 'provider', 'api_key', 'sender_domain', 'default_sender_name', 'default_sender_email', 'is_active', 'created_at', 'updated_at'],
          properties: {
            id: { type: 'integer', description: 'Unique identifier' },
            provider: { type: 'string', description: 'Email service provider name' },
            api_key: { type: 'string', description: 'Provider API key' },
            sender_domain: { type: 'string', description: 'Verified sender domain' },
            default_sender_name: { type: 'string', description: 'Default sender name' },
            default_sender_email: { type: 'string', format: 'email', description: 'Default sender email' },
            webhook_url: { type: 'string', nullable: true, description: 'Webhook URL for delivery events' },
            is_active: { type: 'boolean', description: 'Whether configuration is active' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        }
      }
    }
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject) => {
      return swaggerObject;
    },
    transformSpecificationClone: true
  });
};
