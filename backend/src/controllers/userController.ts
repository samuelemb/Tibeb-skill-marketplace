import { Request, Response, NextFunction } from 'express';
import { getPublicUserProfile } from '../services/userService';

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
