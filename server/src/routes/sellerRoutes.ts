import { Router } from 'express';
import {
  createShop, getMyShop, updateShop, getSellerAnalytics,
  getSellerOrders, updateOrderStatus, getOrderTracking,
  addTrackingUpdate, getShippingOverview,
} from '../controllers/sellerController';
import { authenticate, requireSeller } from '../middleware/auth';

const router = Router();

router.post('/shop', authenticate, createShop);
router.get('/shop', authenticate, requireSeller, getMyShop);
router.patch('/shop', authenticate, requireSeller, updateShop);
router.get('/analytics', authenticate, requireSeller, getSellerAnalytics);
router.get('/orders', authenticate, requireSeller, getSellerOrders);
router.patch('/orders/:id/status', authenticate, requireSeller, updateOrderStatus);
router.get('/orders/:id/tracking', authenticate, requireSeller, getOrderTracking);
router.post('/orders/:id/tracking', authenticate, requireSeller, addTrackingUpdate);
router.get('/shipping', authenticate, requireSeller, getShippingOverview);

export default router;
