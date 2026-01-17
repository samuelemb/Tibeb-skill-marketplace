import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { generateToken } from '../utils/jwt';
import {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ResendVerificationCodeInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from '../utils/validation';
import { UnauthorizedError, ConflictError, NotFoundError, ValidationError } from '../utils/errors';
import { UserRole } from '@prisma/client';
import {
  generateVerificationCode,
  getVerificationCodeExpiry,
  getVerificationAttemptsExpiry,
  isCodeExpired,
  shouldResetAttempts,
  getPasswordResetCodeExpiry,
  getPasswordResetAttemptsExpiry,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from './emailService';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: UserRole;
    emailVerified: boolean;
  };
  token: string;
  requiresVerification?: boolean; // True if user needs to verify email (no token returned)
}

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(input.password, 10);

  // Generate 6-digit verification code
  const verificationCode = generateVerificationCode();
  const verificationCodeExpiry = getVerificationCodeExpiry();
  const attemptsExpiry = getVerificationAttemptsExpiry();

  // Create user
  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      emailVerificationCode: verificationCode,
      emailVerificationCodeExpiresAt: verificationCodeExpiry,
      emailVerificationAttempts: 0,
      emailVerificationAttemptsExpiresAt: attemptsExpiry,
      emailVerified: false, // Default to false
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  // Send verification email with code (async, don't wait for it)
  sendVerificationEmail(user.email, input.firstName, verificationCode).catch((error) => {
    console.error('Failed to send verification email:', error);
    // Don't throw - registration should succeed even if email fails
  });

  // No token returned - user must verify email first
  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      emailVerified: user.emailVerified,
    },
    token: '', // No token until email is verified
    requiresVerification: true, // User needs to verify email
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      role: true,
      emailVerified: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(input.password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // If email is not verified, user cannot login
  if (!user.emailVerified) {
    // Generate new code and send email (in case they lost the original)
    const verificationCode = generateVerificationCode();
    const verificationCodeExpiry = getVerificationCodeExpiry();
    const attemptsExpiry = getVerificationAttemptsExpiry();

    // Update user with new verification code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationCodeExpiresAt: verificationCodeExpiry,
        emailVerificationAttempts: 0, // Reset attempts
        emailVerificationAttemptsExpiresAt: attemptsExpiry,
      },
    });

    // Send verification email (async, don't wait for it)
    sendVerificationEmail(user.email, user.firstName, verificationCode).catch((error) => {
      console.error('Failed to send verification email:', error);
    });

    // Return error - user must verify email first
    throw new UnauthorizedError('Please verify your email address before logging in. A verification code has been sent to your email.');
  }

  // Email is verified - create normal session
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      emailVerified: true,
    },
    token,
    requiresVerification: false,
  };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

/**
 * Update user profile
 * @param userId - User ID (from authenticated session)
 * @param input - Profile update data (firstName, lastName, avatarUrl)
 */
export async function updateProfile(userId: string, input: UpdateProfileInput) {
  // Check if user exists and get current avatar
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Delete old avatar file if new one is being uploaded
  if (input.avatarUrl && user.avatarUrl && user.avatarUrl !== input.avatarUrl) {
    const fs = require('fs');
    const path = require('path');
    const oldAvatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(user.avatarUrl));
    
    // Delete old file if it exists (don't throw error if file doesn't exist)
    try {
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    } catch (error) {
      // Log error but don't fail the update
      console.error('Error deleting old avatar file:', error);
    }
  }

  // If avatarUrl is explicitly set to null, delete the file
  if (input.avatarUrl === null && user.avatarUrl) {
    const fs = require('fs');
    const path = require('path');
    const oldAvatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(user.avatarUrl));
    
    try {
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    } catch (error) {
      console.error('Error deleting avatar file:', error);
    }
  }

  // Update user profile
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.firstName && { firstName: input.firstName }),
      ...(input.lastName && { lastName: input.lastName }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
}

/**
 * Verify user email address using 6-digit OTP code
 * @param input - Verification code
 */
export async function verifyEmail(input: VerifyEmailInput): Promise<AuthResponse> {
  const { email, code } = input;
  const MAX_ATTEMPTS = 5;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      role: true,
      emailVerified: true,
      emailVerificationCode: true,
      emailVerificationCodeExpiresAt: true,
      emailVerificationAttempts: true,
      emailVerificationAttemptsExpiresAt: true,
    },
  });

  if (!user) {
    throw new ValidationError('Invalid or expired verification code');
  }

  // Check if already verified
  if (user.emailVerified) {
    throw new ValidationError('Email is already verified');
  }

  // Reset attempts if expiry passed
  let currentAttempts = user.emailVerificationAttempts;
  if (shouldResetAttempts(user.emailVerificationAttemptsExpiresAt)) {
    currentAttempts = 0;
  }

  // Check if attempts exceeded
  if (currentAttempts >= MAX_ATTEMPTS) {
    throw new ValidationError('Too many failed attempts. Please request a new code.');
  }

  // Check if code is expired
  if (isCodeExpired(user.emailVerificationCodeExpiresAt)) {
    // Increment attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationAttempts: currentAttempts + 1,
        emailVerificationAttemptsExpiresAt: getVerificationAttemptsExpiry(),
      },
    });
    throw new ValidationError('Invalid or expired verification code');
  }

  // Check if code matches
  if (user.emailVerificationCode !== code) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationAttempts: currentAttempts + 1,
        emailVerificationAttemptsExpiresAt: getVerificationAttemptsExpiry(),
      },
    });
    throw new ValidationError('Invalid or expired verification code');
  }

  // Code is valid - verify email and create session
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationCode: null,
      emailVerificationCodeExpiresAt: null,
      emailVerificationAttempts: 0,
      emailVerificationAttemptsExpiresAt: null,
    },
  });

  // Generate JWT token for authenticated session
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      emailVerified: true,
    },
    token,
    requiresVerification: false,
  };
}

