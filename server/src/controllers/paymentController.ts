import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError, successResponse } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import stripe from '../config/stripe';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

export const createPaymentIntent = async (req: AuthRequest, res: Response) => {
  const { amount, currency = 'usd', orderId } = req.body;

  if (!amount || amount <= 0) throw ApiError.badRequest('Valid amount is required');

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata: { userId: req.user!.id, orderId: orderId || '' },
    automatic_payment_methods: { enabled: true },
  });

  return successResponse(res, {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
};

export const confirmPayment = async (req: AuthRequest, res: Response) => {
  const { paymentIntentId, orderId } = req.body;

  if (!paymentIntentId || !orderId) throw ApiError.badRequest('paymentIntentId and orderId are required');

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status !== 'succeeded') {
    throw ApiError.badRequest(`Payment not completed. Status: ${paymentIntent.status}`);
  }

  const order = await prisma.order.update({
    where: { id: orderId, userId: req.user!.id },
    data: { paymentStatus: 'PAID', status: 'PROCESSING' },
    include: { items: true, user: { select: { id: true, name: true, email: true } } },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      id: uuidv4(),
      userId: req.user!.id,
      type: 'ORDER',
      title: '✅ Order Confirmed!',
      message: `Your order #${order.orderNumber?.slice(0, 8)} has been confirmed.`,
      link: `/orders/${order.id}`,
      data: { orderId: order.id },
    },
  });

  return successResponse(res, { order }, 'Payment confirmed');
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err) {
    logger.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Webhook signature failed' });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as { metadata: { orderId?: string; userId?: string }; id: string };
    if (pi.metadata.orderId) {
      await prisma.order.updateMany({
        where: { paymentIntentId: pi.id },
        data: { paymentStatus: 'PAID', status: 'PROCESSING' },
      });
    }
  }

  res.json({ received: true });
};

export const getPaymentMethods = async (req: AuthRequest, res: Response) => {
  // Return supported payment methods
  return successResponse(res, {
    methods: [
      { id: 'stripe', name: 'Credit/Debit Card', icon: '💳', description: 'Visa, Mastercard, Amex' },
      { id: 'paypal', name: 'PayPal', icon: '🅿️', description: 'Pay with PayPal', disabled: true },
      { id: 'cod', name: 'Cash on Delivery', icon: '💵', description: 'Pay when delivered' },
    ],
  });
};
