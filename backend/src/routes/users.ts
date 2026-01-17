import { Router } from 'express';
import { getPublicProfile } from '../controllers/userController';

const router = Router();

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
