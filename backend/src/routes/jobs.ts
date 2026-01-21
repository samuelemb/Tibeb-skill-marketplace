import { Router } from 'express';
import {
  create,
  list,
  getById,
  update,
  publish,
  updateStatus,
  remove,
  report,
} from '../controllers/jobController';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: List all jobs with enhanced full-text search
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, OPEN, CONTRACTED, IN_PROGRESS, COMPLETED]
 *         description: Filter by job status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [WEB_DEVELOPMENT, MOBILE_DEVELOPMENT, DESIGN, WRITING, MARKETING, DATA_ANALYTICS, CONSULTING, OTHER]
 *         description: Filter by job category
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filter by client ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Full-text search in title and description (PostgreSQL tsvector with relevance ranking)
 *       - in: query
 *         name: minBudget
 *         schema:
 *           type: number
 *         description: Minimum budget filter
 *       - in: query
 *         name: maxBudget
 *         schema:
 *           type: number
 *         description: Maximum budget filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, date, budget_asc, budget_desc]
 *         description: Sort order (relevance only works with search query)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of results per page (max 100)
 *     responses:
 *       200:
 *         description: Paginated list of jobs with relevance ranking
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Job'
 *                       - type: object
 *                         properties:
 *                           relevance:
 *                             type: number
 *                             nullable: true
 *                             description: Relevance score (only when search is used)
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 */
router.get('/', list);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/JobDetail'
 *       404:
 *         description: Job not found
 */
router.get('/:id', getById);

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job (CLIENT only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateJobRequest'
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Only clients can create jobs
 */
router.post('/', authenticate, requireRole(UserRole.CLIENT), create);

/**
 * @swagger
 * /api/jobs/{id}:
 *   put:
 *     summary: Update a job (CLIENT only, owner only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateJobRequest'
 *     responses:
 *       200:
 *         description: Job updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Job not found
 */
router.put('/:id', authenticate, requireRole(UserRole.CLIENT), update);

/**
 * @swagger
 * /api/jobs/{id}/publish:
 *   patch:
 *     summary: Publish a job (DRAFT â†’ OPEN)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job published successfully
 *       400:
 *         description: Invalid status transition
 *       403:
 *         description: Forbidden
 */
router.patch('/:id/publish', authenticate, requireRole(UserRole.CLIENT), publish);

/**
 * @swagger
 * /api/jobs/{id}/status:
 *   patch:
 *     summary: Update job status (CONTRACTED -> IN_PROGRESS -> COMPLETED)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [DRAFT, OPEN, CONTRACTED, IN_PROGRESS, COMPLETED]
 *                 description: |
 *                   Status transitions follow escrow workflow:
 *                   - OPEN â†’ IN_PROGRESS (Escrow Deposit)
 *                   - IN_PROGRESS â†’ COMPLETED (Funds Released)
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status transition
 */
router.patch('/:id/status', authenticate, requireRole(UserRole.CLIENT), updateStatus);

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     summary: Delete a job (CLIENT only, owner only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Job not found
 */
router.delete('/:id', authenticate, requireRole(UserRole.CLIENT), remove);

/**
 * @swagger
 * /api/jobs/{id}/report:
 *   post:
 *     summary: Report a job (authenticated users)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Report created
 */
router.post('/:id/report', authenticate, report);

export default router;



