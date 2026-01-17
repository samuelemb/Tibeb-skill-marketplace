import { Request, Response, NextFunction } from 'express';
import {
  createReview,
  getReviewsByUser,
  getUserAverageRating,
} from '../services/reviewService';
import { createReviewSchema } from '../utils/validation';

/**
 * Create a review
 * POST /api/reviews
 */
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const reviewerId = (req as any).user.userId;
    const validatedData = createReviewSchema.parse(req.body);

    const result = await createReview(reviewerId, validatedData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Review submitted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get reviews for a specific user
 * GET /api/reviews/user/:userId
 */
export async function getByUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await getReviewsByUser(userId, {
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      data: result.reviews,
      averageRating: result.averageRating,
      totalReviews: result.totalReviews,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get average rating for a user
 * GET /api/reviews/user/:userId/average
 */
export async function getAverageRating(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;

    const result = await getUserAverageRating(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

