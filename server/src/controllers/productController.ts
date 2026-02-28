import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError, successResponse } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { cacheGet, cacheSet, cacheDel } from '../config/redis';
import { v4 as uuidv4 } from 'uuid';

export const getProducts = async (req: Request, res: Response) => {
  const {
    page = '1', limit = '20', q, category, minPrice, maxPrice,
    sortBy = 'soldCount', sortOrder = 'desc', rating, freeShipping, hasDiscount,
  } = req.query as Record<string, string>;

  const take = Math.min(parseInt(limit), 50);
  const skip = (parseInt(page) - 1) * take;

  const where: Record<string, unknown> = { isActive: true };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { tags: { has: q.toLowerCase() } },
    ];
  }

  if (category) {
    where.category = { OR: [{ id: category }, { slug: category }] };
  }

  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
      ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
    };
  }

  if (rating) where.rating = { gte: parseFloat(rating) };
  if (freeShipping === 'true') where.freeShipping = true;
  if (hasDiscount === 'true') where.discountPrice = { not: null };

  const validSortFields: Record<string, unknown> = {
    soldCount: { soldCount: sortOrder },
    price: { price: sortOrder },
    rating: { rating: sortOrder },
    createdAt: { createdAt: sortOrder },
    name: { name: sortOrder },
  };

  const orderBy = validSortFields[sortBy] || { soldCount: 'desc' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true, name: true, slug: true, price: true, discountPrice: true,
        images: true, rating: true, reviewCount: true, soldCount: true,
        freeShipping: true, stock: true, tags: true,
        shop: { select: { id: true, name: true, logo: true, isVerified: true } },
        category: { select: { id: true, name: true, slug: true } },
        flashSaleProducts: {
          where: { flashSale: { startTime: { lte: new Date() }, endTime: { gte: new Date() } } },
          select: { salePrice: true, flashSale: { select: { endTime: true } } },
          take: 1,
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return successResponse(res, {
    products,
    pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) },
  });
};

export const getProductBySlug = async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      shop: {
        select: {
          id: true, name: true, slug: true, logo: true, rating: true, isVerified: true,
          totalSales: true, followerCount: true,
          _count: { select: { products: true } },
        },
      },
      category: true,
      flashSaleProducts: {
        where: { flashSale: { startTime: { lte: new Date() }, endTime: { gte: new Date() } } },
        include: { flashSale: true },
        take: 1,
      },
    },
  });

  if (!product || !product.isActive) throw ApiError.notFound('Product not found');

  // Track product view (fire and forget)
  if (req.user?.id) {
    prisma.productView.upsert({
      where: { productId_userId: { productId: product.id, userId: req.user.id } },
      create: { id: uuidv4(), productId: product.id, userId: req.user.id },
      update: { viewedAt: new Date() },
    }).catch(() => {});
  }

  // Update view count
  prisma.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return successResponse(res, product);
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  const {
    name, description, shortDescription, price, discountPrice, stock, images,
    categoryId, tags, specifications, variants, freeShipping, weight, dimensions,
  } = req.body;

  if (!name || !price || !categoryId || !images?.length) {
    throw ApiError.badRequest('Name, price, category, and at least one image are required');
  }

  const shop = await prisma.shop.findUnique({ where: { userId: req.user!.id } });
  if (!shop || shop.status !== 'ACTIVE') throw ApiError.forbidden('Active shop required to add products');

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

  const product = await prisma.product.create({
    data: {
      id: uuidv4(),
      name,
      slug,
      description,
      shortDescription,
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : null,
      stock: parseInt(stock),
      images,
      categoryId,
      shopId: shop.id,
      tags: tags || [],
      specifications: specifications || {},
      variants: variants || [],
      freeShipping: freeShipping || false,
      weight: weight ? parseFloat(weight) : null,
      dimensions: dimensions || null,
    },
    include: {
      category: true,
      shop: { select: { id: true, name: true, logo: true } },
    },
  });

  await cacheDel(`products:shop:${shop.id}`);
  return successResponse(res, product, 'Product created successfully', 201);
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const shop = await prisma.shop.findUnique({ where: { userId: req.user!.id } });
  if (!shop) throw ApiError.forbidden('Shop required');

  const product = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
  if (!product) throw ApiError.notFound('Product not found');

  const allowedFields = ['name', 'description', 'shortDescription', 'price', 'discountPrice', 'stock', 'images', 'tags', 'specifications', 'variants', 'freeShipping', 'isActive'];
  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = field === 'price' || field === 'discountPrice' || field === 'stock'
        ? field === 'stock' ? parseInt(req.body[field]) : parseFloat(req.body[field]) || null
        : req.body[field];
    }
  }

  const updated = await prisma.product.update({ where: { id }, data: updates, include: { category: true } });
  await cacheDel(`product:${product.slug}`, `products:shop:${shop.id}`);

  return successResponse(res, updated, 'Product updated successfully');
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const shop = await prisma.shop.findUnique({ where: { userId: req.user!.id } });
  if (!shop) throw ApiError.forbidden('Shop required');

  const product = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
  if (!product) throw ApiError.notFound('Product not found');

  await prisma.product.update({ where: { id }, data: { isActive: false } });
  await cacheDel(`product:${product.slug}`, `products:shop:${shop.id}`);

  return successResponse(res, null, 'Product deleted successfully');
};

