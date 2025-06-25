import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, BACKEND_API_URL, TEST_EMAIL_RECIPIENT } from '../../config/env';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface PasswordResetEmailData {
  email: string;
  resetToken: string;
  username: string;
}

export interface EmailVerificationData {
  email: string;
  verificationToken: string;
  username: string;
}

// Create transporter
const createTransporter = () => {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP configuration is incomplete. Please check your environment variables.');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    // Additional options for compatibility
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Test email configuration
export const testEmailConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true };
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Generic email sender
export const sendEmail = async (options: EmailOptions): Promise<{ success: boolean; error?: string }> => {
  try {
    // In test mode, mock email sending to avoid SMTP delays/timeouts
    if (process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true') {
      // Mock email sending in test mode
      console.log('Mock email sent in test mode to:', options.to);
      return { success: true };
    }
    
    const transporter = createTransporter();
    
    if(true) {
      const mailOptions = {
        from: `"Hofflabs API" <${SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return { success: true };
    }
  } catch (error) {
    console.error('Failed to send email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Password reset email template
export const generatePasswordResetEmail = (data: PasswordResetEmailData): EmailOptions => {
  const resetUrl = `${BACKEND_API_URL}/auth/reset-password?token=${data.resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #ffffff; padding: 30px; border: 1px solid #dee2e6; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .button:hover { background-color: #0056b3; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeeba; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .token { background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Hofflabs API</h1>
            <h2>Password Reset Request</h2>
        </div>
        <div class="content">
            <p>Hello ${data.username},</p>
            <p>We received a request to reset your password for your Hofflabs API account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Your Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class="token">${resetUrl}</div>
            
            <div class="warning">
                <strong>Important:</strong>
                <ul>
                    <li>This link will expire in 1 hour</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Your password won't be changed until you click the link above and set a new one</li>
                </ul>
            </div>
            
            <p>If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>
        </div>
        <div class="footer">
            <p>This email was sent from Hofflabs API. If you have questions, please contact our support team.</p>
            <p>&copy; ${new Date().getFullYear()} Hofflabs. All rights reserved.</p>
        </div>
    </body>
    </html>
  `;

  const text = `
    Hofflabs API - Password Reset Request
    
    Hello ${data.username},
    
    We received a request to reset your password for your Hofflabs API account.
    
    To reset your password, visit this link: ${resetUrl}
    
    Important:
    - This link will expire in 1 hour
    - If you didn't request this reset, please ignore this email
    - Your password won't be changed until you visit the link above and set a new one
    
    © ${new Date().getFullYear()} Hofflabs. All rights reserved.
  `;

  return {
    to: data.email,
    subject: 'Reset Your Password - Hofflabs API',
    html,
    text
  };
};

// Email verification template
export const generateEmailVerificationEmail = (data: EmailVerificationData): EmailOptions => {
  const verificationUrl = `${BACKEND_API_URL}/auth/verify-email?token=${data.verificationToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email Address</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #ffffff; padding: 30px; border: 1px solid #dee2e6; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .button:hover { background-color: #218838; }
            .info { background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .token { background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Hofflabs API</h1>
            <h2>Welcome! Please Verify Your Email</h2>
        </div>
        <div class="content">
            <p>Hello ${data.username},</p>
            <p>Thank you for creating your Hofflabs API account! To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Your Email</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class="token">${verificationUrl}</div>
            
            <div class="info">
                <strong>Why verify your email?</strong>
                <ul>
                    <li>Secure your account and enable password recovery</li>
                    <li>Receive important account notifications</li>
                    <li>Access all API features</li>
                </ul>
            </div>
            
            <p>If you didn't create this account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>This email was sent from Hofflabs API. If you have questions, please contact our support team.</p>
            <p>&copy; ${new Date().getFullYear()} Hofflabs. All rights reserved.</p>
        </div>
    </body>
    </html>
  `;

  const text = `
    Hofflabs API - Verify Your Email Address
    
    Hello ${data.username},
    
    Thank you for creating your Hofflabs API account! To complete your registration, please verify your email address.
    
    Visit this link to verify your email: ${verificationUrl}
    
    Why verify your email?
    - Secure your account and enable password recovery
    - Receive important account notifications
    - Access all API features
    
    If you didn't create this account, you can safely ignore this email.
    
    © ${new Date().getFullYear()} Hofflabs. All rights reserved.
  `;

  return {
    to: data.email,
    subject: 'Please Verify Your Email - Hofflabs API',
    html,
    text
  };
};

// Send password reset email
export const sendPasswordResetEmail = async (data: PasswordResetEmailData): Promise<{ success: boolean; error?: string }> => {
  const emailOptions = generatePasswordResetEmail(data);
  
  // In test mode, redirect emails to configured test recipient
  if (process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true') {
    emailOptions.to = TEST_EMAIL_RECIPIENT;
  }
  
  return await sendEmail(emailOptions);
};

// Send email verification email
export const sendEmailVerificationEmail = async (data: EmailVerificationData): Promise<{ success: boolean; error?: string }> => {
  const emailOptions = generateEmailVerificationEmail(data);
  
  // In test mode, redirect emails to configured test recipient
  if (process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true') {
    emailOptions.to = TEST_EMAIL_RECIPIENT;
  }
  
  return await sendEmail(emailOptions);
};
