import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';
import { successResponse } from '../middleware/errorHandler';

export const getCategories = async (req: Request, res: Response) => {
  const cacheKey = 'categories:all';
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return successResponse(res, cached);

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      children: {
        where: { isActive: true },
        select: { id: true, name: true, slug: true, icon: true, image: true },
      },
      _count: { select: { products: true } },
    },
    orderBy: { sortOrder: 'asc' },
  });

  await cacheSet(cacheKey, categories, 3600);
  return successResponse(res, categories);
};

export const getCategoryBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { page = '1', limit = '20', sortBy = 'soldCount', sortOrder = 'desc', minPrice, maxPrice } = req.query as Record<string, string>;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: { children: { select: { id: true, name: true, slug: true } } },
  });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

  const take = Math.min(parseInt(limit), 50);
  const skip = (parseInt(page) - 1) * take;

  const where: Record<string, unknown> = {
    isActive: true,
    OR: [
      { categoryId: category.id },
      { category: { parentId: category.id } },
    ],
  };

  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
      ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
    };
  }

  const orderByMap: Record<string, unknown> = {
    soldCount: { soldCount: sortOrder },
    price: { price: sortOrder },
    rating: { rating: sortOrder },
    createdAt: { createdAt: sortOrder },
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: orderByMap[sortBy] || { soldCount: 'desc' },
      skip,
      take,
      include: {
        shop: { select: { id: true, name: true, logo: true, isVerified: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return successResponse(res, {
    category,
    products,
    pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) },
  });
};
