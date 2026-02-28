import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError, successResponse } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export const getVouchers = async (req: Request, res: Response) => {
  const now = new Date();
  const vouchers = await prisma.voucher.findMany({
    where: { isActive: true, expiresAt: { gte: now } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return successResponse(res, { vouchers });
};

export const validateVoucher = async (req: AuthRequest, res: Response) => {
  const { code, orderAmount } = req.body;
  if (!code) throw ApiError.badRequest('Voucher code is required');

  const now = new Date();
  const voucher = await prisma.voucher.findFirst({
    where: { code: code.toUpperCase(), isActive: true, expiresAt: { gte: now } },
  });

  if (!voucher) throw ApiError.notFound('Invalid or expired voucher');
  if (voucher.usedCount >= voucher.maxUses) throw ApiError.badRequest('This voucher has reached its usage limit');

  const amount = parseFloat(orderAmount) || 0;
  if (amount < voucher.minOrderAmount) {
    throw ApiError.badRequest(`Minimum order amount is $${voucher.minOrderAmount} for this voucher`);
  }

  const discount = voucher.discountType === 'PERCENTAGE'
    ? Math.min((amount * voucher.discountValue) / 100, voucher.maxDiscount || Infinity)
    : voucher.discountValue;

  return successResponse(res, {
    voucher: {
      id: voucher.id,
      code: voucher.code,
      title: voucher.title,
      description: voucher.description,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      discount: Math.round(discount * 100) / 100,
    },
  });
};

export const createVoucher = async (req: AuthRequest, res: Response) => {
  const { code, title, description, discountType, discountValue, minOrderAmount, maxDiscount, maxUses, expiresAt } = req.body;

  if (!code || !discountType || !discountValue || !expiresAt) {
    throw ApiError.badRequest('Code, discount type, value and expiry are required');
  }

  const shop = await prisma.shop.findUnique({ where: { userId: req.user!.id } });

  const voucher = await prisma.voucher.create({
    data: {
      id: uuidv4(),
      code: code.toUpperCase(),
      title,
      description,
      discountType,
      discountValue: parseFloat(discountValue),
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      maxUses: parseInt(maxUses) || 1000,
      expiresAt: new Date(expiresAt),
      shopId: shop?.id,
      categoryIds: [],
    },
  });

  return successResponse(res, voucher, 'Voucher created', 201);
};
