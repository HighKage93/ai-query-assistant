import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { handleQuery } from '../controllers/queryController';

const router = Router();

router.post('/query', authenticate, handleQuery);

export default router;
