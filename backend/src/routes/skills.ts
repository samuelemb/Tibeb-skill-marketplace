import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getMySkills,
  addSkill,
  removeSkill,
  searchSkills,
} from '../controllers/skillController';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Skill:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: clx1234567890
 *         name:
 *           type: string
 *           example: React
 *         addedAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-01T00:00:00.000Z
 */

/**
 * @swagger
 * /api/skills:
 *   get:
 *     summary: Get current user's skills
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's skills
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Skill'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, getMySkills);

/**
 * @swagger
 * /api/skills/search:
 *   get:
 *     summary: Search all available skills (for autocomplete)
 *     tags: [Skills]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for skill name
 *     responses:
 *       200:
 *         description: List of matching skills
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 */
router.get('/search', searchSkills);

/**
 * @swagger
 * /api/skills:
 *   post:
 *     summary: Add a skill to current user's profile
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - skillName
 *             properties:
 *               skillName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Node.js
 *           example:
 *             skillName: "Node.js"
 *     responses:
 *       201:
 *         description: Skill added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Skill'
 *       400:
 *         description: Validation error or skill already exists
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, addSkill);

/**
 * @swagger
 * /api/skills/{skillId}:
 *   delete:
 *     summary: Remove a skill from current user's profile
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: skillId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the skill to remove
 *     responses:
 *       200:
 *         description: Skill removed successfully
 *       404:
 *         description: Skill not found in user's profile
 *       401:
 *         description: Unauthorized
 */
router.delete('/:skillId', authenticate, removeSkill);

export default router;

