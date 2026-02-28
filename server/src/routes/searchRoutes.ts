import { Router } from 'express';
import { search, getShop } from '../controllers/searchController';

const router = Router();

router.get('/', search);
router.get('/shop/:idOrSlug', getShop);

export default router;
