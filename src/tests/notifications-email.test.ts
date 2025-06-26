import { describe, it, expect, beforeAll } from 'bun:test';
import { 
  Notification, 
  NotificationPreference, 
  NotificationTemplate, 
  NotificationDelivery, 
  NotificationQueue, 
  NotificationSettings 
} from '../interfaces/notifications/notifications';
import { 
  EmailTemplate, 
  EmailCampaign, 
  EmailRecipient, 
  EmailDelivery, 
  EmailActivity, 
  EmailList, 
  EmailSubscriber, 
  EmailConfiguration 
} from '../interfaces/email/email';
import runDbSync from '../database/utils/sync';

describe('Notification and Email System Tests', () => {
  beforeAll(async () => {
    await runDbSync();
  });

  describe('Notification Interface', () => {
    it('should create valid notifications', () => {
      const notification: Notification = {
        id: 1,
        user_uid: 'user-123',
        title: 'Welcome to Our Platform',
        message: 'Thank you for joining us!',
        type: 'info',
        priority: 'medium',
        is_read: false,
        is_actionable: true,
        action_url: '/welcome',
        action_text: 'Get Started',
        metadata: { campaign: 'onboarding' },
        expires_at: null,
        created_at: new Date(),
        read_at: null
      };

      expect(notification.type).toBe('info');
      expect(notification.is_actionable).toBe(true);
      expect(notification.is_read).toBe(false);
    });

    it('should handle different notification types', () => {
      const types = ['info', 'warning', 'error', 'success', 'security'];
      const priorities = ['low', 'medium', 'high', 'urgent'];

      types.forEach(type => {
        priorities.forEach(priority => {
          const notification: Notification = {
            id: 1,
            user_uid: 'user-123',
            title: `${type} notification`,
            message: `This is a ${priority} priority ${type} message`,
            type: type as any,
            priority: priority as any,
            is_read: false,
            is_actionable: false,
            action_url: null,
            action_text: null,
            metadata: null,
            expires_at: null,
            created_at: new Date(),
            read_at: null
          };

          expect(types).toContain(notification.type);
          expect(priorities).toContain(notification.priority);
        });
      });
    });

    it('should handle read notifications', () => {
      const notification: Notification = {
        id: 2,
        user_uid: 'user-456',
        title: 'System Maintenance',
        message: 'Scheduled maintenance completed',
        type: 'success',
        priority: 'low',
        is_read: true,
        is_actionable: false,
        action_url: null,
        action_text: null,
        metadata: null,
        expires_at: null,
        created_at: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        read_at: new Date()
      };

      expect(notification.is_read).toBe(true);
      expect(notification.read_at).not.toBeNull();
    });
  });

  describe('NotificationPreference Interface', () => {
    it('should set user notification preferences', () => {
      const preference: NotificationPreference = {
        id: 1,
        user_uid: 'user-123',
        notification_type: 'security_alerts',
        email_enabled: true,
        push_enabled: true,
        sms_enabled: false,
        in_app_enabled: true,
        frequency: 'immediate',
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(preference.frequency).toBe('immediate');
      expect(preference.email_enabled).toBe(true);
      expect(preference.sms_enabled).toBe(false);
    });

    it('should handle different frequency settings', () => {
      const frequencies = ['immediate', 'daily', 'weekly', 'disabled'];

      frequencies.forEach(frequency => {
        const preference: NotificationPreference = {
          id: 1,
          user_uid: 'user-123',
          notification_type: 'updates',
          email_enabled: true,
          push_enabled: false,
          sms_enabled: false,
          in_app_enabled: true,
          frequency: frequency as any,
          quiet_hours_start: null,
          quiet_hours_end: null,
          created_at: new Date(),
          updated_at: new Date()
        };

        expect(frequencies).toContain(preference.frequency);
      });
    });
  });

  describe('Email System', () => {
    describe('EmailTemplate Interface', () => {
      it('should create email templates', () => {
        const template: EmailTemplate = {
          id: 1,
          name: 'Welcome Email',
          description: 'Welcome email for new users',
          subject: 'Welcome to {{app_name}}!',
          html_content: '<h1>Welcome {{user_name}}!</h1><p>Thanks for joining us.</p>',
          text_content: 'Welcome {{user_name}}! Thanks for joining us.',
          variables: ['app_name', 'user_name'],
          category: 'onboarding',
          is_active: true,
          created_by: 'admin-user',
          created_at: new Date(),
          updated_at: new Date()
        };

        expect(template.variables).toContain('user_name');
        expect(template.is_active).toBe(true);
        expect(template.subject.includes('{{app_name}}')).toBe(true);
      });

      it('should handle template variables', () => {
        const template: EmailTemplate = {
          id: 2,
          name: 'Password Reset',
          description: null,
          subject: 'Reset your password',
          html_content: '<p>Click <a href="{{reset_link}}">here</a> to reset your password.</p>',
          text_content: 'Click this link to reset your password: {{reset_link}}',
          variables: ['reset_link', 'user_email'],
          category: 'security',
          is_active: true,
          created_by: 'system',
          created_at: new Date(),
          updated_at: new Date()
        };

        expect(template.variables).toContain('reset_link');
        expect(template.category).toBe('security');
      });
    });

    describe('EmailCampaign Interface', () => {
      it('should create email campaigns', () => {
        const campaign: EmailCampaign = {
          id: 1,
          name: 'Monthly Newsletter',
          description: 'Monthly product updates and news',
          template_id: 1,
          subject: 'Your Monthly Update',
          sender_name: 'Team Updates',
          sender_email: 'updates@company.com',
          status: 'draft',
          scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          sent_at: null,
          recipient_count: 0,
          delivered_count: 0,
          opened_count: 0,
          clicked_count: 0,
          bounced_count: 0,
          unsubscribed_count: 0,
          created_by: 'marketing-user',
          created_at: new Date(),
          updated_at: new Date()
        };

        expect(campaign.status).toBe('draft');
        expect(campaign.scheduled_at!.getTime()).toBeGreaterThan(new Date().getTime());
        expect(campaign.sent_at).toBeNull();
      });

      it('should track campaign metrics', () => {
        const campaign: EmailCampaign = {
          id: 2,
          name: 'Product Launch',
          description: 'Announcing our new product',
          template_id: 2,
          subject: 'Introducing Our New Product!',
          sender_name: 'Product Team',
          sender_email: 'product@company.com',
          status: 'sent',
          scheduled_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          recipient_count: 1000,
          delivered_count: 980,
          opened_count: 450,
          clicked_count: 120,
          bounced_count: 20,
          unsubscribed_count: 5,
          created_by: 'product-manager',
          created_at: new Date(),
          updated_at: new Date()
        };

        expect(campaign.status).toBe('sent');
        expect(campaign.delivered_count).toBeLessThanOrEqual(campaign.recipient_count);
        expect(campaign.opened_count).toBeLessThanOrEqual(campaign.delivered_count);
      });
    });

    describe('EmailRecipient Interface', () => {
      it('should track individual recipient status', () => {
        const recipient: EmailRecipient = {
          id: 1,
          campaign_id: 1,
          email: 'user@example.com',
          user_uid: 'user-123',
          variables: { 
            user_name: 'John Doe',
            account_type: 'premium' 
          },
          status: 'delivered',
          sent_at: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          delivered_at: new Date(Date.now() - 55 * 60 * 1000), // 55 minutes ago
          opened_at: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          clicked_at: null,
          bounced_at: null,
          unsubscribed_at: null,
          error_message: null,
          created_at: new Date(),
          updated_at: new Date()
        };

        expect(recipient.status).toBe('delivered');
        expect(recipient.opened_at).not.toBeNull();
        expect(recipient.variables?.user_name).toBe('John Doe');
      });

      it('should handle different recipient statuses', () => {
        const statuses = ['pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed'];

        statuses.forEach(status => {
          const recipient: EmailRecipient = {
            id: 1,
            campaign_id: 1,
            email: 'test@example.com',
            user_uid: null,
            variables: null,
            status: status as any,
            sent_at: null,
            delivered_at: null,
            opened_at: null,
            clicked_at: null,
            bounced_at: null,
            unsubscribed_at: null,
            error_message: null,
            created_at: new Date(),
            updated_at: new Date()
          };

          expect(statuses).toContain(recipient.status);
        });
      });
    });

    describe('EmailActivity Interface', () => {
      it('should track email activities', () => {
        const activity: EmailActivity = {
          id: 1,
          recipient_id: 1,
          activity_type: 'click',
          url: 'https://company.com/product',
          user_agent: 'Mozilla/5.0...',
          ip_address: '192.168.1.1',
          created_at: new Date()
        };

        expect(activity.activity_type).toBe('click');
        expect(activity.url).toBe('https://company.com/product');
      });

      it('should validate activity types', () => {
        const activityTypes = ['open', 'click', 'bounce', 'unsubscribe', 'spam_report'];

        activityTypes.forEach(type => {
          const activity: EmailActivity = {
            id: 1,
            recipient_id: 1,
            activity_type: type as any,
            url: type === 'click' ? 'https://example.com' : null,
            user_agent: 'Test Agent',
            ip_address: '127.0.0.1',
            created_at: new Date()
          };

          expect(activityTypes).toContain(activity.activity_type);
        });
      });
    });
  });

  describe('Integration Tests', () => {
    it('should calculate email engagement metrics', () => {
      const campaign: EmailCampaign = {
        id: 1,
        name: 'Test Campaign',
        description: null,
        template_id: 1,
        subject: 'Test Email',
        sender_name: 'Test',
        sender_email: 'test@example.com',
        status: 'sent',
        scheduled_at: null,
        sent_at: new Date(),
        recipient_count: 1000,
        delivered_count: 950,
        opened_count: 380,
        clicked_count: 95,
        bounced_count: 50,
        unsubscribed_count: 10,
        created_by: 'test-user',
        created_at: new Date(),
        updated_at: new Date()
      };

      // Calculate engagement rates
      const deliveryRate = (campaign.delivered_count / campaign.recipient_count) * 100;
      const openRate = (campaign.opened_count / campaign.delivered_count) * 100;
      const clickRate = (campaign.clicked_count / campaign.delivered_count) * 100;
      const bounceRate = (campaign.bounced_count / campaign.recipient_count) * 100;

      expect(deliveryRate).toBe(95); // 95%
      expect(openRate).toBe(40); // 40%
      expect(clickRate).toBe(10); // 10%
      expect(bounceRate).toBe(5); // 5%
    });

    it('should validate notification delivery preferences', () => {
      const settings: NotificationSettings = {
        id: 1,
        user_uid: 'user-123',
        global_email_enabled: true,
        global_push_enabled: false,
        global_sms_enabled: false,
        timezone: 'America/Los_Angeles',
        language: 'en-US',
        digest_frequency: 'daily',
        created_at: new Date(),
        updated_at: new Date()
      };

      const preference: NotificationPreference = {
        id: 1,
        user_uid: 'user-123',
        notification_type: 'security',
        email_enabled: true,
        push_enabled: true, // Override global setting
        sms_enabled: false,
        in_app_enabled: true,
        frequency: 'immediate',
        quiet_hours_start: null,
        quiet_hours_end: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Should respect specific preference over global setting
      const shouldSendEmail = settings.global_email_enabled && preference.email_enabled;
      const shouldSendPush = preference.push_enabled; // Override global setting
      const shouldSendSMS = settings.global_sms_enabled && preference.sms_enabled;

      expect(shouldSendEmail).toBe(true);
      expect(shouldSendPush).toBe(true);
      expect(shouldSendSMS).toBe(false);
    });

    it('should handle notification queue processing', () => {
      const queueItem: NotificationQueue = {
        id: 1,
        notification_id: 1,
        scheduled_at: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        error_message: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Simulate processing
      const now = new Date();
      const shouldProcess = queueItem.scheduled_at <= now && 
                           queueItem.status === 'pending' && 
                           queueItem.attempts < queueItem.max_attempts;

      expect(shouldProcess).toBe(true);
    });
  });
});
