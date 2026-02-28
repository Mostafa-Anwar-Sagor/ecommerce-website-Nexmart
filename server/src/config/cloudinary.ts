import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadToCloudinary = async (
  file: string,
  folder: string,
  options: object = {}
): Promise<{ url: string; publicId: string }> => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: `nexmart/${folder}`,
      ...options,
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    logger.error('Cloudinary upload failed', { error });
    throw new Error('Failed to upload image');
  }
};

export const deleteFromCloudinary = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error('Cloudinary delete failed', { error });
  }
};

export default cloudinary;
