import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError, successResponse } from '../middleware/errorHandler';
import { prisma } from '../config/database';

export const getConversations = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { id: userId } } },
    include: {
      participants: { select: { id: true, name: true, avatar: true } },
      shop: { select: { id: true, name: true, logo: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { select: { id: true, name: true } } } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return successResponse(res, conversations);
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  const { conversationId } = req.params;
  const { page = '1', limit = '30' } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit), 50);
  const skip = (parseInt(page) - 1) * take;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, participants: { some: { id: req.user!.id } } },
  });
  if (!conversation) throw ApiError.notFound('Conversation not found or access denied');

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: req.user!.id }, isRead: false },
    data: { isRead: true },
  });

  return successResponse(res, {
    messages: messages.reverse(),
    pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) },
  });
};

export const createConversation = async (req: AuthRequest, res: Response) => {
  const { shopId, productId } = req.body;
  if (!shopId) throw ApiError.badRequest('Shop ID required');

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw ApiError.notFound('Shop not found');

  if (shop.userId === req.user!.id) throw ApiError.badRequest('You cannot message your own shop');

  const existing = await prisma.conversation.findFirst({
    where: {
      shopId,
      AND: [
        { participants: { some: { id: req.user!.id } } },
        { participants: { some: { id: shop.userId } } },
      ],
    },
  });

  if (existing) return successResponse(res, existing);

  const conversation = await prisma.conversation.create({
    data: {
      shopId,
      productId,
      participants: { connect: [{ id: req.user!.id }, { id: shop.userId }] },
    },
    include: {
      participants: { select: { id: true, name: true, avatar: true } },
      shop: { select: { id: true, name: true, logo: true } },
    },
  });

  return successResponse(res, conversation, 'Conversation started', 201);
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  const { conversationId } = req.params;
  const { content, type = 'TEXT', imageUrl, productRefId } = req.body;

  if (!content && !imageUrl) throw ApiError.badRequest('Message content or image required');

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, participants: { some: { id: req.user!.id } } },
  });
  if (!conversation) throw ApiError.notFound('Conversation not found');

  const message = await prisma.message.create({
    data: { conversationId, senderId: req.user!.id, content: content || '', type, imageUrl, productRefId },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  });

  await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

  return successResponse(res, message, 'Message sent', 201);
};
