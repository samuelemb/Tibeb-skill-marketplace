import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getMyPortfolio,
  getPortfolioItem,
  getPortfolioByUser,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/portfolioController';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PortfolioItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: clx1234567890
 *         userId:
 *           type: string
 *         title:
 *           type: string
 *           example: E-commerce Website
 *         description:
 *           type: string
 *           example: A full-stack e-commerce platform built with React and Node.js
 *         imageUrl:
 *           type: string
 *           nullable: true
 *           example: https://example.com/project-image.jpg
 *         projectUrl:
 *           type: string
 *           nullable: true
 *           example: https://example.com/project
 *         technologies:
 *           type: string
 *           nullable: true
 *           example: React, Node.js, PostgreSQL
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/portfolio:
 *   get:
 *     summary: Get current user's portfolio items
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's portfolio items
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
 *                     $ref: '#/components/schemas/PortfolioItem'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, getMyPortfolio);

/**
 * @swagger
 * /api/portfolio/user/{userId}:
 *   get:
 *     summary: Get portfolio items for a specific user (public)
 *     tags: [Portfolio]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to get portfolio items for
 *     responses:
 *       200:
 *         description: List of portfolio items for the user
 */
router.get('/user/:userId', getPortfolioByUser);

/**
 * @swagger
 * /api/portfolio/{id}:
 *   get:
 *     summary: Get a specific portfolio item by ID (public)
 *     tags: [Portfolio]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Portfolio item ID
 *     responses:
 *       200:
 *         description: Portfolio item details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PortfolioItem'
 *       404:
 *         description: Portfolio item not found
 */
router.get('/:id', getPortfolioItem);

/**
 * @swagger
 * /api/portfolio:
 *   post:
 *     summary: Create a new portfolio item
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 example: E-commerce Website
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *                 example: A full-stack e-commerce platform
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *                 example: https://example.com/image.jpg
 *               projectUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *                 example: https://example.com/project
 *               technologies:
 *                 type: string
 *                 maxLength: 500
 *                 nullable: true
 *                 example: React, Node.js, PostgreSQL
 *           example:
 *             title: "E-commerce Website"
 *             description: "A full-stack e-commerce platform built with React and Node.js"
 *             imageUrl: "https://example.com/project-image.jpg"
 *             projectUrl: "https://example.com/project"
 *             technologies: "React, Node.js, PostgreSQL"
 *     responses:
 *       201:
 *         description: Portfolio item created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, createItem);

/**
 * @swagger
 * /api/portfolio/{id}:
 *   put:
 *     summary: Update a portfolio item
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Portfolio item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               projectUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               technologies:
 *                 type: string
 *                 maxLength: 500
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Portfolio item updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - can only update own portfolio items
 *       404:
 *         description: Portfolio item not found
 */
router.put('/:id', authenticate, updateItem);

/**
 * @swagger
 * /api/portfolio/{id}:
 *   delete:
 *     summary: Delete a portfolio item
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Portfolio item ID
 *     responses:
 *       200:
 *         description: Portfolio item deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - can only delete own portfolio items
 *       404:
 *         description: Portfolio item not found
 */
router.delete('/:id', authenticate, deleteItem);

export default router;

