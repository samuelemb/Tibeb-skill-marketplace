import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import {
  initEscrow,
  verifyEscrow,
  chapaWebhook,
  getEscrowStatus,
  refundEscrow,
  disputeEscrow,
} from '../controllers/paymentController';

const router = Router();

/**
 * @swagger
 * /api/payments/chapa/initialize:
 *   post:
 *     summary: Initialize escrow payment (Chapa)
 *     tags: [Payments]
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
 *             properties:
 *               jobId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checkout URL returned
 */
router.post('/chapa/initialize', authenticate, initEscrow);

/**
 * @swagger
 * /api/payments/chapa/verify/{txRef}:
 *   get:
 *     summary: Verify escrow payment (Chapa)
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: txRef
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Escrow verification result
 */
router.get('/chapa/verify/:txRef', authenticate, requireRole(UserRole.CLIENT), verifyEscrow);

/**
 * @swagger
 * /api/payments/escrow/{jobId}:
 *   get:
 *     summary: Get escrow status for a job
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Escrow status
 */
router.get('/escrow/:jobId', authenticate, getEscrowStatus);

/**
 * @swagger
 * /api/payments/escrow/{jobId}/refund:
 *   post:
 *     summary: Refund escrow (Client only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Escrow refunded
 */
router.post('/escrow/:jobId/refund', authenticate, requireRole(UserRole.CLIENT), refundEscrow);

/**
 * @swagger
 * /api/payments/escrow/{jobId}/dispute:
 *   post:
 *     summary: Open escrow dispute
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dispute opened
 */
router.post('/escrow/:jobId/dispute', authenticate, disputeEscrow);

/**
 * @swagger
 * /api/payments/chapa/webhook:
 *   post:
 *     summary: Chapa webhook
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.post('/chapa/webhook', chapaWebhook);

export default router;
