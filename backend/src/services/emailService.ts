import crypto from 'crypto';
import { Resend } from 'resend';

/**
 * Email Service for Authentication/Security Features
 * 
 * NOTE: This service is ONLY for authentication/security features:
 * - Account verification
 * - Password reset
 * 
 * NOT used for marketplace notifications (those are in-app only).
 */

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender address (must be verified in Resend)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

/**
 * Generate a secure random token for email verification or password reset
 * @param length - Token length (default: 32)
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a 6-digit OTP code for email verification
 */
export function generateVerificationCode(): string {
  // Generate random 6-digit code (000000 to 999999)
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate email verification code expiration (10 minutes from now)
 */
export function getVerificationCodeExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10); // 10 minutes
  return expiry;
}

/**
 * Generate attempts reset expiration (1 hour from now)
 * Used to reset failed attempt counter
 */
export function getVerificationAttemptsExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1); // 1 hour
  return expiry;
}

/**
 * Check if verification code is expired
 */
export function isCodeExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}

/**
 * Check if attempts should be reset (attempts expiry passed)
 */
export function shouldResetAttempts(attemptsExpiresAt: Date | null | undefined): boolean {
  if (!attemptsExpiresAt) return true;
  return new Date() > attemptsExpiresAt;
}

/**
 * Generate password reset code expiration (10 minutes from now)
 */
export function getPasswordResetCodeExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10); // 10 minutes
  return expiry;
}

/**
 * Generate password reset attempts reset expiration (1 hour from now)
 */
export function getPasswordResetAttemptsExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1); // 1 hour
  return expiry;
}

/**
 * Email Service Interface
 */
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using Resend
 * 
 * @param options - Email options
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY not configured. Email will not be sent.');
    console.log('📧 Email would be sent:', {
      to: options.to,
      subject: options.subject,
    });
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error('❌ Failed to send email via Resend:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('✅ Email sent successfully via Resend:', {
      to: options.to,
      subject: options.subject,
      emailId: data?.id,
    });
  } catch (error: any) {
    console.error('❌ Error sending email:', error);
    // Re-throw error so calling functions can handle it
    // Calling functions (authService) catch this and log it without blocking the request
    throw error;
  }
}

/**
 * Send account verification email with 6-digit OTP code
 * @param email - User email
 * @param firstName - User first name
 * @param code - 6-digit verification code
 */
export async function sendVerificationEmail(
  email: string,
  firstName: string,
  code: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email - Tibeb</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4F46E5;">Welcome to Tibeb!</h1>
        <p>Hi ${firstName},</p>
        <p>Thank you for registering with Tibeb. Please verify your email address using the verification code below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #F3F4F6; border: 2px solid #4F46E5; border-radius: 8px; padding: 20px; display: inline-block;">
            <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5; font-family: 'Courier New', monospace;">
              ${code}
            </p>
          </div>
        </div>
        <p style="text-align: center; color: #666; font-size: 14px;">Enter this code on the verification page to complete your registration.</p>
        <p style="color: #666; font-size: 14px;"><strong>This code will expire in 10 minutes.</strong></p>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">© ${new Date().getFullYear()} Tibeb. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to Tibeb!
    
    Hi ${firstName},
    
    Thank you for registering with Tibeb. Please verify your email address using the verification code below:
    
    Verification Code: ${code}
    
    Enter this code on the verification page to complete your registration.
    
    This code will expire in 10 minutes.
    
    If you didn't create an account, please ignore this email.
    
    © ${new Date().getFullYear()} Tibeb. All rights reserved.
  `;

  await sendEmail({
    to: email,
    subject: 'Verify Your Email - Tibeb',
    html,
    text,
  });
}

/**
 * Send password reset email with 6-digit OTP code
 * @param email - User email
 * @param firstName - User first name
 * @param code - 6-digit reset code
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  code: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password - Tibeb</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4F46E5;">Reset Your Password</h1>
        <p>Hi ${firstName},</p>
        <p>We received a request to reset your password. Please use the reset code below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #F3F4F6; border: 2px solid #4F46E5; border-radius: 8px; padding: 20px; display: inline-block;">
            <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5; font-family: 'Courier New', monospace;">
              ${code}
            </p>
          </div>
        </div>
        <p style="text-align: center; color: #666; font-size: 14px;">Enter this code on the password reset page to reset your password.</p>
        <p style="color: #666; font-size: 14px;"><strong>This code will expire in 10 minutes.</strong></p>
        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">© ${new Date().getFullYear()} Tibeb. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Reset Your Password
    
    Hi ${firstName},
    
    We received a request to reset your password. Please use the reset code below:
    
    Reset Code: ${code}
    
    Enter this code on the password reset page to reset your password.
    
    This code will expire in 10 minutes.
    
    If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
    
    © ${new Date().getFullYear()} Tibeb. All rights reserved.
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your Password - Tibeb',
    html,
    text,
  });
}

