import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'archived', 'completed']).optional()
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'archived', 'completed']).optional()
});
