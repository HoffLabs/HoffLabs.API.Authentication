// Common schema definitions for Swagger documentation
export const ErrorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    statusCode: { type: 'number' },
    message: { type: 'string' }
  }
};

export const UserSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    username: { type: 'string' },
    email: { type: 'string', format: 'email' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' }
  }
};

export const LoginResponseSchema = {
  type: 'object',
  properties: {
    user: UserSchema,
    access_token: { type: 'string' },
    refresh_token: { type: 'string' },
    expires_in: { type: 'number' }
  }
};

export const SessionSchema = {
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
};

export const TokenInfoSchema = {
  type: 'object',
  properties: {
    valid: { type: 'boolean' },
    decoded: { type: 'object' },
    expires_at: { type: 'string', format: 'date-time' }
  }
};

export const HealthCheckSchema = {
  type: 'object',
  properties: {
    service: { type: 'string' },
    status: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' }
  }
};
