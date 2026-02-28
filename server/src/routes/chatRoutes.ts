import { Router } from 'express';
import { getConversations, getMessages, createConversation } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:conversationId/messages', getMessages);

export default router;
