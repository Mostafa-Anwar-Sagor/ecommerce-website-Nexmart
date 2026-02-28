import { Router } from 'express';
import { createOrder, getOrders, getOrderById, confirmPayment, cancelOrder } from '../controllers/orderController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/confirm-payment', confirmPayment);
router.patch('/:id/cancel', cancelOrder);

export default router;
