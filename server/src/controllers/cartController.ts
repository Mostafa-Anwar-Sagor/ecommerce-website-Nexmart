import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError, successResponse } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export const getCart = async (req: AuthRequest, res: Response) => {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId: req.user!.id },
    include: {
      product: {
        include: {
          shop: { select: { id: true, name: true, logo: true, isVerified: true } },
          category: { select: { id: true, name: true, slug: true } },
          flashSaleProducts: {
            where: { flashSale: { startTime: { lte: new Date() }, endTime: { gte: new Date() }, isActive: true } },
            select: { salePrice: true, flashSale: { select: { endTime: true } } },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product.discountPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  return successResponse(res, { items: cartItems, subtotal, itemCount: cartItems.length });
};

export const addToCart = async (req: AuthRequest, res: Response) => {
  const { productId, quantity = 1, selectedVariant } = req.body;

  if (!productId) throw ApiError.badRequest('Product ID is required');

  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
    select: { id: true, stock: true, price: true, discountPrice: true, name: true },
  });

  if (!product) throw ApiError.notFound('Product not found');
  if (product.stock < quantity) throw ApiError.badRequest('Insufficient stock');

  const price = product.discountPrice ?? product.price;

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: req.user!.id, productId } },
  });

  let cartItem;
  if (existing) {
    const newQty = existing.quantity + quantity;
    if (product.stock < newQty) throw ApiError.badRequest('Insufficient stock');
    cartItem = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty, selectedVariant: selectedVariant ?? existing.selectedVariant },
      include: { product: { include: { shop: { select: { id: true, name: true } } } } },
    });
  } else {
    cartItem = await prisma.cartItem.create({
      data: {
        id: uuidv4(),
        userId: req.user!.id,
        productId,
        quantity,
        price,
        selectedVariant: selectedVariant ?? null,
      },
      include: { product: { include: { shop: { select: { id: true, name: true } } } } },
    });
  }

  return successResponse(res, cartItem, 'Added to cart', 201);
};

export const updateCartItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) throw ApiError.badRequest('Quantity must be at least 1');

  const item = await prisma.cartItem.findFirst({ where: { id, userId: req.user!.id }, include: { product: true } });
  if (!item) throw ApiError.notFound('Cart item not found');

  if (item.product.stock < quantity) throw ApiError.badRequest('Insufficient stock');

  const updated = await prisma.cartItem.update({
    where: { id },
    data: { quantity },
    include: { product: { include: { shop: { select: { id: true, name: true } } } } },
  });

  return successResponse(res, updated);
};

export const removeFromCart = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const item = await prisma.cartItem.findFirst({ where: { id, userId: req.user!.id } });
  if (!item) throw ApiError.notFound('Cart item not found');

  await prisma.cartItem.delete({ where: { id } });
  return successResponse(res, null, 'Removed from cart');
};

export const clearCart = async (req: AuthRequest, res: Response) => {
  await prisma.cartItem.deleteMany({ where: { userId: req.user!.id } });
  return successResponse(res, null, 'Cart cleared');
};

export const syncCart = async (req: AuthRequest, res: Response) => {
  const { items } = req.body; // [{ productId, quantity, selectedVariant }]
  if (!Array.isArray(items)) throw ApiError.badRequest('Items array required');

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId, isActive: true } });
    if (!product) continue;

    const price = product.discountPrice ?? product.price;
    await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.user!.id, productId: item.productId } },
      create: { id: uuidv4(), userId: req.user!.id, productId: item.productId, quantity: item.quantity, price, selectedVariant: item.selectedVariant ?? null },
      update: { quantity: item.quantity, selectedVariant: item.selectedVariant ?? null },
    });
  }

  return successResponse(res, null, 'Cart synced');
};
