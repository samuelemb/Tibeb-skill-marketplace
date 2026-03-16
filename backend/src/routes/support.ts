import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listChannels, listFaqs } from '../controllers/supportController';

const router = Router();

/**
 * @swagger
 * /api/support/faqs:
 *   get:
 *     summary: Get support FAQs
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *         description: Search term for FAQ question/answer/category
 *     responses:
 *       200:
 *         description: List of FAQs
 */
router.get('/faqs', authenticate, listFaqs);

/**
 * @swagger
 * /api/support/channels:
 *   get:
 *     summary: Get support contact channels
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Support contact channels
 */
router.get('/channels', authenticate, listChannels);

export default router;
