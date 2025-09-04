import { NODE_ENV } from '../config/environment';

interface SecurityEvent {
  type: 'auth' | 'error' | 'security' | 'audit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
}

// List of sensitive fields that should never be logged
const SENSITIVE_FIELDS = [
  'password',
  'password_hash',
  'refresh_token',
  'session_token',
  'access_token',
  'jwt',
  'secret',
  'key',
  'token',
  'email_verification_token',
  'reset_token'
];

// Recursively sanitize objects to remove sensitive data
function sanitizeForLogging(obj: any, depth = 0): any {
  if (depth > 5) return '[Max depth reached]'; // Prevent infinite recursion
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Check if string looks like a token/secret
    if (obj.length > 20 && (obj.includes('.') || obj.match(/^[A-Za-z0-9+/=]+$/))) {
      return '[REDACTED_TOKEN]';
    }
    return obj;
  }
  
  if (typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLogging(item, depth + 1));
  }
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Check if field name indicates sensitive data
    const isSensitive = SENSITIVE_FIELDS.some(field => 
      lowerKey.includes(field) || lowerKey.includes('auth')
    );
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeForLogging(value, depth + 1);
    }
  }
  
  return sanitized;
}

export class SecureLogger {
  private static instance: SecureLogger;
  
  private constructor() {}
  
  static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }
  
  // Log security events (always logged, even in production)
  security(event: SecurityEvent): void {
    const timestamp = new Date().toISOString();
    const sanitizedDetails = event.details ? sanitizeForLogging(event.details) : null;
    
    const logEntry = {
      timestamp,
      type: event.type,
      severity: event.severity,
      message: event.message,
      userId: event.userId || '[anonymous]',
      ip: event.ip || '[unknown]',
      userAgent: event.userAgent ? event.userAgent.substring(0, 100) : '[unknown]',
      ...(sanitizedDetails && { details: sanitizedDetails })
    };
    
    // In production, this should go to a security monitoring system
    console.error(`[SECURITY] ${JSON.stringify(logEntry)}`);
    
    // Critical events should trigger alerts
    if (event.severity === 'critical') {
      this.alertCriticalEvent(logEntry);
    }
  }
  
  // Log authentication events
  auth(message: string, userId?: string, ip?: string, success = false): void {
    this.security({
      type: 'auth',
      severity: success ? 'low' : 'medium',
      message,
      userId,
      ip
    });
  }
  
  // Log general errors (sanitized)
  error(message: string, error?: Error | any, context?: any): void {
    const timestamp = new Date().toISOString();
    
    let errorInfo: any = {};
    if (error instanceof Error) {
      errorInfo = {
        name: error.name,
        message: error.message,
        // Only include stack trace in development
        ...(NODE_ENV === 'development' && { stack: error.stack })
      };
    } else if (error) {
      errorInfo = sanitizeForLogging(error);
    }
    
    const logEntry = {
      timestamp,
      level: 'error',
      message,
      ...(Object.keys(errorInfo).length > 0 && { error: errorInfo }),
      ...(context && { context: sanitizeForLogging(context) })
    };
    
    console.error(`[ERROR] ${JSON.stringify(logEntry)}`);
  }
  
  // Log info messages (development only)
  info(message: string, context?: any): void {
    if (NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level: 'info',
        message,
        ...(context && { context: sanitizeForLogging(context) })
      };
      console.log(`[INFO] ${JSON.stringify(logEntry)}`);
    }
  }
  
  // Debug messages (development only)
  debug(message: string, context?: any): void {
    if (NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.log(`[DEBUG] ${timestamp} ${message}`, context ? sanitizeForLogging(context) : '');
    }
  }
  
  private alertCriticalEvent(event: any): void {
    // In production, this would integrate with monitoring systems
    // like DataDog, New Relic, Slack, PagerDuty, etc.
    console.error(`[CRITICAL ALERT] ${JSON.stringify(event)}`);
  }
}

// Export singleton instance
export const secureLogger = SecureLogger.getInstance();

// Helper functions for common use cases
export const logSecurityEvent = (event: SecurityEvent) => secureLogger.security(event);
export const logAuthEvent = (message: string, userId?: string, ip?: string, success = false) => 
  secureLogger.auth(message, userId, ip, success);
export const logError = (message: string, error?: Error | any, context?: any) => 
  secureLogger.error(message, error, context);
export const logInfo = (message: string, context?: any) => secureLogger.info(message, context);
export const logDebug = (message: string, context?: any) => secureLogger.debug(message, context);
