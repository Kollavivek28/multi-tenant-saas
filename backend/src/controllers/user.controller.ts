import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { sendError, sendSuccess } from '../utils/response';
import { recordAuditLog } from '../services/audit.service';

export const addUserToTenant = async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const { email, password, fullName, role } = req.body;

  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  if (req.authUser.role !== 'tenant_admin' || req.authUser.tenantId !== tenantId) {
    return sendError(res, 403, 'Only tenant admins can add users');
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return sendError(res, 404, 'Tenant not found');
  }

  const currentUsers = await prisma.user.count({ where: { tenantId } });
  if (currentUsers >= tenant.maxUsers) {
    return sendError(res, 403, 'User limit reached for current plan');
  }

  const existingUser = await prisma.user.findFirst({ where: { tenantId, email } });
  if (existingUser) {
    return sendError(res, 409, 'Email already exists in this tenant');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: {
      tenantId,
      email,
      passwordHash,
      fullName,
      role: role || 'user'
    }
  });

  await recordAuditLog({
    tenantId,
    userId: req.authUser.id,
    action: 'CREATE_USER',
    entityType: 'user',
    entityId: newUser.id,
    ipAddress: req.ip
  });

  return sendSuccess(
    res,
    {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      tenantId: newUser.tenantId,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt
    },
    'User created successfully',
    201
  );
};

export const listTenantUsers = async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  const isSameTenant = req.authUser.tenantId === tenantId;
  if (!isSameTenant && req.authUser.role !== 'super_admin') {
    return sendError(res, 403, 'Forbidden');
  }

  const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
  const limitRaw = parseInt((req.query.limit as string) || '50', 10);
  const limit = Math.min(Math.max(limitRaw, 1), 100);
  const skip = (page - 1) * limit;

  const where: any = { tenantId };
  if (req.query.role) {
    where.role = req.query.role;
  }
  if (req.query.search) {
    const search = String(req.query.search).toLowerCase();
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where })
  ]);

  type TenantUser = (typeof users)[number];

  return sendSuccess(res, {
    users: users.map((user: TenantUser) => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    })),
    total,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit) || 1,
      limit
    }
  });
};

export const listUsers = async (req: Request, res: Response) => {
  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
  const limitRaw = parseInt((req.query.limit as string) || '50', 10);
  const limit = Math.min(Math.max(limitRaw, 1), 100);
  const skip = (page - 1) * limit;

  const where: any = {};
  const isSuperAdmin = req.authUser.role === 'super_admin';
  const tenantFilter = isSuperAdmin
    ? (typeof req.query.tenantId === 'string' && req.query.tenantId.trim() ? req.query.tenantId.trim() : undefined)
    : req.authUser.tenantId;

  if (!tenantFilter && !isSuperAdmin) {
    return sendError(res, 400, 'Tenant context required');
  }

  if (tenantFilter) {
    where.tenantId = tenantFilter;
  }

  if (req.query.role) {
    where.role = req.query.role;
  }

  if (typeof req.query.isActive === 'string') {
    where.isActive = req.query.isActive === 'true';
  }

  if (req.query.search) {
    const search = String(req.query.search);
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  type AnyUser = (typeof users)[number];

  return sendSuccess(res, {
    users: users.map((user: AnyUser) => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      tenantId: user.tenantId,
      createdAt: user.createdAt
    })),
    total,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit) || 1,
      limit
    }
  });
};

