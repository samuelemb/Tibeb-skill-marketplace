import { Router } from 'express';
import {
  create,
  getByUser,
  getAverageRating,
} from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review for a completed job
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - revieweeId
 *               - rating
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: ID of the completed job
 *               revieweeId:
 *                 type: string
 *                 description: ID of the user being reviewed
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Optional review comment
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Validation error (job not completed, self-review, etc.)
 *       403:
 *         description: Forbidden (not a participant in the job)
 *       409:
 *         description: Review already exists for this job
 */
router.post('/', authenticate, create);

/**
 * @swagger
 * /api/reviews/user/{userId}:
 *   get:
 *     summary: Get all reviews for a specific user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to get reviews for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of reviews to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of reviews to skip
 *     responses:
 *       200:
 *         description: List of reviews with average rating
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', authenticate, getByUser);

/**
 * @swagger
 * /api/reviews/user/{userId}/average:
 *   get:
 *     summary: Get average rating for a user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to get average rating for
 *     responses:
 *       200:
 *         description: Average rating and total reviews
 *       404:
 *         description: User not found
 */
router.get('/user/:userId/average', getAverageRating);

export default router;

