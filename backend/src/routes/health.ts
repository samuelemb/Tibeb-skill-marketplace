import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Tibeb API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
