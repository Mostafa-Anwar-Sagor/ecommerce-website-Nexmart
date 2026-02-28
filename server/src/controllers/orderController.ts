import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError, successResponse } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import stripe from '../config/stripe';

export const createOrder = async (req: AuthRequest, res: Response) => {
  const { items, addressId, voucherCode, paymentMethod = 'STRIPE' } = req.body;

  if (!items?.length) throw ApiError.badRequest('Order items required');
  if (!addressId) throw ApiError.badRequest('Delivery address required');

  const address = await prisma.address.findFirst({ where: { id: addressId, userId: req.user!.id } });
  if (!address) throw ApiError.badRequest('Invalid address');

  // Fetch products and validate stock
  const productIds = items.map((i: { productId: string }) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: { shop: true },
  });

  if (products.length !== productIds.length) throw ApiError.badRequest('Some products are unavailable');

  const productMap = new Map(products.map((p) => [p.id, p]));
  let subtotal = 0;
  const orderItems: Array<{ productId: string; quantity: number; price: number; shopId: string; productName: string; productImage: string }> = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) continue;

    if (product.stock < item.quantity) {
      throw ApiError.badRequest(`Insufficient stock for "${product.name}"`);
    }

    const price = product.discountPrice ?? product.price;
    subtotal += price * item.quantity;
    orderItems.push({
      productId: product.id,
      quantity: item.quantity,
      price,
      shopId: product.shopId,
      productName: product.name,
      productImage: product.images[0] || '',
    });
  }

  // Apply voucher
  let discount = 0;
  let voucherId: string | null = null;
  if (voucherCode) {
    const voucher = await prisma.voucher.findFirst({
      where: { code: voucherCode, isActive: true, expiresAt: { gte: new Date() } },
    });
    if (voucher) {
      if (subtotal < voucher.minOrderAmount) {
        throw ApiError.badRequest(`Minimum order amount for this voucher is $${voucher.minOrderAmount}`);
      }
      discount = voucher.discountType === 'PERCENTAGE'
        ? Math.min((subtotal * voucher.discountValue) / 100, voucher.maxDiscount || Infinity)
        : voucher.discountValue;
      voucherId = voucher.id;
    }
  }

  const shippingFee = subtotal >= 30 ? 0 : 5.99;
  const total = Math.max(0, subtotal - discount + shippingFee);

  let paymentIntentId: string | null = null;
  let clientSecret: string | null = null;

  // Only create Stripe PaymentIntent for card payments
  if (paymentMethod !== 'COD') {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'usd',
      metadata: { userId: req.user!.id },
    });
    paymentIntentId = paymentIntent.id;
    clientSecret = paymentIntent.client_secret;
  }

  const orderId = uuidv4();
  const order = await prisma.order.create({
    data: {
      id: orderId,
      userId: req.user!.id,
      addressId,
      subtotal,
      discount,
      shippingFee,
      total,
      voucherId,
      paymentMethod,
      paymentIntentId,
      status: paymentMethod === 'COD' ? 'PROCESSING' : 'PENDING',
      items: {
        create: orderItems.map((item) => ({
          id: uuidv4(),
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          shopId: item.shopId,
          productName: item.productName,
          productImage: item.productImage,
        })),
      },
    },
    include: {
      items: { include: { product: { select: { name: true, images: true } } } },
      address: true,
    },
  });

  // Create initial tracking event — "Order Placed"
  await prisma.tracking.create({
    data: {
      id: uuidv4(),
      orderId,
      status: paymentMethod === 'COD' ? 'PROCESSING' : 'PENDING',
      carrier: 'NexMart',
      description: paymentMethod === 'COD'
        ? 'Order placed successfully. Cash on Delivery — preparing your order.'
        : 'Order placed successfully. Awaiting payment confirmation.',
    },
  });

  // Decrement stock
  try {
    await Promise.all(orderItems.map(item =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } },
      })
    ));
  } catch (err) {
    console.error('Failed to update stock for order', orderId, err);
  }

  // Send notification for COD orders
  if (paymentMethod === 'COD') {
    await prisma.notification.create({
      data: {
        id: uuidv4(),
        userId: req.user!.id,
        type: 'ORDER',
        title: 'Order Placed (COD)',
        message: `Your order #${orderId.slice(0, 8)} has been placed. Pay on delivery: $${total.toFixed(2)}`,
        data: JSON.stringify({ orderId }),
      },
    });
  }

  return successResponse(res, {
    order,
    clientSecret,
    paymentMethod,
  }, 'Order created', 201);
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10', status } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit), 20);
  const skip = (parseInt(page) - 1) * take;

  const where: Record<string, unknown> = { userId: req.user!.id };
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        items: {
          include: { product: { select: { id: true, name: true, images: true, slug: true } } },
          take: 3,
        },
        address: true,
        tracking: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return successResponse(res, {
    orders,
    pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) },
  });
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const order = await prisma.order.findFirst({
    where: { id, userId: req.user!.id },
    include: {
      items: { include: { product: true } },
      address: true,
      tracking: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!order) throw ApiError.notFound('Order not found');
  return successResponse(res, order);
};

export const confirmPayment = async (req: AuthRequest, res: Response) => {
  const { orderId, paymentIntentId } = req.body;

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status !== 'succeeded') throw ApiError.badRequest('Payment not completed');

  const order = await prisma.order.update({
    where: { id: orderId, userId: req.user!.id },
    data: { paymentStatus: 'PAID', status: 'PROCESSING' },
    include: { items: true },
  });

  // Create tracking event for payment confirmation
  await prisma.tracking.create({
    data: {
      id: uuidv4(),
      orderId,
      status: 'PROCESSING',
      carrier: 'NexMart',
      description: 'Payment confirmed. Your order is now being processed.',
    },
  });

  // Notify seller
  await prisma.notification.create({
    data: {
      id: uuidv4(),
      userId: req.user!.id,
      type: 'ORDER',
      title: 'Order Confirmed',
      message: `Your order #${order.id.slice(0, 8)} has been confirmed and is being processed.`,
      data: JSON.stringify({ orderId: order.id }),
    },
  });

  return successResponse(res, order, 'Payment confirmed');
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const order = await prisma.order.findFirst({
    where: { id, userId: req.user!.id },
    include: { items: true },
  });

  if (!order) throw ApiError.notFound('Order not found');
  if (!['PENDING', 'PROCESSING'].includes(order.status)) {
    throw ApiError.badRequest('Order cannot be cancelled at this stage');
  }

  await prisma.order.update({ where: { id }, data: { status: 'CANCELLED' } });

  // Restore stock
  try {
    await Promise.all(order.items.map(item =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity }, soldCount: { decrement: item.quantity } },
      })
    ));
  } catch (err) {
    console.error('Failed to restore stock for cancelled order', id, err);
  }

  return successResponse(res, null, 'Order cancelled successfully');
};
