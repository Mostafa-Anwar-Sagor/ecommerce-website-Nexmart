import { Router } from 'express';
import {
  getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct,
  getSellerProducts, getFlashSaleProducts, getFeaturedProducts, getRelatedProducts,
  getCategories, getProductReviews, createReview,
} from '../controllers/productController';
import { authenticate, optionalAuth, requireSeller } from '../middleware/auth';

const router = Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/flash-sale', getFlashSaleProducts);
router.get('/categories', getCategories);
router.get('/seller/my-products', authenticate, requireSeller, getSellerProducts);
router.get('/:slug', optionalAuth, getProductBySlug);
router.get('/:id/related', getRelatedProducts);
router.post('/', authenticate, requireSeller, createProduct);
router.patch('/:id', authenticate, requireSeller, updateProduct);
router.delete('/:id', authenticate, requireSeller, deleteProduct);

router.get('/:productId/reviews', getProductReviews);
router.post('/:productId/reviews', authenticate, createReview);

export default router;