export const updateUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return sendError(res, 404, 'User not found');
  }

  const sameTenant = targetUser.tenantId && req.authUser.tenantId === targetUser.tenantId;

  if (req.authUser.role !== 'super_admin') {
    if (!sameTenant) {
      return sendError(res, 403, 'Forbidden');
    }

    if (req.authUser.id !== userId && req.authUser.role !== 'tenant_admin') {
      return sendError(res, 403, 'Forbidden');
    }
  }

  const updates: any = {};

  if (req.body.fullName) {
    updates.fullName = req.body.fullName;
  }

  if (req.body.role) {
    if (req.authUser.role === 'tenant_admin' || req.authUser.role === 'super_admin') {
      updates.role = req.body.role;
    } else {
      return sendError(res, 403, 'Only admins can change roles');
    }
  }

  if (typeof req.body.isActive === 'boolean') {
    if (req.authUser.role === 'tenant_admin' || req.authUser.role === 'super_admin') {
      updates.isActive = req.body.isActive;
    } else {
      return sendError(res, 403, 'Only admins can change status');
    }
  }

  if (Object.keys(updates).length === 0) {
    return sendError(res, 400, 'No valid fields provided');
  }

  const updated = await prisma.user.update({ where: { id: userId }, data: updates });

  await recordAuditLog({
    tenantId: updated.tenantId || undefined,
    userId: req.authUser.id,
    action: 'UPDATE_USER',
    entityType: 'user',
    entityId: userId,
    ipAddress: req.ip
  });

  return sendSuccess(res, {
    id: updated.id,
    fullName: updated.fullName,
    role: updated.role,
    isActive: updated.isActive,
    updatedAt: updated.updatedAt
  }, 'User updated successfully');
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body as { role: 'user' | 'tenant_admin' | 'super_admin' };

  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return sendError(res, 404, 'User not found');
  }

  const sameTenant = targetUser.tenantId && req.authUser.tenantId === targetUser.tenantId;
  const isSuperAdmin = req.authUser.role === 'super_admin';

  if (!isSuperAdmin && (!sameTenant || req.authUser.role !== 'tenant_admin')) {
    return sendError(res, 403, 'Forbidden');
  }

  if (targetUser.role === 'super_admin' && !isSuperAdmin) {
    return sendError(res, 403, 'Only super admins can manage other super admins');
  }

  const updated = await prisma.user.update({ where: { id: userId }, data: { role } });

  await recordAuditLog({
    tenantId: updated.tenantId || undefined,
    userId: req.authUser.id,
    action: 'UPDATE_USER_ROLE',
    entityType: 'user',
    entityId: userId,
    ipAddress: req.ip
  });

  return sendSuccess(res, { id: updated.id, role: updated.role, updatedAt: updated.updatedAt }, 'Role updated successfully');
};

export const updateUserStatus = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { isActive } = req.body as { isActive: boolean };

  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  if (req.authUser.id === userId) {
    return sendError(res, 400, 'You cannot change your own status');
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return sendError(res, 404, 'User not found');
  }

  const sameTenant = targetUser.tenantId && req.authUser.tenantId === targetUser.tenantId;
  const isSuperAdmin = req.authUser.role === 'super_admin';

  if (!isSuperAdmin && (!sameTenant || req.authUser.role !== 'tenant_admin')) {
    return sendError(res, 403, 'Forbidden');
  }

  if (targetUser.role === 'super_admin' && !isSuperAdmin) {
    return sendError(res, 403, 'Only super admins can update the status of a super admin');
  }

  const updated = await prisma.user.update({ where: { id: userId }, data: { isActive } });

  await recordAuditLog({
    tenantId: updated.tenantId || undefined,
    userId: req.authUser.id,
    action: 'UPDATE_USER_STATUS',
    entityType: 'user',
    entityId: userId,
    ipAddress: req.ip
  });

  return sendSuccess(res, { id: updated.id, isActive: updated.isActive, updatedAt: updated.updatedAt }, 'Status updated successfully');
};

export const deleteUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  if (req.authUser.role !== 'tenant_admin') {
    return sendError(res, 403, 'Only tenant admins can delete users');
  }

  if (req.authUser.id === userId) {
    return sendError(res, 403, 'You cannot delete yourself');
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser || targetUser.tenantId !== req.authUser.tenantId) {
    return sendError(res, 404, 'User not found');
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.task.updateMany({ where: { assignedToId: userId }, data: { assignedToId: null } });
    await tx.user.delete({ where: { id: userId } });
  });

  await recordAuditLog({
    tenantId: req.authUser.tenantId || undefined,
    userId: req.authUser.id,
    action: 'DELETE_USER',
    entityType: 'user',
    entityId: userId,
    ipAddress: req.ip
  });

  return sendSuccess(res, null, 'User deleted successfully');
};
