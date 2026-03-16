import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getById, list } from '../controllers/contractController';

const router = Router();

router.get('/', authenticate, list);
router.get('/:id', authenticate, getById);

export default router;
