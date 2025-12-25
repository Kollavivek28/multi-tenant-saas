import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendError, sendSuccess } from '../utils/response';
import { getPlanLimits } from '../utils/subscription';
import { recordAuditLog } from '../services/audit.service';

type TenantUpdateData = {
  name?: string;
  status?: 'active' | 'suspended' | 'trial';
  subscriptionPlan?: 'free' | 'pro' | 'enterprise';
  maxUsers?: number;
  maxProjects?: number;
};

type TenantWhereInput = {
  status?: 'active' | 'suspended' | 'trial';
  subscriptionPlan?: 'free' | 'pro' | 'enterprise';
};

export const getTenantDetails = async (req: Request, res: Response) => {
  const { tenantId } = req.params;

  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  if (req.authUser.role !== 'super_admin' && req.authUser.tenantId !== tenantId) {
    return sendError(res, 403, 'Forbidden');
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return sendError(res, 404, 'Tenant not found');
  }

  const [totalUsers, totalProjects, totalTasks] = await Promise.all([
    prisma.user.count({ where: { tenantId } }),
    prisma.project.count({ where: { tenantId } }),
    prisma.task.count({ where: { tenantId } })
  ]);

  return sendSuccess(res, {
    id: tenant.id,
    name: tenant.name,
    subdomain: tenant.subdomain,
    status: tenant.status,
    subscriptionPlan: tenant.subscriptionPlan,
    maxUsers: tenant.maxUsers,
    maxProjects: tenant.maxProjects,
    createdAt: tenant.createdAt,
    stats: { totalUsers, totalProjects, totalTasks }
  });
};

export const updateTenant = async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const payload = req.body as Partial<{
    name: string;
    status: string;
    subscriptionPlan: 'free' | 'pro' | 'enterprise';
    maxUsers: number;
    maxProjects: number;
  }>;

  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  if (req.authUser.role !== 'super_admin' && req.authUser.tenantId !== tenantId) {
    return sendError(res, 403, 'Forbidden');
  }

  const forbiddenFields = ['status', 'subscriptionPlan', 'maxUsers', 'maxProjects'];
  if (req.authUser.role !== 'super_admin' && forbiddenFields.some((field) => field in payload)) {
    return sendError(res, 403, 'Tenant admins can only update the name');
  }

  const data: TenantUpdateData = {} as TenantUpdateData;

  if (payload.name) data.name = payload.name;
  if (req.authUser.role === 'super_admin') {
    if (payload.status) data.status = payload.status as any;
    if (payload.subscriptionPlan) {
      const limits = getPlanLimits(payload.subscriptionPlan);
      data.subscriptionPlan = payload.subscriptionPlan;
      data.maxUsers = payload.maxUsers ?? limits.maxUsers;
      data.maxProjects = payload.maxProjects ?? limits.maxProjects;
    } else {
      if (typeof payload.maxUsers === 'number') data.maxUsers = payload.maxUsers;
      if (typeof payload.maxProjects === 'number') data.maxProjects = payload.maxProjects;
    }
  }

  if (Object.keys(data).length === 0) {
    return sendError(res, 400, 'No valid fields provided');
  }

  const updated = await prisma.tenant.update({ where: { id: tenantId }, data });

  await recordAuditLog({
    tenantId,
    userId: req.authUser.id,
    action: 'UPDATE_TENANT',
    entityType: 'tenant',
    entityId: tenantId,
    ipAddress: req.ip
  });

  return sendSuccess(res, { id: updated.id, name: updated.name, updatedAt: updated.updatedAt }, 'Tenant updated successfully');
};

export const listTenants = async (req: Request, res: Response) => {
  if (!req.authUser || req.authUser.role !== 'super_admin') {
    return sendError(res, 403, 'Only super admins can list tenants');
  }

  const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
  const limitRaw = parseInt((req.query.limit as string) || '10', 10);
  const limit = Math.min(Math.max(limitRaw, 1), 100);
  const skip = (page - 1) * limit;

  const where: TenantWhereInput = {} as TenantWhereInput;
  if (req.query.status) {
    where.status = req.query.status as any;
  }
  if (req.query.subscriptionPlan) {
    where.subscriptionPlan = req.query.subscriptionPlan as any;
  }

  const [tenants, totalTenants] = await Promise.all([
    prisma.tenant.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.tenant.count({ where })
  ]);

  type TenantRecord = (typeof tenants)[number];
  const tenantsWithStats = await Promise.all(
    tenants.map(async (tenant: TenantRecord) => {
      const [totalUsers, totalProjects] = await Promise.all([
        prisma.user.count({ where: { tenantId: tenant.id } }),
        prisma.project.count({ where: { tenantId: tenant.id } })
      ]);

      return {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
        subscriptionPlan: tenant.subscriptionPlan,
        totalUsers,
        totalProjects,
        createdAt: tenant.createdAt
      };
    })
  );

  return sendSuccess(res, {
    tenants: tenantsWithStats,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalTenants / limit) || 1,
      totalTenants,
      limit
    }
  });
};
