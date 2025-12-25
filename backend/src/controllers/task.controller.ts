import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendError, sendSuccess } from '../utils/response';
import { recordAuditLog } from '../services/audit.service';

const ensureProjectAccess = async (projectId: string, tenantId?: string | null, role?: string) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return { project: null, error: 'Project not found' } as const;
  }

  if (role !== 'super_admin' && tenantId !== project.tenantId) {
    return { project: null, error: 'Forbidden' } as const;
  }

  return { project } as const;
};

export const createTask = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { project, error } = await ensureProjectAccess(projectId, req.authUser.tenantId, req.authUser.role);
  if (!project) {
    const errorMessage = error ?? 'Project not found';
    return sendError(res, errorMessage === 'Forbidden' ? 403 : 404, errorMessage);
  }

  const { title, description, assignedTo, priority, dueDate } = req.body;

  if (assignedTo) {
    const assignee = await prisma.user.findFirst({ where: { id: assignedTo, tenantId: project.tenantId } });
    if (!assignee) {
      return sendError(res, 400, 'Assigned user must belong to the same tenant');
    }
  }

  const task = await prisma.task.create({
    data: {
      projectId: project.id,
      tenantId: project.tenantId,
      title,
      description,
      priority: priority || 'medium',
      assignedToId: assignedTo,
      dueDate: dueDate ? new Date(dueDate) : undefined
    },
    include: {
      assignedTo: { select: { id: true, fullName: true, email: true } }
    }
  });

  await recordAuditLog({
    tenantId: project.tenantId,
    userId: req.authUser.id,
    action: 'CREATE_TASK',
    entityType: 'task',
    entityId: task.id,
    ipAddress: req.ip
  });

  return sendSuccess(res, task, undefined, 201);
};

export const listProjectTasks = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { project, error } = await ensureProjectAccess(projectId, req.authUser.tenantId, req.authUser.role);
  if (!project) {
    const errorMessage = error ?? 'Project not found';
    return sendError(res, errorMessage === 'Forbidden' ? 403 : 404, errorMessage);
  }

  const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
  const limitRaw = parseInt((req.query.limit as string) || '50', 10);
  const limit = Math.min(Math.max(limitRaw, 1), 100);
  const skip = (page - 1) * limit;

  const where: any = { projectId: project.id, tenantId: project.tenantId };
  if (req.query.status) where.status = req.query.status;
  if (req.query.priority) where.priority = req.query.priority;
  if (req.query.assignedTo) where.assignedToId = req.query.assignedTo;
  if (req.query.search) {
    const search = String(req.query.search);
    where.title = { contains: search, mode: 'insensitive' };
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ],
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } }
      }
    }),
    prisma.task.count({ where })
  ]);

  return sendSuccess(res, {
    tasks,
    total,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit) || 1,
      limit
    }
  });
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { status } = req.body;

  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return sendError(res, 404, 'Task not found');
  }

  if (req.authUser.role !== 'super_admin' && req.authUser.tenantId !== task.tenantId) {
    return sendError(res, 403, 'Forbidden');
  }

  const updated = await prisma.task.update({ where: { id: taskId }, data: { status } });

  await recordAuditLog({
    tenantId: task.tenantId,
    userId: req.authUser.id,
    action: 'UPDATE_TASK_STATUS',
    entityType: 'task',
    entityId: taskId,
    ipAddress: req.ip
  });

  return sendSuccess(res, { id: updated.id, status: updated.status, updatedAt: updated.updatedAt });
};

export const updateTask = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  if (!req.authUser) {
    return sendError(res, 401, 'Unauthorized');
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return sendError(res, 404, 'Task not found');
  }

  if (req.authUser.role !== 'super_admin' && req.authUser.tenantId !== task.tenantId) {
    return sendError(res, 403, 'Forbidden');
  }

  if (req.body.assignedTo) {
    const assignee = await prisma.user.findFirst({ where: { id: req.body.assignedTo, tenantId: task.tenantId } });
    if (!assignee) {
      return sendError(res, 400, 'Assigned user must belong to the same tenant');
    }
  }

  const data: any = {};
  const fields: Array<keyof typeof req.body> = ['title', 'description', 'status', 'priority'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      data[field] = req.body[field];
    }
  });

  if ('assignedTo' in req.body) {
    data.assignedToId = req.body.assignedTo || null;
  }

  if ('dueDate' in req.body) {
    data.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
  }

  if (Object.keys(data).length === 0) {
    return sendError(res, 400, 'No valid fields provided');
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data,
    include: {
      assignedTo: { select: { id: true, fullName: true, email: true } }
    }
  });

  await recordAuditLog({
    tenantId: task.tenantId,
    userId: req.authUser.id,
    action: 'UPDATE_TASK',
    entityType: 'task',
    entityId: taskId,
    ipAddress: req.ip
  });

  return sendSuccess(res, updated, 'Task updated successfully');
};
