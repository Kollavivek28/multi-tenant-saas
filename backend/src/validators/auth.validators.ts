import { z } from 'zod';

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters long');

export const registerTenantSchema = z.object({
  tenantName: z.string().min(2, 'Tenant name is required'),
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain must be lowercase alphanumeric with hyphens only'),
  adminEmail: z.string().email('Valid admin email is required'),
  adminPassword: passwordSchema,
  adminFullName: z.string().min(2, 'Admin full name is required')
});

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: passwordSchema,
  tenantSubdomain: z.string().min(2).optional(),
  tenantId: z.string().uuid().optional()
});
