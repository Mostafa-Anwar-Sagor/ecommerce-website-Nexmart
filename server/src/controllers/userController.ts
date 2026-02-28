import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError, successResponse } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export const getWishlist = async (req: AuthRequest, res: Response) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user!.id },
    include: {
      product: {
        select: {
          id: true, name: true, slug: true, price: true, discountPrice: true,
          images: true, rating: true, soldCount: true, stock: true,
          shop: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return successResponse(res, items);
};

export const addToWishlist = async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;

  const product = await prisma.product.findUnique({ where: { id: productId, isActive: true } });
  if (!product) throw ApiError.notFound('Product not found');

  const existing = await prisma.wishlistItem.findFirst({ where: { userId: req.user!.id, productId } });
  if (existing) throw ApiError.conflict('Product already in wishlist');

  const item = await prisma.wishlistItem.create({
    data: { id: uuidv4(), userId: req.user!.id, productId },
    include: { product: { select: { id: true, name: true, slug: true, price: true, images: true } } },
  });

  return successResponse(res, item, 'Added to wishlist', 201);
};

export const removeFromWishlist = async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;

  await prisma.wishlistItem.deleteMany({ where: { userId: req.user!.id, productId } });
  return successResponse(res, null, 'Removed from wishlist');
};

export const getAddresses = async (req: AuthRequest, res: Response) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  return successResponse(res, addresses);
};

export const addAddress = async (req: AuthRequest, res: Response) => {
  const { fullName, phone, street, city, state, country, zipCode, label, isDefault } = req.body;

  if (!fullName || !phone || !street || !city) throw ApiError.badRequest('Full name, phone, street, and city are required');

  if (isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({
    data: { id: uuidv4(), userId: req.user!.id, fullName, phone, street, city, state: state || '', country: country || 'Bangladesh', zipCode, label, isDefault: isDefault || false },
  });
  return successResponse(res, address, 'Address added', 201);
};

export const updateAddress = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const address = await prisma.address.findFirst({ where: { id, userId: req.user!.id } });
  if (!address) throw ApiError.notFound('Address not found');

  const { fullName, phone, street, city, state, country, zipCode, label, isDefault } = req.body;

  if (isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
  }

  const updated = await prisma.address.update({
    where: { id },
    data: { ...(fullName && { fullName }), ...(phone && { phone }), ...(street && { street }), ...(city && { city }), ...(state !== undefined && { state }), ...(country && { country }), ...(zipCode !== undefined && { zipCode }), ...(label !== undefined && { label }), ...(isDefault !== undefined && { isDefault }) },
  });
  return successResponse(res, updated, 'Address updated');
};

export const deleteAddress = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await prisma.address.deleteMany({ where: { id, userId: req.user!.id } });
  return successResponse(res, null, 'Address deleted');
};
