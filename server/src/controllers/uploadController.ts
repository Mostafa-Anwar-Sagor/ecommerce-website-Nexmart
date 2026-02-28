import { Response } from 'express';
import multer from 'multer';
import { AuthRequest } from '../middleware/auth';
import { ApiError, successResponse } from '../middleware/errorHandler';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';
import logger from '../utils/logger';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // 10MB, max 10 files
  fileFilter: (_, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = allowedTypes.test(file.originalname.toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

export const uploadImages = async (req: AuthRequest, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) throw ApiError.badRequest('No files uploaded');

  const folder = req.query.folder as string || 'products';

  const uploadPromises = files.map(async (file) => {
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    return uploadToCloudinary(base64, folder);
  });

  try {
    const results = await Promise.all(uploadPromises);
    return successResponse(res, results.map((r) => ({ url: r.url, publicId: r.publicId })), 'Images uploaded');
  } catch (err) {
    logger.error('Upload failed', { err });
    throw ApiError.internal('Failed to upload images');
  }
};

export const deleteImage = async (req: AuthRequest, res: Response) => {
  const { publicId } = req.body;
  if (!publicId) throw ApiError.badRequest('Public ID required');

  await deleteFromCloudinary(publicId);
  return successResponse(res, null, 'Image deleted');
};
