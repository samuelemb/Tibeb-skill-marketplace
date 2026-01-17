import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getMyTransactions, getMyWallet } from '../controllers/walletController';

const router = Router();

/**
 * @swagger
 * /api/wallet:
 *   get:
 *     summary: Get current user's wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet info
 */
router.get('/', authenticate, getMyWallet);

/**
 * @swagger
 * /api/wallet/transactions:
 *   get:
 *     summary: Get wallet transactions
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transactions
 */
router.get('/transactions', authenticate, getMyTransactions);

export default router;
