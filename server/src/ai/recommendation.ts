import { prisma } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';
import logger from '../utils/logger';

export interface Recommendation {
  productId: string;
  score: number;
  reason: string;
}

export const getPersonalizedRecommendations = async (
  userId: string,
  limit = 10
): Promise<object[]> => {
  const cacheKey = `recommendations:${userId}:${limit}`;
  const cached = await cacheGet<object[]>(cacheKey);
  if (cached) return cached;

  try {
    // Get user's viewing history and purchase history
    const [viewHistory, purchaseHistory, wishlist] = await Promise.all([
      prisma.productView.findMany({
        where: { userId },
        orderBy: { viewedAt: 'desc' },
        take: 20,
        select: { productId: true, product: { select: { categoryId: true, tags: true } } },
      }),
      prisma.orderItem.findMany({
        where: { order: { userId, status: { in: ['DELIVERED', 'CONFIRMED'] } } },
        include: { product: { select: { categoryId: true, tags: true } } },
        take: 20,
      }),
      prisma.wishlistItem.findMany({
        where: { userId },
        include: { product: { select: { categoryId: true, tags: true } } },
        take: 10,
      }),
    ]);

    // Build interest profile
    const categoryCount = new Map<string, number>();
    const tagCount = new Map<string, number>();
    const seenProductIds = new Set<string>();

    const weights = [
      { items: purchaseHistory, weight: 3 },
      { items: wishlist, weight: 2 },
      { items: viewHistory, weight: 1 },
    ];

    for (const { items, weight } of weights) {
      for (const item of items) {
        seenProductIds.add(item.productId);
        if (item.product?.categoryId) {
          categoryCount.set(item.product.categoryId, (categoryCount.get(item.product.categoryId) || 0) + weight);
        }
        for (const tag of item.product?.tags || []) {
          tagCount.set(tag, (tagCount.get(tag) || 0) + weight);
        }
      }
    }

    // Top categories and tags
    const topCategories = [...categoryCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    const topTags = [...tagCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Fetch recommended products
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { notIn: [...seenProductIds] },
        OR: [
          ...(topCategories.length > 0 ? [{ categoryId: { in: topCategories } }] : []),
          ...(topTags.length > 0 ? [{ tags: { hasSome: topTags } }] : []),
        ],
      },
      orderBy: [{ rating: 'desc' }, { soldCount: 'desc' }],
      take: limit,
      select: {
        id: true, name: true, slug: true, price: true, discountPrice: true,
        images: true, rating: true, soldCount: true, tags: true,
        shop: { select: { name: true, logo: true } },
        category: { select: { name: true } },
      },
    });

    // Fallback to popular products if not enough
    let result = products;
    if (result.length < limit) {
      const popular = await prisma.product.findMany({
        where: {
          isActive: true,
          id: { notIn: [...seenProductIds, ...result.map((p) => p.id)] },
        },
        orderBy: [{ soldCount: 'desc' }, { rating: 'desc' }],
        take: limit - result.length,
        select: {
          id: true, name: true, slug: true, price: true, discountPrice: true,
          images: true, rating: true, soldCount: true, tags: true,
          shop: { select: { name: true, logo: true } },
          category: { select: { name: true } },
        },
      });
      result = [...result, ...popular];
    }

    await cacheSet(cacheKey, result, 1800); // cache 30 minutes
    return result;
  } catch (error) {
    logger.error('Recommendations error', { error });
    return [];
  }
};

export const getSimilarProducts = async (productId: string, limit = 6): Promise<object[]> => {
  const cacheKey = `similar:${productId}:${limit}`;
  const cached = await cacheGet<object[]>(cacheKey);
  if (cached) return cached;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { categoryId: true, tags: true, price: true, shopId: true },
  });

  if (!product) return [];

  const similar = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: productId },
      OR: [
        { categoryId: product.categoryId },
        { tags: { hasSome: product.tags } },
      ],
    },
    orderBy: [{ rating: 'desc' }, { soldCount: 'desc' }],
    take: limit,
    select: {
      id: true, name: true, slug: true, price: true, discountPrice: true,
      images: true, rating: true, soldCount: true,
      shop: { select: { name: true } },
    },
  });

  await cacheSet(cacheKey, similar, 3600);
  return similar;
};

export const getTrendingProducts = async (limit = 10): Promise<object[]> => {
  const cacheKey = `trending:${limit}`;
  const cached = await cacheGet<object[]>(cacheKey);
  if (cached) return cached;

  const trending = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ soldCount: 'desc' }, { rating: 'desc' }],
    take: limit,
    select: {
      id: true, name: true, slug: true, price: true, discountPrice: true,
      images: true, rating: true, soldCount: true,
      shop: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  await cacheSet(cacheKey, trending, 900); // cache 15 min
  return trending;
};
