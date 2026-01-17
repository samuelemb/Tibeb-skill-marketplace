import { Router } from 'express';
import {
  create,
  list,
  markAsRead,
  getUnreadCount,
} from '../controllers/messageController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get messages (filtered by job/contract/conversation)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *         description: Filter messages by job ID
 *       - in: query
 *         name: contractId
 *         schema:
 *           type: string
 *         description: Filter messages by contract ID
 *       - in: query
 *         name: conversationWith
 *         schema:
 *           type: string
 *         description: Filter messages with specific user ID
 *     responses:
 *       200:
 *         description: List of messages
 *       403:
 *         description: Forbidden - No access to this conversation
 */
router.get('/', authenticate, list);

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMessageRequest'
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - No access to this job/contract
 */
router.post('/', authenticate, create);

/**
 * @swagger
 * /api/messages/unread-count:
 *   get:
 *     summary: Get unread message count
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread message count
 */
router.get('/unread-count', authenticate, getUnreadCount);

/**
 * @swagger
 * /api/messages/{id}/read:
 *   patch:
 *     summary: Mark message as read
 *     tags: [Messages]
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
 *         description: Message marked as read
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Message not found
 */
router.patch('/:id/read', authenticate, markAsRead);

export default router;

