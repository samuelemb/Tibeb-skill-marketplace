import { Router } from 'express';
import {
  create,
  list,
  getById,
  offer,
  accept,
  reject,
  withdraw,
} from '../controllers/proposalController';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @swagger
 * /api/proposals:
 *   get:
 *     summary: List proposals (with optional filters)
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *         description: Filter by job ID
 *       - in: query
 *         name: freelancerId
 *         schema:
 *           type: string
 *         description: Filter by freelancer ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, OFFERED, ACCEPTED, REJECTED]
 *         description: Filter by proposal status
 *     responses:
 *       200:
 *         description: List of proposals
 */
router.get('/', authenticate, list);

/**
 * @swagger
 * /api/proposals/{id}:
 *   get:
 *     summary: Get proposal by ID
 *     tags: [Proposals]
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
 *         description: Proposal details
 *       404:
 *         description: Proposal not found
 */
router.get('/:id', authenticate, getById);

/**
 * @swagger
 * /api/proposals:
 *   post:
 *     summary: Submit a proposal (FREELANCER only)
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProposalRequest'
 *     responses:
 *       201:
 *         description: Proposal submitted successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Only freelancers can submit proposals
 *       409:
 *         description: Proposal already exists
 */
router.post('/', authenticate, requireRole(UserRole.FREELANCER), create);

/**
 * @swagger
 * /api/proposals/{id}/offer:
 *   post:
 *     summary: Send an offer to a freelancer (CLIENT only)
 *     tags: [Proposals]
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
 *         description: Offer sent successfully (PENDING → OFFERED)
 *       400:
 *         description: Invalid proposal or job status
 *       403:
 *         description: Only clients can send offers
 *       404:
 *         description: Proposal not found
 */
router.post('/:id/offer', authenticate, requireRole(UserRole.CLIENT), offer);

/**
 * @swagger
 * /api/proposals/{id}/accept:
 *   post:
 *     summary: Accept an offer and create contract (FREELANCER only)
 *     tags: [Proposals]
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
 *         description: Offer accepted and contract created (OFFERED → ACCEPTED)
 *       400:
 *         description: Invalid proposal or job status
 *       403:
 *         description: Only freelancers can accept offers
 *       404:
 *         description: Proposal not found
 */
router.post('/:id/accept', authenticate, requireRole(UserRole.FREELANCER), accept);

/**
 * @swagger
 * /api/proposals/{id}/reject:
 *   post:
 *     summary: Reject an offer (FREELANCER only)
 *     tags: [Proposals]
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
 *         description: Offer rejected successfully (OFFERED → REJECTED)
 *       400:
 *         description: Invalid proposal status
 *       403:
 *         description: Only freelancers can reject offers
 *       404:
 *         description: Proposal not found
 */
router.post('/:id/reject', authenticate, requireRole(UserRole.FREELANCER), reject);

/**
 * @swagger
 * /api/proposals/{id}:
 *   delete:
 *     summary: Withdraw a proposal (FREELANCER only, owner only)
 *     tags: [Proposals]
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
 *         description: Proposal withdrawn successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Proposal not found
 */
router.delete('/:id', authenticate, requireRole(UserRole.FREELANCER), withdraw);

export default router;

