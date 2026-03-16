import { Request, Response, NextFunction } from 'express';
import {
  completeClientSetup,
  completeFreelancerSetup,
  getClientSetup,
  getFreelancerSetup,
  getPublicUserProfile,
  getUserPreferences,
  updateClientSetup,
  updateFreelancerSetup,
  updateUserPreferences,
} from '../services/userService';
import { updateClientSetupSchema, updateFreelancerSetupSchema } from '../utils/validation';

/**
 * Get public user profile
 * GET /api/users/{id}/public
 */
export async function getPublicProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const profile = await getPublicUserProfile(id);

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get authenticated user preferences
 * GET /api/users/preferences
 */
export async function getPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const preferences = await getUserPreferences(userId);

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update authenticated user preferences
 * PUT /api/users/preferences
 */
export async function putPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const preferences = await updateUserPreferences(userId, req.body || {});

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get authenticated freelancer setup data
 * GET /api/users/freelancer/setup
 */
export async function getFreelancerSetupHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const data = await getFreelancerSetup(userId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update authenticated freelancer setup data (partial)
 * PUT /api/users/freelancer/setup
 */
export async function updateFreelancerSetupHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user.userId;
    const validated = updateFreelancerSetupSchema.parse(req.body || {});
    const data = await updateFreelancerSetup(userId, validated);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark freelancer setup as complete
 * POST /api/users/freelancer/setup/complete
 */
export async function completeFreelancerSetupHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user.userId;
    const data = await completeFreelancerSetup(userId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get authenticated client setup data
 * GET /api/users/client/setup
 */
export async function getClientSetupHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const data = await getClientSetup(userId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update authenticated client setup data (partial)
 * PUT /api/users/client/setup
 */
export async function updateClientSetupHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user.userId;
    const validated = updateClientSetupSchema.parse(req.body || {});
    const data = await updateClientSetup(userId, validated);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark client setup as complete
 * POST /api/users/client/setup/complete
 */
export async function completeClientSetupHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user.userId;
    const data = await completeClientSetup(userId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}
