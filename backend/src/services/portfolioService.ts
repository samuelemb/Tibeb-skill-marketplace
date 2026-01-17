import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { CreatePortfolioItemInput, UpdatePortfolioItemInput } from '../utils/validation';

/**
 * Get all portfolio items for a user
 */
export async function getUserPortfolioItems(userId: string) {
  const portfolioItems = await prisma.portfolioItem.findMany({
    where: { userId },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return portfolioItems;
}

/**
 * Get a single portfolio item by ID
 */
export async function getPortfolioItemById(portfolioItemId: string) {
  const portfolioItem = await prisma.portfolioItem.findUnique({
    where: { id: portfolioItemId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!portfolioItem) {
    throw new NotFoundError('Portfolio item not found');
  }

  return portfolioItem;
}

/**
 * Create a new portfolio item
 */
export async function createPortfolioItem(userId: string, input: CreatePortfolioItemInput) {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const portfolioItem = await prisma.portfolioItem.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl || null,
      projectUrl: input.projectUrl || null,
      technologies: input.technologies || null,
    },
  });

  return portfolioItem;
}

/**
 * Update a portfolio item
 */
export async function updatePortfolioItem(
  userId: string,
  portfolioItemId: string,
  input: UpdatePortfolioItemInput
) {
  // Check if portfolio item exists and belongs to user
  const portfolioItem = await prisma.portfolioItem.findUnique({
    where: { id: portfolioItemId },
    select: { userId: true },
  });

  if (!portfolioItem) {
    throw new NotFoundError('Portfolio item not found');
  }

  if (portfolioItem.userId !== userId) {
    throw new ForbiddenError('You can only update your own portfolio items');
  }

  const updatedPortfolioItem = await prisma.portfolioItem.update({
    where: { id: portfolioItemId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.description && { description: input.description }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      ...(input.projectUrl !== undefined && { projectUrl: input.projectUrl }),
      ...(input.technologies !== undefined && { technologies: input.technologies }),
    },
  });

  return updatedPortfolioItem;
}

/**
 * Delete a portfolio item
 */
export async function deletePortfolioItem(userId: string, portfolioItemId: string) {
  // Check if portfolio item exists and belongs to user
  const portfolioItem = await prisma.portfolioItem.findUnique({
    where: { id: portfolioItemId },
    select: { userId: true },
  });

  if (!portfolioItem) {
    throw new NotFoundError('Portfolio item not found');
  }

  if (portfolioItem.userId !== userId) {
    throw new ForbiddenError('You can only delete your own portfolio items');
  }

  await prisma.portfolioItem.delete({
    where: { id: portfolioItemId },
  });

  return { success: true };
}

