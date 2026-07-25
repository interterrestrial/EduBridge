import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { asyncHandler } from '../utils/asyncHandler';
import prisma from '../prisma';

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  res.status(200).json({ notifications, unreadCount });
});

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  res.status(200).json({ success: true, unreadCount: 0 });
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const id = req.params.id as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });

  res.status(200).json({ success: true });
});

export const clearNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await prisma.notification.deleteMany({
    where: { userId },
  });

  res.status(200).json({ success: true });
});
