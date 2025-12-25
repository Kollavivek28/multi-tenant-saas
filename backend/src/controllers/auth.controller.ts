import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { sendError, sendSuccess } from '../utils/response';
import { env } from '../config/env';
import { getPlanLimits } from '../utils/subscription';
import { recordAuditLog } from '../services/audit.service';

const TOKEN_EXPIRY_SECONDS = 24 * 60 * 60;

export const registerTenant = async (req: Request, res: Response) => {
  const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

  const existingTenant = await prisma.tenant.findUnique({ where: { subdomain } });
  if (existingTenant) {
    return sendError(res, 409, 'Subdomain already in use');
  }

  const { maxUsers, maxProjects } = getPlanLimits('free');

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          subdomain,
          subscriptionPlan: 'free',
          status: 'active',
          maxUsers,
          maxProjects
        }
      });

      const passwordHash = await bcrypt.hash(adminPassword, 10);

      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: adminEmail,
          passwordHash,
          fullName: adminFullName,
          role: 'tenant_admin'
        }
      });

      return { tenant, adminUser };
    });

    await recordAuditLog({
      tenantId: result.tenant.id,
      userId: result.adminUser.id,
      action: 'REGISTER_TENANT',
      entityType: 'tenant',
      entityId: result.tenant.id,
      ipAddress: req.ip
    });

    return sendSuccess(
      res,
      {
        tenantId: result.tenant.id,
        subdomain: result.tenant.subdomain,
        adminUser: {
          id: result.adminUser.id,
          email: result.adminUser.email,
          fullName: result.adminUser.fullName,
          role: result.adminUser.role
        }
      },
      'Tenant registered successfully',
      201
    );
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return sendError(res, 409, 'Admin email already exists for this tenant');
    }
    return sendError(res, 500, 'Failed to register tenant');
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password, tenantSubdomain, tenantId } = req.body as { email: string; password: string; tenantSubdomain?: string; tenantId?: string };

  let tenant = null;
  if (tenantSubdomain) {
    tenant = await prisma.tenant.findUnique({ where: { subdomain: tenantSubdomain } });
    if (!tenant) {
      return sendError(res, 404, 'Tenant not found');
    }
  } else if (tenantId) {
    tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return sendError(res, 404, 'Tenant not found');
    }
  }

  if (tenant && tenant.status !== 'active') {
    return sendError(res, 403, 'Tenant is not active');
  }

  const user = await prisma.user.findFirst({
    where: tenant
      ? { email, tenantId: tenant.id }
      : { email, role: 'super_admin' }
  });

  if (!user) {
    return sendError(res, 401, 'Invalid credentials');
  }

  if (!user.isActive) {
    return sendError(res, 403, 'Account is inactive');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return sendError(res, 401, 'Invalid credentials');
  }

  if (user.role !== 'super_admin' && tenant && user.tenantId !== tenant.id) {
    return sendError(res, 403, 'User does not belong to this tenant');
  }

  const token = jwt.sign(
    { userId: user.id, tenantId: user.tenantId, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn || '24h' }
  );

  await recordAuditLog({
    tenantId: user.tenantId,
    userId: user.id,
    action: 'LOGIN',
    entityType: 'user',
    entityId: user.id,
    ipAddress: req.ip
  });

  return sendSuccess(res, {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenantId: user.tenantId
    },
    token,
    expiresIn: TOKEN_EXPIRY_SECONDS
  });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.authUser.id },
    include: {
      tenant: true
    }
  });

  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  return sendSuccess(res, {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    tenant: user.tenant
      ? {
          id: user.tenant.id,
          name: user.tenant.name,
          subdomain: user.tenant.subdomain,
          subscriptionPlan: user.tenant.subscriptionPlan,
          maxUsers: user.tenant.maxUsers,
          maxProjects: user.tenant.maxProjects
        }
      : null
  });
};

export const logout = async (req: Request, res: Response) => {
  await recordAuditLog({
    tenantId: req.authUser?.tenantId,
    userId: req.authUser?.id,
    action: 'LOGOUT',
    entityType: 'user',
    entityId: req.authUser?.id,
    ipAddress: req.ip
  });

  return sendSuccess(res, null, 'Logged out successfully');
};
