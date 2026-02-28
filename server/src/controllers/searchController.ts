import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { successResponse } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';

export const search = async (req: Request, res: Response) => {
  const { q = '', page = '1', limit = '20', category, minPrice, maxPrice, sortBy = 'relevance', rating, freeShipping } = req.query as Record<string, string>;

  const take = Math.min(parseInt(limit), 50);
  const skip = (parseInt(page) - 1) * take;

  const where: Record<string, unknown> = {
    isActive: true,
    OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { tags: { has: q.toLowerCase() } },
      { shop: { name: { contains: q, mode: 'insensitive' } } },
    ],
  };

  if (category) where.category = { OR: [{ id: category }, { slug: category }] };
  if (minPrice || maxPrice) where.price = { ...(minPrice ? { gte: parseFloat(minPrice) } : {}), ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}) };
  if (rating) where.rating = { gte: parseFloat(rating) };
  if (freeShipping === 'true') where.freeShipping = true;

  const orderByMap: Record<string, object> = {
    relevance: { soldCount: 'desc' },
    price_asc: { price: 'asc' },
    price_desc: { price: 'desc' },
    rating: { rating: 'desc' },
    newest: { createdAt: 'desc' },
  };
  const orderBy = orderByMap[sortBy] || { soldCount: 'desc' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true, name: true, slug: true, price: true, discountPrice: true,
        images: true, rating: true, reviewCount: true, soldCount: true, freeShipping: true, stock: true,
        shop: { select: { id: true, name: true, logo: true, isVerified: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return successResponse(res, {
    products,
    query: q,
    pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) },
  });
};

export const getShop = async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;

  const shop = await prisma.shop.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], status: 'ACTIVE' },
    include: {
      _count: { select: { products: true } },
    },
  });

  if (!shop) {
    const { ApiError } = await import('../middleware/errorHandler');
    throw ApiError.notFound('Shop not found');
  }

  const products = await prisma.product.findMany({
    where: { shopId: shop.id, isActive: true },
    orderBy: { soldCount: 'desc' },
    take: 20,
    select: {
      id: true, name: true, slug: true, price: true, discountPrice: true,
      images: true, rating: true, soldCount: true, reviewCount: true,
    },
  });

  return successResponse(res, { shop, products });
};
