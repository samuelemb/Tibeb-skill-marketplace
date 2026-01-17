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
} from '../controllers/adminController';

const router = Router();

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

export default router;
