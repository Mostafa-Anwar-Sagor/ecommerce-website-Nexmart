import { Router } from 'express';
import { upload, uploadImages, deleteImage } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.post('/', upload.array('images', 10), uploadImages);
router.delete('/', deleteImage);

export default router;
