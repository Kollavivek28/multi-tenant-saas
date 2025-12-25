import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full name is required'),
  role: z.enum(['user', 'tenant_admin']).default('user')
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  role: z.enum(['user', 'tenant_admin']).optional(),
  isActive: z.boolean().optional()
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'tenant_admin', 'super_admin'])
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean()
});
