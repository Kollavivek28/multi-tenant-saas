import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendError, sendSuccess } from '../utils/response';
import { recordAuditLog } from '../services/audit.service';

const resolveTenantFromRequest = (req: Request): string | null => {
  if (req.authUser?.tenantId) {
    return req.authUser.tenantId;
  }

  if (req.authUser?.role === 'super_admin' && typeof req.query.tenantId === 'string') {
    return req.query.tenantId;
  }

  return null;
};

export const createProject = async (req: Request, res: Response) => {
  if (!req.authUser?.tenantId) {
    return sendError(res, 403, 'Only tenant members can create projects');
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: req.authUser.tenantId } });
  if (!tenant) {
    return sendError(res, 404, 'Tenant not found');
  }

  const currentProjects = await prisma.project.count({ where: { tenantId: tenant.id } });
  if (currentProjects >= tenant.maxProjects) {
    return sendError(res, 403, 'Project limit reached for current plan');
  }

  const { name, description, status } = req.body;
  const project = await prisma.project.create({
    data: {
      tenantId: tenant.id,
      name,
      description,
      status: status || 'active',
      createdById: req.authUser.id
    },
    include: {
      createdBy: { select: { id: true, fullName: true } }
    }
  });

  await recordAuditLog({
    tenantId: tenant.id,
    userId: req.authUser.id,
    action: 'CREATE_PROJECT',
    entityType: 'project',
    entityId: project.id,
    ipAddress: req.ip
  });

  return sendSuccess(res, project, undefined, 201);
};

export const listProjects = async (req: Request, res: Response) => {
  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  const tenantId = resolveTenantFromRequest(req);
  if (!tenantId) {
    return sendError(res, 400, 'Tenant context required');
  }

  const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
  const limitRaw = parseInt((req.query.limit as string) || '20', 10);
  const limit = Math.min(Math.max(limitRaw, 1), 100);
  const skip = (page - 1) * limit;

  const where: any = { tenantId };
  if (req.query.status) {
    where.status = req.query.status;
  }
  if (req.query.search) {
    const search = String(req.query.search);
    where.name = { contains: search, mode: 'insensitive' };
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        _count: { select: { tasks: true } }
      }
    }),
    prisma.project.count({ where })
  ]);

  type ProjectRecord = (typeof projects)[number];
  const projectIds = projects.map((project: ProjectRecord) => project.id);
  const completedMap = new Map<string, number>();
  if (projectIds.length > 0) {
    const completedCounts = await prisma.task.groupBy({
      by: ['projectId'],
      where: { projectId: { in: projectIds }, status: 'completed' },
      _count: { projectId: true }
    });
    type CompletedCount = (typeof completedCounts)[number];
    completedCounts.forEach((item: CompletedCount) => {
      completedMap.set(item.projectId, item._count.projectId);
    });
  }

  return sendSuccess(res, {
    projects: projects.map((project: ProjectRecord) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      createdBy: project.createdBy,
      taskCount: project._count.tasks,
      completedTaskCount: completedMap.get(project.id) || 0,
      createdAt: project.createdAt
    })),
    total,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit) || 1,
      limit
    }
  });
};

export const getProjectDetails = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      createdBy: { select: { id: true, fullName: true } },
      tenant: { select: { id: true, name: true } },
      _count: { select: { tasks: true } }
    }
  });

  if (!project) {
    return sendError(res, 404, 'Project not found');
  }

  if (req.authUser.role !== 'super_admin' && req.authUser.tenantId !== project.tenantId) {
    return sendError(res, 403, 'Forbidden');
  }

  return sendSuccess(res, project);
};

export const updateProject = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return sendError(res, 404, 'Project not found');
  }

  const sameTenant = req.authUser.tenantId === project.tenantId;
  const isCreator = req.authUser.id === project.createdById;

  if (req.authUser.role !== 'super_admin' && !sameTenant) {
    return sendError(res, 403, 'Forbidden');
  }

  if (req.authUser.role !== 'tenant_admin' && !isCreator && req.authUser.role !== 'super_admin') {
    return sendError(res, 403, 'Only creator or tenant admin can update project');
  }

  const { name, description, status } = req.body;
  const data: any = {};
  if (name) data.name = name;
  if (description !== undefined) data.description = description;
  if (status) data.status = status;

  if (Object.keys(data).length === 0) {
    return sendError(res, 400, 'No valid fields provided');
  }

  const updated = await prisma.project.update({ where: { id: projectId }, data });

  await recordAuditLog({
    tenantId: project.tenantId,
    userId: req.authUser.id,
    action: 'UPDATE_PROJECT',
    entityType: 'project',
    entityId: projectId,
    ipAddress: req.ip
  });

  return sendSuccess(res, updated, 'Project updated successfully');
};

export const deleteProject = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return sendError(res, 404, 'Project not found');
  }

  const sameTenant = req.authUser.tenantId === project.tenantId;
  const isCreator = req.authUser.id === project.createdById;

  if (req.authUser.role !== 'super_admin' && !sameTenant) {
    return sendError(res, 403, 'Forbidden');
  }

  if (req.authUser.role !== 'tenant_admin' && !isCreator && req.authUser.role !== 'super_admin') {
    return sendError(res, 403, 'Only creator or tenant admin can delete project');
  }

  await prisma.project.delete({ where: { id: projectId } });

  await recordAuditLog({
    tenantId: project.tenantId,
    userId: req.authUser.id,
    action: 'DELETE_PROJECT',
    entityType: 'project',
    entityId: projectId,
    ipAddress: req.ip
  });

  return sendSuccess(res, null, 'Project deleted successfully');
};
