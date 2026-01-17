import { prisma } from '../config/database';
import { CreateReviewInput } from '../utils/validation';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../utils/errors';
import { JobStatus } from '@prisma/client';

/**
 * Create a review for a completed job
 * Business Rules:
 * - Reviews only allowed when Job status = COMPLETED
 * - Each user can review the other party only once per job
 * - Both Client and Freelancer can review each other
 * - Prevent self-reviews
 * - Update reviewee's average rating
 */
export async function createReview(reviewerId: string, input: CreateReviewInput) {
  // Validate job exists and is COMPLETED
  const job = await prisma.job.findUnique({
    where: { id: input.jobId },
    include: {
      contract: {
        include: {
          client: {
            select: { id: true },
          },
          freelancer: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!job) {
    throw new NotFoundError('Job not found');
  }

  // Rule: Reviews only allowed when Job status = COMPLETED
  if (job.status !== JobStatus.COMPLETED) {
    throw new ValidationError('Reviews can only be submitted for completed jobs');
  }

  // Validate job has a contract (must have been completed through the platform)
  if (!job.contract) {
    throw new ValidationError('Job must have a completed contract to be reviewed');
  }

  // Validate reviewee exists
  const reviewee = await prisma.user.findUnique({
    where: { id: input.revieweeId },
  });

  if (!reviewee) {
    throw new NotFoundError('Reviewee not found');
  }

  // Rule: Prevent self-reviews
  if (reviewerId === input.revieweeId) {
    throw new ValidationError('You cannot review yourself');
  }

  // Validate reviewer is either the client or freelancer of this job
  const isClient = job.clientId === reviewerId;
  const isFreelancer = job.contract.freelancerId === reviewerId;

  if (!isClient && !isFreelancer) {
    throw new ForbiddenError('You can only review participants of jobs you were involved in');
  }

  // Validate reviewee is the other party (client or freelancer)
  const isRevieweeClient = job.clientId === input.revieweeId;
  const isRevieweeFreelancer = job.contract.freelancerId === input.revieweeId;

  if (!isRevieweeClient && !isRevieweeFreelancer) {
    throw new ValidationError('You can only review the client or freelancer of this job');
  }

  // Rule: Each user can review the other party only once per job
  const existingReview = await prisma.review.findUnique({
    where: {
      jobId_reviewerId: {
        jobId: input.jobId,
        reviewerId,
      },
    },
  });

  if (existingReview) {
    throw new ConflictError('You have already submitted a review for this job');
  }

  // Create review and update average rating in a transaction
  return await prisma.$transaction(async (tx) => {
    // Create the review
    const review = await tx.review.create({
      data: {
        jobId: input.jobId,
        reviewerId,
        revieweeId: input.revieweeId,
        rating: input.rating,
        comment: input.comment,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Calculate and update reviewee's average rating
    const allReviews = await tx.review.findMany({
      where: { revieweeId: input.revieweeId },
      select: { rating: true },
    });

    const averageRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    // Note: We're not storing averageRating in User model to keep it simple
    // It can be calculated on-the-fly when needed, or you can add an averageRating field later
    // For now, we'll return the calculated average in the response

    return {
      review,
      revieweeAverageRating: parseFloat(averageRating.toFixed(2)),
      totalReviews: allReviews.length,
    };
  });
}

/**
 * Get all reviews for a specific user (as reviewee)
 * @param userId - User ID to get reviews for
 * @param options - Pagination options
 */
export async function getReviewsByUser(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
) {
  // Validate user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  // Get reviews where user is the reviewee
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.review.count({
      where: { revieweeId: userId },
    }),
  ]);

  // Calculate average rating
  const allRatings = await prisma.review.findMany({
    where: { revieweeId: userId },
    select: { rating: true },
  });

  const averageRating =
    allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
      : 0;

  return {
    reviews,
    averageRating: parseFloat(averageRating.toFixed(2)),
    totalReviews: total,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + reviews.length < total,
    },
  };
}

/**
 * Get average rating for a user (calculated on-the-fly)
 * @param userId - User ID
 */
export async function getUserAverageRating(userId: string) {
  const reviews = await prisma.review.findMany({
    where: { revieweeId: userId },
    select: { rating: true },
  });

  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
    };
  }

  const averageRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return {
    averageRating: parseFloat(averageRating.toFixed(2)),
    totalReviews: reviews.length,
  };
}

