/**
 * Example protected routes demonstrating role-based access
 * This file can be deleted or used as a reference
 */

import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Example: Route accessible to any authenticated user
router.get('/protected', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'This is a protected route',
    user: req.user,
  });
});

// Example: Route accessible only to CLIENT role
router.get('/client-only', authenticate, requireRole(UserRole.CLIENT), (req, res) => {
  res.json({
    success: true,
    message: 'This route is only accessible to clients',
    user: req.user,
  });
});

// Example: Route accessible only to FREELANCER role
router.get('/freelancer-only', authenticate, requireRole(UserRole.FREELANCER), (req, res) => {
  res.json({
    success: true,
    message: 'This route is only accessible to freelancers',
    user: req.user,
  });
});

// Example: Route accessible to both CLIENT and FREELANCER
router.get('/both-roles', authenticate, requireRole(UserRole.CLIENT, UserRole.FREELANCER), (req, res) => {
  res.json({
    success: true,
    message: 'This route is accessible to both clients and freelancers',
    user: req.user,
  });
});

export default router;

