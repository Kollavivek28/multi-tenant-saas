import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z
    .string()
    .regex(/^(\d{4})-(\d{2})-(\d{2})$/, 'Due date must be in YYYY-MM-DD format')
    .optional()
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  dueDate: z
    .string()
    .regex(/^(\d{4})-(\d{2})-(\d{2})$/, 'Due date must be in YYYY-MM-DD format')
    .nullable()
    .optional()
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'completed'])
});
