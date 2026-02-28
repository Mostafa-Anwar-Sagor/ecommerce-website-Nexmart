import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createPaymentIntent, confirmPayment, handleWebhook, getPaymentMethods } from '../controllers/paymentController';
import express from 'express';

const router = Router();

// Stripe webhook (raw body)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

router.use(authenticate);

router.get('/methods', getPaymentMethods);
router.post('/create-intent', createPaymentIntent);
router.post('/confirm', confirmPayment);

export default router;
