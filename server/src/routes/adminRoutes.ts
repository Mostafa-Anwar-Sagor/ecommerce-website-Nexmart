import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { prisma } from '../config/database';
import { successResponse, ApiError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate, requireAdmin);

// ── Stats Overview ────────────────────────────────────────────────────────────
router.get('/stats', async (_, res) => {
  const [users, activeProducts, orders, revenue, shops, pendingOrders, sellers] = await Promise.all([
    prisma.user.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { total: true } }),
    prisma.shop.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { role: 'SELLER' } }),
  ]);
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  });
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return successResponse(res, {
    users, activeProducts, orders, revenue: revenue._sum.total || 0,
    shops, pendingOrders, sellers, recentOrders, recentUsers,
  });
});

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  const { page = '1', limit = '20', search = '' } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit), 100);
  const skip = (parseInt(page) - 1) * take;
  const where: any = search
    ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }
    : {};
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, isVerified: true, totalSpent: true, loyaltyPoints: true, createdAt: true, _count: { select: { orders: true } } },
    }),
    prisma.user.count({ where }),
  ]);
  return successResponse(res, { users, pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) } });
});

router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['BUYER', 'SELLER', 'ADMIN'].includes(role)) throw ApiError.badRequest('Invalid role');
  const user = await prisma.user.update({
    where: { id: req.params.id }, data: { role },
    select: { id: true, name: true, email: true, role: true },
  });
  return successResponse(res, user, 'User role updated');
});

// ── Products ──────────────────────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  const { page = '1', limit = '20', search = '' } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit), 100);
  const skip = (parseInt(page) - 1) * take;
  const where: any = search ? { name: { contains: search, mode: 'insensitive' } } : {};
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, price: true, stock: true, isActive: true, isFeatured: true,
        rating: true, soldCount: true, images: true, createdAt: true,
        shop: { select: { name: true } }, category: { select: { name: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);
  return successResponse(res, { products, pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) } });
});

router.patch('/products/:id/toggle', async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw ApiError.notFound('Product not found');
  const updated = await prisma.product.update({ where: { id: req.params.id }, data: { isActive: !product.isActive } });
  return successResponse(res, { id: updated.id, isActive: updated.isActive }, 'Product updated');
});

router.delete('/products/:id', async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  return successResponse(res, null, 'Product deleted');
});

// ── Orders ────────────────────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  const { page = '1', limit = '20', status = '' } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit), 100);
  const skip = (parseInt(page) - 1) * take;
  const where: any = status ? { status } : {};
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: { select: { name: true, images: true } } } },
      },
    }),
    prisma.order.count({ where }),
  ]);
  return successResponse(res, { orders, pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) } });
});

router.patch('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const valid = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
  if (!valid.includes(status)) throw ApiError.badRequest('Invalid status');
  const order = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
  return successResponse(res, { id: order.id, status: order.status }, 'Order status updated');
});

// ── Shops ─────────────────────────────────────────────────────────────────────
router.get('/shops', async (req, res) => {
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit), 100);
  const skip = (parseInt(page) - 1) * take;
  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      skip, take, orderBy: { createdAt: 'desc' },
      include: { seller: { select: { name: true, email: true } }, _count: { select: { products: true } } },
    }),
    prisma.shop.count(),
  ]);
  return successResponse(res, { shops, pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) } });
});

router.patch('/shops/:id/status', async (req, res) => {
  const { status } = req.body;
  const valid = ['PENDING', 'ACTIVE', 'SUSPENDED', 'BANNED'];
  if (!valid.includes(status)) throw ApiError.badRequest('Invalid status');
  const shop = await prisma.shop.update({ where: { id: req.params.id }, data: { status } });
  return successResponse(res, { id: shop.id, status: shop.status }, 'Shop status updated');
});

export default router;
