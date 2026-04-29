import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getChats, getChat, deleteChat } from '../controllers/chatController';

const router = Router();

router.get('/chats', authenticate, getChats);
router.get('/chats/:id', authenticate, getChat);
router.delete('/chats/:id', authenticate, deleteChat);

export default router;
