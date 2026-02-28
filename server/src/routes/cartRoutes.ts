import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart, syncCart } from '../controllers/cartController';

const router = Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/', addToCart);
router.post('/sync', syncCart);
router.patch('/:id', updateCartItem);
router.delete('/clear', clearCart);
router.delete('/:id', removeFromCart);

export default router;
