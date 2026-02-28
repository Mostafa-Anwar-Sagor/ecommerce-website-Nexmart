import { Router } from 'express';
import {
  register,
  login,
  refreshTokens,
  logout,
  getProfile,
  updateProfile,
  googleAuth,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshTokens);
router.post('/logout', logout);
router.post('/google', googleAuth);

router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);

export default router;
