import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const healthCheck = async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const hasSuperAdmin = await prisma.user.findFirst({ where: { role: 'super_admin' } });
    if (!hasSuperAdmin) {
      return res.status(503).json({ status: 'initializing', database: 'pending_seed' });
    }

    return res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    return res.status(503).json({ status: 'error', database: 'unavailable' });
  }
};
