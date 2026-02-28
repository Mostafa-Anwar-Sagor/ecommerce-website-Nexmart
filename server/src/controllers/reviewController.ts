import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError, successResponse } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export const getProductReviews = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { page = '1', limit = '10', rating } = req.query as Record<string, string>;

  const take = Math.min(parseInt(limit), 20);
  const skip = (parseInt(page) - 1) * take;

  const where: Record<string, unknown> = { productId };
  if (rating) where.rating = parseInt(rating);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.review.count({ where }),
  ]);

  // Rating distribution
  const distribution = await prisma.review.groupBy({
    by: ['rating'],
    where: { productId },
    _count: { rating: true },
  });

  return successResponse(res, {
    reviews,
    pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) },
    distribution: distribution.reduce((acc: Record<number, number>, d) => {
      acc[d.rating] = d._count.rating;
      return acc;
    }, {}),
  });
};

export const createReview = async (req: AuthRequest, res: Response) => {
  const { productId, rating, comment, images, variant } = req.body;

  if (!productId || !rating || !comment) throw ApiError.badRequest('Product, rating and comment are required');
  if (rating < 1 || rating > 5) throw ApiError.badRequest('Rating must be 1-5');

  // Check if user purchased this product
  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId: req.user!.id, paymentStatus: 'PAID' },
    },
  });

  const existingReview = await prisma.review.findFirst({ where: { productId, userId: req.user!.id } });
  if (existingReview) throw ApiError.conflict('You have already reviewed this product');

  const review = await prisma.review.create({
    data: {
      id: uuidv4(),
      productId,
      userId: req.user!.id,
      rating: parseInt(rating),
      comment,
      images: images || [],
      variant: variant || null,
      isVerifiedPurchase: !!purchased,
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

  return successResponse(res, review, 'Review submitted', 201);
};

export const updateReview = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { rating, comment, images } = req.body;

  const review = await prisma.review.findFirst({ where: { id, userId: req.user!.id } });
  if (!review) throw ApiError.notFound('Review not found');

  const updated = await prisma.review.update({
    where: { id },
    data: {
      ...(rating ? { rating: parseInt(rating) } : {}),
      ...(comment ? { comment } : {}),
      ...(images ? { images } : {}),
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  // Recalculate rating
  const stats = await prisma.review.aggregate({
    where: { productId: review.productId },
    _avg: { rating: true },
    _count: { id: true },
  });
  await prisma.product.update({
    where: { id: review.productId },
    data: { rating: Math.round((stats._avg.rating || 0) * 10) / 10, reviewCount: stats._count.id },
  });

  return successResponse(res, updated, 'Review updated');
};

export const deleteReview = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const review = await prisma.review.findFirst({ where: { id, userId: req.user!.id } });
  if (!review) throw ApiError.notFound('Review not found');

  await prisma.review.delete({ where: { id } });

  const stats = await prisma.review.aggregate({
    where: { productId: review.productId },
    _avg: { rating: true },
    _count: { id: true },
  });
  await prisma.product.update({
    where: { id: review.productId },
    data: { rating: Math.round((stats._avg.rating || 0) * 10) / 10, reviewCount: stats._count.id },
  });

  return successResponse(res, null, 'Review deleted');
};

export const markReviewHelpful = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw ApiError.notFound('Review not found');

  await prisma.review.update({ where: { id }, data: { helpfulCount: { increment: 1 } } });
  return successResponse(res, null, 'Marked as helpful');
};

export const addSellerReply = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { reply } = req.body;

  const review = await prisma.review.findUnique({ where: { id }, include: { product: { include: { shop: true } } } });
  if (!review) throw ApiError.notFound('Review not found');
  if (review.product.shop.userId !== req.user!.id) throw ApiError.forbidden('Not your product');

  const updated = await prisma.review.update({
    where: { id },
    data: { sellerReply: reply, sellerReplyAt: new Date() },
  });

  return successResponse(res, updated);
};