export const getSellerProducts = async (req: AuthRequest, res: Response) => {
  const shop = await prisma.shop.findUnique({ where: { userId: req.user!.id } });
  if (!shop) throw ApiError.notFound('Shop not found');

  const { page = '1', limit = '20', q, isActive } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit), 50);
  const skip = (parseInt(page) - 1) * take;

  const where: Record<string, unknown> = { shopId: shop.id };
  if (q) where.name = { contains: q, mode: 'insensitive' };
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { category: true },
    }),
    prisma.product.count({ where }),
  ]);

  return successResponse(res, {
    products,
    pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) },
  });
};

export const getFlashSaleProducts = async (req: Request, res: Response) => {
  const now = new Date();

  const flashSale = await prisma.flashSale.findFirst({
    where: { startTime: { lte: now }, endTime: { gte: now }, isActive: true },
    include: {
      products: {
        where: { product: { isActive: true } },
        include: {
          product: {
            include: {
              shop: { select: { id: true, name: true, logo: true } },
              category: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { soldCount: 'desc' },
        take: 20,
      },
    },
  });

  // Return products array directly so client can use them easily
  const products = flashSale?.products?.map((fp) => ({
    ...fp.product,
    flashSalePrice: fp.salePrice,
    flashSaleEnds: flashSale.endTime,
    isFlashSale: true,
  })) || [];

  return successResponse(res, products);
};

export const getFeaturedProducts = async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: { soldCount: 'desc' },
    take: 12,
    select: {
      id: true, name: true, slug: true, price: true, discountPrice: true,
      images: true, rating: true, reviewCount: true, soldCount: true,
      freeShipping: true, stock: true, tags: true, isFeatured: true,
      shop: { select: { id: true, name: true, logo: true, isVerified: true } },
      category: { select: { id: true, name: true, slug: true } },
      flashSaleProducts: {
        where: { flashSale: { startTime: { lte: new Date() }, endTime: { gte: new Date() } } },
        select: { salePrice: true, flashSale: { select: { endTime: true } } },
        take: 1,
      },
    },
  });

  // If no featured products, return top-selling ones
  if (products.length === 0) {
    const fallback = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { soldCount: 'desc' },
      take: 12,
      select: {
        id: true, name: true, slug: true, price: true, discountPrice: true,
        images: true, rating: true, reviewCount: true, soldCount: true,
        freeShipping: true, stock: true, tags: true,
        shop: { select: { id: true, name: true, logo: true, isVerified: true } },
        category: { select: { id: true, name: true, slug: true } },
        flashSaleProducts: {
          where: { flashSale: { startTime: { lte: new Date() }, endTime: { gte: new Date() } } },
          select: { salePrice: true, flashSale: { select: { endTime: true } } },
          take: 1,
        },
      },
    });
    return successResponse(res, fallback);
  }

  return successResponse(res, products);
};

export const getRelatedProducts = async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({ where: { id }, select: { categoryId: true, id: true } });
  if (!product) throw ApiError.notFound('Product not found');

  const related = await prisma.product.findMany({
    where: { isActive: true, categoryId: product.categoryId, id: { not: product.id } },
    orderBy: { soldCount: 'desc' },
    take: 8,
    select: {
      id: true, name: true, slug: true, price: true, discountPrice: true,
      images: true, rating: true, reviewCount: true, soldCount: true,
      freeShipping: true, stock: true, tags: true,
      shop: { select: { id: true, name: true, logo: true, isVerified: true } },
      category: { select: { id: true, name: true, slug: true } },
      flashSaleProducts: {
        where: { flashSale: { startTime: { lte: new Date() }, endTime: { gte: new Date() } } },
        select: { salePrice: true, flashSale: { select: { endTime: true } } },
        take: 1,
      },
    },
  });

  return successResponse(res, related);
};

export const getCategories = async (req: Request, res: Response) => {
  const cacheKey = 'categories:all';
  const cached = await cacheGet(cacheKey);
  if (cached) return successResponse(res, cached);

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: { select: { id: true, name: true, slug: true, image: true } },
      _count: { select: { products: true } },
    },
    orderBy: { sortOrder: 'asc' },
  });

  await cacheSet(cacheKey, categories, 3600);
  return successResponse(res, categories);
};

export const getProductReviews = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { page = '1', limit = '10' } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit), 20);
  const skip = (parseInt(page) - 1) * take;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.review.count({ where: { productId } }),
  ]);

  return successResponse(res, {
    reviews,
    pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) },
  });
};

export const createReview = async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const { rating, comment, images } = req.body;

  if (!rating || rating < 1 || rating > 5) throw ApiError.badRequest('Rating must be between 1 and 5');

  // Check if user purchased this product
  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId: req.user!.id, status: { in: ['DELIVERED', 'CONFIRMED'] } },
    },
  });
  if (!purchased) throw ApiError.forbidden('You can only review products you have purchased');

  const existingReview = await prisma.review.findFirst({
    where: { productId, userId: req.user!.id },
  });
  if (existingReview) throw ApiError.conflict('You have already reviewed this product');

  const review = await prisma.review.create({
    data: {
      id: uuidv4(),
      productId,
      userId: req.user!.id,
      rating: parseInt(rating),
      comment,
      images: images || [],
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  // Update product rating
  const stats = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { id: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: Math.round((stats._avg.rating || 0) * 10) / 10,
      reviewCount: stats._count.id,
    },
  });

  return successResponse(res, review, 'Review submitted successfully', 201);
};
