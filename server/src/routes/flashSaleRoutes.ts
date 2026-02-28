import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getActiveFlashSale, getAllFlashSales, createFlashSale } from '../controllers/flashSaleController';

const router = Router();

router.get('/', getAllFlashSales);
router.get('/active', getActiveFlashSale);
router.post('/', authenticate, requireRole('ADMIN'), createFlashSale);

export default router;
