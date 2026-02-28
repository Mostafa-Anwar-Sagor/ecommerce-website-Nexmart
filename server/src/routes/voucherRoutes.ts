import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getVouchers, validateVoucher, createVoucher } from '../controllers/voucherController';

const router = Router();

router.get('/', getVouchers);
router.post('/validate', authenticate, validateVoucher);
router.post('/', authenticate, requireRole('SELLER', 'ADMIN'), createVoucher);

export default router;
