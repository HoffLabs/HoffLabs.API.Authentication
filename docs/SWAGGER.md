# Swagger API Documentation

This document explains how to use the Swagger documentation for the Hofflabs Private Authentication API.

## Accessing Swagger UI

Once the server is running, you can access the interactive Swagger documentation at:

```
http://localhost:3030/docs
```

## Features

### Interactive Documentation
- **Try it out**: Test endpoints directly from the browser
- **Request/Response Examples**: See sample requests and responses
- **Schema Validation**: Understand required fields and data types
- **Authentication**: Test protected endpoints with JWT tokens

### API Endpoints Coverage

The Swagger documentation covers all available endpoints:

#### Authentication (`/auth`)
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh access token
- `POST /auth/validate` - Validate refresh token

#### Profile Management (`/auth`)
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile
- `PATCH /auth/profile/password` - Change password
- `DELETE /auth/profile` - Delete account

#### Session Management (`/auth`)
- `GET /auth/sessions` - Get active sessions
- `DELETE /auth/sessions/:id` - Revoke specific session
- `DELETE /auth/sessions/all` - Revoke all other sessions
- `GET /auth/login-history` - Get login history

#### Password Reset (`/auth`)
- `POST /auth/forgot-password` - Request password reset
- `GET /auth/reset/:token` - Validate reset token
- `POST /auth/reset-password` - Reset password

#### JWT Utilities (`/jwt`)
- `POST /jwt/verify` - Verify JWT token
- `POST /jwt/decode` - Decode JWT token
- `POST /jwt/info` - Get token information

#### Health Checks
- `GET /auth/health` - Authentication service health
- `GET /jwt/health` - JWT service health

## Using Authentication

For protected endpoints, you need to provide a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### How to authenticate in Swagger UI:

1. First, use the `/auth/login` endpoint to get a JWT token
2. Copy the `access_token` from the response
3. Click the "Authorize" button at the top of the Swagger UI
4. Enter `Bearer <your-token>` in the value field
5. Click "Authorize"

Now you can test protected endpoints that require authentication.

## API Response Formats

### Success Responses
All successful responses follow a consistent format with appropriate HTTP status codes (200, 201, etc.).

### Error Responses
All error responses include:
```json
{
  "error": "Error description",
  "statusCode": 400,
  "message": "Detailed error message"
}
```

## Data Models

The documentation includes comprehensive data models for:
- **User** - User account information
- **Session** - User session data
- **LoginResponse** - Authentication response
- **TokenInfo** - JWT token details
- **Error** - Error response format

## Rate Limiting

The API includes rate limiting (100 requests per minute). This is documented in the general API information.

## Security

All endpoints use HTTPS in production and include proper security headers via Helmet middleware.

## Testing

You can use the Swagger UI to:
1. Understand the API structure
2. Test individual endpoints
3. Validate request/response formats
4. Generate example code for your applications

## JSON Schema Export

The Swagger documentation is also available as a JSON schema at:
```
http://localhost:3030/docs/json
```

This can be imported into other tools like Postman, Insomnia, or used for code generation.
