import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import logger from '../utils/logger';

interface AuthSocket extends Socket {
  userId?: string;
  userName?: string;
}

export const setupSocket = (io: Server) => {
  io.use(async (socket: AuthSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; name: string };
        socket.userId = decoded.id;
        socket.userName = decoded.name;
      } catch {
        // Allow unauthenticated, some events require auth
      }
    }
    next();
  });

  io.on('connection', (socket: AuthSocket) => {
    logger.info(`Socket connected: ${socket.id}, user: ${socket.userId || 'anonymous'}`);

    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join conversation room
    socket.on('join:conversation', async ({ conversationId }: { conversationId: string }) => {
      if (!socket.userId) return socket.emit('error', { message: 'Authentication required' });

      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          participants: { some: { id: socket.userId } },
        },
      });

      if (conversation) {
        socket.join(`conversation:${conversationId}`);
        socket.emit('joined:conversation', { conversationId });
      }
    });

    // Send message
    socket.on('send:message', async ({ conversationId, content, type = 'TEXT', imageUrl }: { conversationId: string; content: string; type?: string; imageUrl?: string }) => {
      if (!socket.userId) return socket.emit('error', { message: 'Authentication required' });
      if (!content?.trim() && !imageUrl) return;

      try {
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            participants: { some: { id: socket.userId } },
          },
          include: { participants: { select: { id: true } } },
        });

        if (!conversation) return socket.emit('error', { message: 'Conversation not found' });

        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: socket.userId,
            content: content?.trim() || '',
            type: type as 'TEXT' | 'IMAGE' | 'SYSTEM',
            imageUrl,
          },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        io.to(`conversation:${conversationId}`).emit('new:message', message);

        // Notify the other participants
        for (const participant of conversation.participants) {
          if (participant.id !== socket.userId) {
            io.to(`user:${participant.id}`).emit('notification:message', {
              conversationId,
              senderName: socket.userName,
              preview: content?.substring(0, 50) || '📷 Image',
            });
          }
        }
      } catch (err) {
        logger.error('Socket send:message error', { err });
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing:start', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit('user:typing', {
        userId: socket.userId,
        userName: socket.userName,
      });
    });

    socket.on('typing:stop', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit('user:stopped-typing', {
        userId: socket.userId,
      });
    });

    // Mark messages as read
    socket.on('mark:read', async ({ conversationId }: { conversationId: string }) => {
      if (!socket.userId) return;
      await prisma.message.updateMany({
        where: { conversationId, senderId: { not: socket.userId }, isRead: false },
        data: { isRead: true },
      }).catch(() => {});
      socket.to(`conversation:${conversationId}`).emit('messages:read', { conversationId, userId: socket.userId });
    });

    // Send notification to specific user
    socket.on('send:notification', ({ targetUserId, notification }: { targetUserId: string; notification: object }) => {
      io.to(`user:${targetUserId}`).emit('new:notification', notification);
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
