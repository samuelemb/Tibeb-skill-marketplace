import { z } from 'zod';

// Auth Validation Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['CLIENT', 'FREELANCER'], {
    errorMap: () => ({ message: 'Role must be either CLIENT or FREELANCER' }),
  }),
});

export const createAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Email Verification Schemas
export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d+$/, 'Verification code must be numeric'),
});

export const resendVerificationCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Password Reset Schemas
export const requestPasswordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Reset code must be 6 digits').regex(/^\d+$/, 'Reset code must be numeric'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// User Profile Validation Schemas
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long').optional(),
  avatarUrl: z.string().max(500, 'Avatar URL is too long').optional().nullable(),
});

// Job Validation Schemas
export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  budget: z.number().positive('Budget must be positive').optional(),
  category: z.enum(['WEB_DEVELOPMENT', 'MOBILE_DEVELOPMENT', 'DESIGN', 'WRITING', 'MARKETING', 'DATA_ANALYTICS', 'CONSULTING', 'OTHER']).optional(),
});

export const updateJobSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(10).optional(),
  budget: z.number().positive().optional(),
  category: z.enum(['WEB_DEVELOPMENT', 'MOBILE_DEVELOPMENT', 'DESIGN', 'WRITING', 'MARKETING', 'DATA_ANALYTICS', 'CONSULTING', 'OTHER']).optional(),
});

export const updateJobStatusSchema = z.object({
  status: z.enum(['DRAFT', 'OPEN', 'CONTRACTED', 'IN_PROGRESS', 'COMPLETED']),
});

// Proposal Validation Schemas
export const createProposalSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  proposedAmount: z.number().positive('Amount must be positive').optional(),
});

// Message Validation Schemas
export const createMessageSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  contractId: z.string().optional(),
  receiverId: z.string().min(1, 'Receiver ID is required'),
  content: z.string().min(1, 'Message content is required'),
});

// Review Validation Schemas
export const createReviewSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  revieweeId: z.string().min(1, 'Reviewee ID is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(1000, 'Comment must be at most 1000 characters').optional(),
});

// Skill Validation Schemas
export const addSkillSchema = z.object({
  skillName: z.string().min(1, 'Skill name is required').max(100, 'Skill name is too long').trim(),
});

export const removeSkillSchema = z.object({
  skillId: z.string().min(1, 'Skill ID is required'),
});

// Portfolio Validation Schemas
export const createPortfolioItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description is too long'),
  imageUrl: z.string().url('Image URL must be a valid URL').max(500, 'Image URL is too long').optional().nullable(),
  projectUrl: z.string().url('Project URL must be a valid URL').max(500, 'Project URL is too long').optional().nullable(),
  technologies: z.string().max(500, 'Technologies string is too long').optional().nullable(),
});

export const updatePortfolioItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  imageUrl: z.string().url().max(500).optional().nullable(),
  projectUrl: z.string().url().max(500).optional().nullable(),
  technologies: z.string().max(500).optional().nullable(),
});

// Type exports for use in controllers
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationCodeInput = z.infer<typeof resendVerificationCodeSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type UpdateJobStatusInput = z.infer<typeof updateJobStatusSchema>;
export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type AddSkillInput = z.infer<typeof addSkillSchema>;
export type RemoveSkillInput = z.infer<typeof removeSkillSchema>;
export type CreatePortfolioItemInput = z.infer<typeof createPortfolioItemSchema>;
export type UpdatePortfolioItemInput = z.infer<typeof updatePortfolioItemSchema>;

