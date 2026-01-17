import { Request, Response, NextFunction } from 'express';
import {
  getUserPortfolioItems,
  getPortfolioItemById,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
} from '../services/portfolioService';
import {
  createPortfolioItemSchema,
  updatePortfolioItemSchema,
} from '../utils/validation';
import { ValidationError } from '../utils/errors';

/**
 * Get current user's portfolio items
 */
export async function getMyPortfolio(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const portfolioItems = await getUserPortfolioItems(userId);
    res.status(200).json({
      success: true,
      data: portfolioItems,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get portfolio items for a specific user (public)
 */
export async function getPortfolioByUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const portfolioItems = await getUserPortfolioItems(userId);
    res.status(200).json({
      success: true,
      data: portfolioItems,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a specific portfolio item by ID (public - can view any user's portfolio)
 */
export async function getPortfolioItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const portfolioItem = await getPortfolioItemById(id);
    res.status(200).json({
      success: true,
      data: portfolioItem,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new portfolio item
 */
export async function createItem(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const validatedData = createPortfolioItemSchema.parse(req.body);
    const portfolioItem = await createPortfolioItem(userId, validatedData);
    res.status(201).json({
      success: true,
      data: portfolioItem,
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

/**
 * Update a portfolio item
 */
export async function updateItem(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const validatedData = updatePortfolioItemSchema.parse(req.body);
    const portfolioItem = await updatePortfolioItem(userId, id, validatedData);
    res.status(200).json({
      success: true,
      data: portfolioItem,
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

/**
 * Delete a portfolio item
 */
export async function deleteItem(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    await deletePortfolioItem(userId, id);
    res.status(200).json({
      success: true,
      message: 'Portfolio item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

