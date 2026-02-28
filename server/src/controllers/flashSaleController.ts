import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError, successResponse } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export const getActiveFlashSale = async (req: Request, res: Response) => {
  const now = new Date();

  const flashSale = await prisma.flashSale.findFirst({
    where: { startTime: { lte: now }, endTime: { gte: now }, isActive: true },
    include: {
      products: {
        where: { product: { isActive: true } },
        include: {
          product: {
            include: {
              shop: { select: { id: true, name: true, logo: true, isVerified: true } },
              category: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { soldCount: 'desc' },
        take: 24,
      },
    },
  });

  return successResponse(res, flashSale);
};

export const getAllFlashSales = async (req: Request, res: Response) => {
  const flashSales = await prisma.flashSale.findMany({
    orderBy: { startTime: 'desc' },
    take: 10,
    include: {
      _count: { select: { products: true } },
    },
  });
  return successResponse(res, { flashSales });
};

export const createFlashSale = async (req: AuthRequest, res: Response) => {
  const { title, startTime, endTime, banner, products } = req.body;

  if (!title || !startTime || !endTime) throw ApiError.badRequest('Title, start time and end time are required');

  const flashSale = await prisma.flashSale.create({
    data: {
      id: uuidv4(),
      title,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      banner,
      isActive: true,
    },
  });

  if (products?.length) {
    for (const p of products) {
      const product = await prisma.product.findUnique({ where: { id: p.productId }, include: { shop: true } });
      if (!product) continue;

      await prisma.flashSaleProduct.create({
        data: {
          id: uuidv4(),
          flashSaleId: flashSale.id,
          productId: p.productId,
          shopId: product.shopId,
          salePrice: parseFloat(p.salePrice),
          originalPrice: product.price,
          discountPercent: Math.round(((product.price - parseFloat(p.salePrice)) / product.price) * 100),
          stock: parseInt(p.stock) || product.stock,
        },
      });
    }
  }

  return successResponse(res, flashSale, 'Flash sale created', 201);
};
