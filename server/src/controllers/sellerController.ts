import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError, successResponse } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export const createShop = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.shop.findUnique({ where: { userId: req.user!.id } });
  if (existing) throw ApiError.conflict('You already have a shop application');

  const { name, shopType, description, logo, coverImage, phone, email, address } = req.body;
  if (!name) throw ApiError.badRequest('Shop name is required');

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

  // Shop is created with PENDING status — admin must approve before user becomes SELLER
  const shop = await prisma.shop.create({
    data: {
      id: uuidv4(),
      userId: req.user!.id,
      name,
      slug,
      shopType,
      description,
      logo,
      coverImage,
      phone,
      email,
      address,
      status: 'PENDING',
    },
  });

  return successResponse(res, shop, 'Shop application submitted! Awaiting admin approval.', 201);
};

// Buyer can check their own shop application status
export const getMyShopApplication = async (req: AuthRequest, res: Response) => {
  const shop = await prisma.shop.findUnique({ where: { userId: req.user!.id } });
  if (!shop) return successResponse(res, null, 'No application found');
  return successResponse(res, shop);
};

export const getMyShop = async (req: AuthRequest, res: Response) => {
  const shop = await prisma.shop.findUnique({
    where: { userId: req.user!.id },
    include: {
      _count: { select: { products: true } },
    },
  });
  if (!shop) throw ApiError.notFound('Shop not found');
  return successResponse(res, shop);
};

export const updateShop = async (req: AuthRequest, res: Response) => {
  const shop = await prisma.shop.findUnique({ where: { userId: req.user!.id } });
  if (!shop) throw ApiError.notFound('Shop not found');

  const allowed = ['name', 'description', 'logo', 'coverImage', 'phone', 'email', 'address'];
  const updates: Record<string, unknown> = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const updated = await prisma.shop.update({ where: { id: shop.id }, data: updates });
  return successResponse(res, updated, 'Shop updated successfully');
};

export const getSellerAnalytics = async (req: AuthRequest, res: Response) => {
  const shop = await prisma.shop.findUnique({ where: { userId: req.user!.id } });
  if (!shop) throw ApiError.notFound('Shop not found');

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalRevenue, monthlyRevenue, weeklyRevenue, totalOrders, topProducts, recentOrders] = await Promise.all([
    prisma.orderItem.aggregate({ where: { shopId: shop.id, order: { paymentStatus: 'PAID' } }, _sum: { price: true, quantity: true } }),
    prisma.orderItem.aggregate({ where: { shopId: shop.id, order: { paymentStatus: 'PAID', createdAt: { gte: thirtyDaysAgo } } }, _sum: { price: true } }),
    prisma.orderItem.aggregate({ where: { shopId: shop.id, order: { paymentStatus: 'PAID', createdAt: { gte: sevenDaysAgo } } }, _sum: { price: true } }),
    prisma.order.count({ where: { items: { some: { shopId: shop.id } } } }),
    prisma.product.findMany({ where: { shopId: shop.id }, orderBy: { soldCount: 'desc' }, take: 5, select: { id: true, name: true, soldCount: true, price: true, images: true, rating: true } }),
    prisma.order.findMany({ where: { items: { some: { shopId: shop.id } } }, orderBy: { createdAt: 'desc' }, take: 5, include: { items: { where: { shopId: shop.id } }, user: { select: { name: true, avatar: true } } } }),
  ]);

  return successResponse(res, {
    overview: {
      totalRevenue: totalRevenue._sum.price || 0,
      totalSold: totalRevenue._sum.quantity || 0,
      monthlyRevenue: monthlyRevenue._sum.price || 0,
      weeklyRevenue: weeklyRevenue._sum.price || 0,
      totalOrders,
      shopRating: shop.rating,
    },
    topProducts,
    recentOrders,
  });
};

