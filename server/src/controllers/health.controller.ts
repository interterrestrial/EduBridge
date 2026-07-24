import { Request, Response } from 'express';
import prisma from '../prisma';

export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'disconnected', time: new Date().toISOString() });
  }
};