/**
 * Resend verification code
 * @param input - Email address
 */
export async function resendVerificationCode(input: ResendVerificationCodeInput) {
  const { email } = input;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      emailVerified: true,
    },
  });

  // Don't reveal if user exists (security best practice)
  // If user doesn't exist or already verified, return success anyway
  if (!user || user.emailVerified) {
    return {
      message: 'If an account with that email exists and is unverified, a new verification code has been sent.',
    };
  }

  // Generate new verification code
  const verificationCode = generateVerificationCode();
  const verificationCodeExpiry = getVerificationCodeExpiry();
  const attemptsExpiry = getVerificationAttemptsExpiry();

  // Update user with new code and reset attempts
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationCode: verificationCode,
      emailVerificationCodeExpiresAt: verificationCodeExpiry,
      emailVerificationAttempts: 0,
      emailVerificationAttemptsExpiresAt: attemptsExpiry,
    },
  });

  // Send verification email (async, don't wait for it)
  sendVerificationEmail(user.email, user.firstName, verificationCode).catch((error) => {
    console.error('Failed to send verification email:', error);
  });

  return {
    message: 'If an account with that email exists and is unverified, a new verification code has been sent.',
  };
}


/**
 * Request password reset - sends email with 6-digit OTP code
 * @param input - User email
 */
export async function requestPasswordReset(input: RequestPasswordResetInput) {
  const { email } = input;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
    },
  });

  // Don't reveal if user exists (security best practice)
  if (!user) {
    // Return success even if user doesn't exist to prevent email enumeration
    return {
      message: 'If an account with that email exists, a password reset code has been sent.',
    };
  }

  // Generate 6-digit password reset code
  const resetCode = generateVerificationCode();
  const resetCodeExpiry = getPasswordResetCodeExpiry();

  // Update user with reset code and reset attempts
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetCode: resetCode,
      passwordResetCodeExpiresAt: resetCodeExpiry,
      passwordResetAttempts: 0,
      passwordResetAttemptsExpiresAt: getPasswordResetAttemptsExpiry(),
    },
  });

  // Send password reset email (async, don't wait for it)
  sendPasswordResetEmail(user.email, user.firstName, resetCode).catch((error) => {
    console.error('Failed to send password reset email:', error);
    // Don't throw - request should succeed even if email fails
  });

  return {
    message: 'If an account with that email exists, a password reset code has been sent.',
  };
}

/**
 * Reset password using 6-digit OTP code
 * @param input - Email, reset code, and new password
 */
export async function resetPassword(input: ResetPasswordInput) {
  const { email, code, newPassword } = input;
  const MAX_ATTEMPTS = 5;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordResetCode: true,
      passwordResetCodeExpiresAt: true,
      passwordResetAttempts: true,
      passwordResetAttemptsExpiresAt: true,
    },
  });

  if (!user) {
    throw new ValidationError('Invalid or expired reset code');
  }

  // Reset attempts if expiry passed
  let currentAttempts = user.passwordResetAttempts;
  if (shouldResetAttempts(user.passwordResetAttemptsExpiresAt)) {
    currentAttempts = 0;
  }

  // Check if attempts exceeded
  if (currentAttempts >= MAX_ATTEMPTS) {
    throw new ValidationError('Too many failed attempts. Please request a new code.');
  }

  // Check if code is expired
  if (isCodeExpired(user.passwordResetCodeExpiresAt)) {
    // Increment attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetAttempts: currentAttempts + 1,
        passwordResetAttemptsExpiresAt: getPasswordResetAttemptsExpiry(),
      },
    });
    throw new ValidationError('Invalid or expired reset code');
  }

  // Check if code matches
  if (user.passwordResetCode !== code) {
    // Increment attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetAttempts: currentAttempts + 1,
        passwordResetAttemptsExpiresAt: getPasswordResetAttemptsExpiry(),
      },
    });
    throw new ValidationError('Invalid reset code');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password and clear reset code
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetCode: null,
      passwordResetCodeExpiresAt: null,
      passwordResetAttempts: 0,
      passwordResetAttemptsExpiresAt: null,
    },
  });

  return {
    message: 'Password reset successfully',
  };
}

