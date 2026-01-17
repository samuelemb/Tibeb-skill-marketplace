import { Request, Response, NextFunction } from 'express';
import {
  registerUser,
  loginUser,
  getUserById,
  updateProfile as updateUserProfile,
  verifyEmail,
  resendVerificationCode,
  requestPasswordReset,
  resetPassword,
} from '../services/authService';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationCodeSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../utils/validation';
import { ValidationError } from '../utils/errors';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);

    // Register user
    const result = await registerUser(validatedData);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);

    // Login user
    const result = await loginUser(validatedData);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    // req.user is set by auth middleware
    const userId = (req as any).user.userId;

    const user = await getUserById(userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    
    // Handle multer errors (file upload errors)
    if ((req as any).fileValidationError) {
      return res.status(400).json({
        success: false,
        error: (req as any).fileValidationError,
      });
    }
    
    // Handle file upload if present
    const file = (req as any).file;
    
    // Validate text fields (firstName, lastName)
    const validatedData = updateProfileSchema.parse({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      avatarUrl: file ? `/uploads/avatars/${file.filename}` : req.body.avatarUrl,
    });

    const updatedUser = await updateUserProfile(userId, validatedData);

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}

export async function verify(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = verifyEmailSchema.parse(req.body);
    const result = await verifyEmail(validatedData);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}

export async function resendCode(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = resendVerificationCodeSchema.parse(req.body);
    const result = await resendVerificationCode(validatedData);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}


export async function requestReset(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = requestPasswordResetSchema.parse(req.body);
    const result = await requestPasswordReset(validatedData);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}

export async function reset(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    const result = await resetPassword(validatedData);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}

