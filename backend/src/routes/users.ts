import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';
import {
  completeClientSetupHandler,
  completeFreelancerSetupHandler,
  getClientSetupHandler,
  getFreelancerSetupHandler,
  getPreferences,
  getPublicProfile,
  putPreferences,
  updateClientSetupHandler,
  updateFreelancerSetupHandler,
} from '../controllers/userController';

const router = Router();

/**
 * @swagger
 * /api/users/preferences:
 *   get:
 *     summary: Get authenticated user preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preferences
 *   put:
 *     summary: Update authenticated user preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 description: Allowed values are en, am, om, ti
 *                 example: en
 *               theme:
 *                 type: string
 *                 description: Allowed values are light, dark
 *                 example: light
 *               pushNewMessages:
 *                 type: boolean
 *               pushProjectUpdates:
 *                 type: boolean
 *               pushPaymentAlerts:
 *                 type: boolean
 *               pushMarketing:
 *                 type: boolean
 *               emailNewMessages:
 *                 type: boolean
 *               emailProjectUpdates:
 *                 type: boolean
 *               emailPaymentAlerts:
 *                 type: boolean
 *               emailMarketing:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated user preferences
 *       400:
 *         description: Invalid language/theme or payload
 */
router.get('/preferences', authenticate, getPreferences);
router.put('/preferences', authenticate, putPreferences);

/**
 * @swagger
 * /api/users/freelancer/setup:
 *   get:
 *     summary: Get authenticated freelancer setup data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Freelancer setup data
 *   put:
 *     summary: Update authenticated freelancer setup data (partial)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               headline:
 *                 type: string
 *               bio:
 *                 type: string
 *                 description: Max 500 chars
 *               hourlyRate:
 *                 type: number
 *               experienceLevel:
 *                 type: string
 *                 enum: [ENTRY, INTERMEDIATE, EXPERT]
 *               availability:
 *                 type: string
 *                 enum: [FULL_TIME, PART_TIME, AS_NEEDED]
 *               links:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       maxLength: 60
 *                     url:
 *                       type: string
 *                       format: uri
 *     responses:
 *       200:
 *         description: Updated freelancer setup data
 */
router.get('/freelancer/setup', authenticate, requireRole(UserRole.FREELANCER), getFreelancerSetupHandler);
router.put('/freelancer/setup', authenticate, requireRole(UserRole.FREELANCER), updateFreelancerSetupHandler);

/**
 * @swagger
 * /api/users/freelancer/setup/complete:
 *   post:
 *     summary: Mark authenticated freelancer setup as complete
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Setup completion flag updated
 *       400:
 *         description: Required setup fields are missing
 */
router.post(
  '/freelancer/setup/complete',
  authenticate,
  requireRole(UserRole.FREELANCER),
  completeFreelancerSetupHandler
);

/**
 * @swagger
 * /api/users/client/setup:
 *   get:
 *     summary: Get authenticated client setup data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client setup data
 *   put:
 *     summary: Update authenticated client setup data (partial)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *               shortBio:
 *                 type: string
 *                 description: 20-250 characters
 *               industries:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [ECOMMERCE, HEALTHCARE, EDUCATION, FINTECH, REAL_ESTATE, ENTERTAINMENT]
 *               focus:
 *                 type: string
 *                 enum: [LONG_TERM_CONTRACTS, ONE_TIME_TASKS, CONSULTANCY]
 *               phone:
 *                 type: string
 *               website:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Updated client setup data
 */
router.get('/client/setup', authenticate, requireRole(UserRole.CLIENT), getClientSetupHandler);
router.put('/client/setup', authenticate, requireRole(UserRole.CLIENT), updateClientSetupHandler);

/**
 * @swagger
 * /api/users/client/setup/complete:
 *   post:
 *     summary: Mark authenticated client setup as complete
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client setup completion flag updated
 *       400:
 *         description: Required setup fields are missing
 */
router.post(
  '/client/setup/complete',
  authenticate,
  requireRole(UserRole.CLIENT),
  completeClientSetupHandler
);

/**
 * @swagger
 * /api/users/{id}/public:
 *   get:
 *     summary: Get public user profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Public user profile
 *       404:
 *         description: User not found
 */
router.get('/:id/public', getPublicProfile);

export default router;