export const getSellerOrders = async (req: AuthRequest, res: Response) => {
  const shop = await prisma.shop.findUnique({ where: { userId: req.user!.id } });
  if (!shop) throw ApiError.notFound('Shop not found');

  const { page = '1', limit = '20', status } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit), 50);
  const skip = (parseInt(page) - 1) * take;

  const where: Record<string, unknown> = { items: { some: { shopId: shop.id } } };
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        items: { where: { shopId: shop.id }, include: { product: { select: { name: true, images: true } } } },
        user: { select: { id: true, name: true, avatar: true } },
        address: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return successResponse(res, { orders, pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) } });
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, trackingNumber, carrier, description, estimatedDelivery, lastLocation } = req.body;

  const shop = await prisma.shop.findUnique({ where: { userId: req.user!.id } });
  if (!shop) throw ApiError.notFound('Shop not found');

  const order = await prisma.order.findFirst({
    where: { id, items: { some: { shopId: shop.id } } },
  });
  if (!order) throw ApiError.notFound('Order not found');

  const updateData: Record<string, unknown> = { status };
  if (status === 'DELIVERED') updateData.deliveredAt = new Date();

  await prisma.order.update({ where: { id }, data: updateData });

  // Always create a tracking event on status change
  await prisma.tracking.create({
    data: {
      id: uuidv4(),
      orderId: id,
      status,
      trackingNumber: trackingNumber || undefined,
      carrier: carrier || 'Standard Delivery',
      description: description || `Order status updated to ${status}`,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
      lastLocation: lastLocation || undefined,
    },
  });

  return successResponse(res, null, 'Order status updated');
};

export const getOrderTracking = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const shop = await prisma.shop.findUnique({ where: { userId: req.user!.id } });
  if (!shop) throw ApiError.notFound('Shop not found');

  const order = await prisma.order.findFirst({
    where: { id, items: { some: { shopId: shop.id } } },
    include: {
      tracking: { orderBy: { createdAt: 'desc' } },
      user: { select: { id: true, name: true, email: true, avatar: true } },
      address: true,
      items: {
        where: { shopId: shop.id },
        include: { product: { select: { name: true, images: true } } },
      },
    },
  });
  if (!order) throw ApiError.notFound('Order not found');

  return successResponse(res, order);
};

export const addTrackingUpdate = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, trackingNumber, carrier, description, estimatedDelivery, lastLocation } = req.body;

  if (!status) throw ApiError.badRequest('Status is required');

  const shop = await prisma.shop.findUnique({ where: { userId: req.user!.id } });
  if (!shop) throw ApiError.notFound('Shop not found');

  const order = await prisma.order.findFirst({
    where: { id, items: { some: { shopId: shop.id } } },
  });
  if (!order) throw ApiError.notFound('Order not found');

  const tracking = await prisma.tracking.create({
    data: {
      id: uuidv4(),
      orderId: id,
      status,
      trackingNumber: trackingNumber || undefined,
      carrier: carrier || 'Standard Delivery',
      description: description || `Package status: ${status}`,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
      lastLocation: lastLocation || undefined,
    },
  });

  // Update order status to match latest tracking event
  await prisma.order.update({ where: { id }, data: { status } });

  return successResponse(res, tracking, 'Tracking event added', 201);
};

export const getShippingOverview = async (req: AuthRequest, res: Response) => {
  const shop = await prisma.shop.findUnique({ where: { userId: req.user!.id } });
  if (!shop) throw ApiError.notFound('Shop not found');

  const { status } = req.query as Record<string, string>;

  const where: Record<string, unknown> = {
    items: { some: { shopId: shop.id } },
  };
  if (status) where.status = status;

  const [orders, stats] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        tracking: { orderBy: { createdAt: 'desc' }, take: 1 },
        user: { select: { id: true, name: true, avatar: true } },
        address: true,
        items: {
          where: { shopId: shop.id },
          include: { product: { select: { name: true, images: true } } },
        },
      },
    }),
    prisma.order.groupBy({
      by: ['status'],
      where: { items: { some: { shopId: shop.id } } },
      _count: { _all: true },
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const s of stats) statusCounts[s.status] = s._count._all;

  return successResponse(res, { orders, statusCounts });
};
