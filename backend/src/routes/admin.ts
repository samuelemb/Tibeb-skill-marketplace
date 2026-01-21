import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import {
  createAdminHandler,
  suspendUserHandler,
  unsuspendUserHandler,
  hideJobHandler,
  unhideJobHandler,
  hideProposalHandler,
  unhideProposalHandler,
  hideReviewHandler,
  unhideReviewHandler,
  holdEscrowHandler,
  releaseEscrowHandler,
  refundEscrowHandler,
  rejectEscrowHandler,
  listJobReportsHandler,
  resolveJobReportHandler,
} from '../controllers/adminController';

const router = Router();

/**
 * @swagger
 * /api/admin/create:
 *   post:
 *     summary: Create an admin account (requires x-admin-secret)
 *     tags: [Admin]
 *     parameters:
 *       - in: header
 *         name: x-admin-secret
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin creation secret
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin created
 *       400:
 *         description: Validation error
 */
router.post('/create', createAdminHandler);

router.patch('/users/:id/suspend', authenticate, requireRole(UserRole.ADMIN), suspendUserHandler);
router.patch('/users/:id/unsuspend', authenticate, requireRole(UserRole.ADMIN), unsuspendUserHandler);

router.patch('/jobs/:id/hide', authenticate, requireRole(UserRole.ADMIN), hideJobHandler);
router.patch('/jobs/:id/unhide', authenticate, requireRole(UserRole.ADMIN), unhideJobHandler);

router.patch('/proposals/:id/hide', authenticate, requireRole(UserRole.ADMIN), hideProposalHandler);
router.patch('/proposals/:id/unhide', authenticate, requireRole(UserRole.ADMIN), unhideProposalHandler);

router.patch('/reviews/:id/hide', authenticate, requireRole(UserRole.ADMIN), hideReviewHandler);
router.patch('/reviews/:id/unhide', authenticate, requireRole(UserRole.ADMIN), unhideReviewHandler);

router.post('/escrow/:jobId/hold', authenticate, requireRole(UserRole.ADMIN), holdEscrowHandler);
router.post('/escrow/:jobId/release', authenticate, requireRole(UserRole.ADMIN), releaseEscrowHandler);
router.post('/escrow/:jobId/refund', authenticate, requireRole(UserRole.ADMIN), refundEscrowHandler);
router.post('/escrow/:jobId/reject', authenticate, requireRole(UserRole.ADMIN), rejectEscrowHandler);

router.get('/reports', authenticate, requireRole(UserRole.ADMIN), listJobReportsHandler);
router.patch('/reports/:id', authenticate, requireRole(UserRole.ADMIN), resolveJobReportHandler);

export default router;
