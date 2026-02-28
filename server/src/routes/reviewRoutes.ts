import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  addSellerReply,
} from '../controllers/reviewController';

const router = Router();

router.get('/product/:productId', getProductReviews);
router.post('/', authenticate, createReview);
router.patch('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);
router.post('/:id/helpful', authenticate, markReviewHelpful);
router.post('/:id/reply', authenticate, requireRole('SELLER', 'ADMIN'), addSellerReply);

export default router;
