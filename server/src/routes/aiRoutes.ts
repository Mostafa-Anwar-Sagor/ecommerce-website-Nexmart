import { Router } from 'express';
import {
  chat,
  generateDescription,
  reviewSummary,
  fakeReviewDetection,
  recommendations,
  similarProducts,
  trending,
  imageSearch,
  pricePrediction,
  searchSuggestions,
  compareProductsController,
  smartSearchController,
} from '../controllers/aiController';
import { authenticate, optionalAuth, requireSeller } from '../middleware/auth';

const router = Router();

router.post('/chat', optionalAuth, chat);
router.post('/generate-description', authenticate, requireSeller, generateDescription);
router.get('/review-summary/:productId', reviewSummary);
router.post('/detect-fake-review', authenticate, fakeReviewDetection);
router.get('/recommendations', authenticate, recommendations);
router.get('/similar/:productId', optionalAuth, similarProducts);
router.get('/trending', trending);
router.post('/image-search', optionalAuth, imageSearch);
router.get('/price-prediction/:productId', pricePrediction);
router.get('/search-suggestions', optionalAuth, searchSuggestions);
router.post('/compare', optionalAuth, compareProductsController);
router.get('/smart-search', optionalAuth, smartSearchController);

export default router;
