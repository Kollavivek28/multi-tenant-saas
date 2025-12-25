import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '../types/common';
import { env } from '../config/env';
import { sendError } from '../utils/response';

interface JwtPayload {
  userId: string;
  tenantId: string | null;
  role: UserRole;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return sendError(res, 401, 'Authorization token missing');
  }

  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.authUser = { id: payload.userId, tenantId: payload.tenantId, role: payload.role };
    return next();
  } catch (error) {
    return sendError(res, 401, 'Invalid or expired token');
  }
};

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return sendError(res, 401, 'Unauthorized');
    }

    if (!roles.includes(req.authUser.role)) {
      return sendError(res, 403, 'Forbidden');
    }

    return next();
  };
};

export const requireTenantContext = (req: Request, res: Response, next: NextFunction) => {
  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  if (!req.authUser.tenantId && req.authUser.role !== 'super_admin') {
    return sendError(res, 403, 'Tenant context required');
  }

  return next();
};
