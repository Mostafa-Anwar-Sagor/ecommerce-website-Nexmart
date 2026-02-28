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
        include: {
          shop: { select: { id: true, name: true, logo: true, isVerified: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return successResponse(res, { items, total: items.length });
};

export const addToWishlist = async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;

  const product = await prisma.product.findUnique({ where: { id: productId, isActive: true } });
  if (!product) throw ApiError.notFound('Product not found');

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: req.user!.id, productId } },
  });
  if (existing) throw ApiError.conflict('Already in wishlist');

  const item = await prisma.wishlistItem.create({
    data: { id: uuidv4(), userId: req.user!.id, productId },
    include: { product: { select: { id: true, name: true, images: true, price: true } } },
  });

  // Increment wishlist count
  await prisma.product.update({ where: { id: productId }, data: { wishlistCount: { increment: 1 } } });

  return successResponse(res, item, 'Added to wishlist', 201);
};

export const removeFromWishlist = async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;

  const item = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: req.user!.id, productId } },
  });
  if (!item) throw ApiError.notFound('Not in wishlist');

  await prisma.wishlistItem.delete({ where: { id: item.id } });
  await prisma.product.update({ where: { id: productId }, data: { wishlistCount: { decrement: 1 } } }).catch(() => {});

  return successResponse(res, null, 'Removed from wishlist');
};

export const checkWishlist = async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const item = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: req.user!.id, productId } },
  });
  return successResponse(res, { inWishlist: !!item });
};
