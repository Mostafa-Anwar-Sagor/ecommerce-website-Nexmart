import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getWishlist, addToWishlist, removeFromWishlist, checkWishlist } from '../controllers/wishlistController';

const router = Router();

router.use(authenticate);

router.get('/', getWishlist);
router.get('/check/:productId', checkWishlist);
router.post('/:productId', addToWishlist);
router.delete('/:productId', removeFromWishlist);

export default router;
