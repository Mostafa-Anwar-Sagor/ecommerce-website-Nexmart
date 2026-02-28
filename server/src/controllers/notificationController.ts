import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { successResponse } from '../middleware/errorHandler';
import { prisma } from '../config/database';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit), 50);
  const skip = (parseInt(page) - 1) * take;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.notification.count({ where: { userId: req.user!.id } }),
    prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
  ]);

  return successResponse(res, { notifications, unreadCount, pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) } });
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await prisma.notification.updateMany({ where: { id, userId: req.user!.id }, data: { isRead: true } });
  return successResponse(res, null, 'Notification marked as read');
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.id, isRead: false }, data: { isRead: true } });
  return successResponse(res, null, 'All notifications marked as read');
};
