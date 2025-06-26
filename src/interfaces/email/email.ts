export interface EmailTemplate {
  id: number;
  name: string;
  description: string | null;
  subject: string;
  html_content: string;
  text_content: string | null;
  variables: string[];
  category: string | null;
  is_active: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface EmailCampaign {
  id: number;
  name: string;
  description: string | null;
  template_id: number;
  subject: string;
  sender_name: string;
  sender_email: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  scheduled_at: Date | null;
  sent_at: Date | null;
  recipient_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface EmailRecipient {
  id: number;
  campaign_id: number;
  email: string;
  user_uid: string | null;
  variables: Record<string, any> | null;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  sent_at: Date | null;
  delivered_at: Date | null;
  opened_at: Date | null;
  clicked_at: Date | null;
  bounced_at: Date | null;
  unsubscribed_at: Date | null;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface EmailDelivery {
  id: number;
  recipient_id: number;
  external_id: string | null;
  provider: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced';
  error_code: string | null;
  error_message: string | null;
  delivered_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface EmailActivity {
  id: number;
  recipient_id: number;
  activity_type: 'open' | 'click' | 'bounce' | 'unsubscribe' | 'spam_report';
  url: string | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: Date;
}

export interface EmailList {
  id: number;
  name: string;
  description: string | null;
  subscriber_count: number;
  is_active: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface EmailSubscriber {
  id: number;
  list_id: number;
  email: string;
  user_uid: string | null;
  status: 'subscribed' | 'unsubscribed' | 'bounced';
  subscribed_at: Date;
  unsubscribed_at: Date | null;
  metadata: Record<string, any> | null;
}

export interface EmailConfiguration {
  id: number;
  provider: string;
  api_key: string;
  sender_domain: string;
  default_sender_name: string;
  default_sender_email: string;
  webhook_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
