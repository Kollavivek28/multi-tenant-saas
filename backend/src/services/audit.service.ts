import { prisma } from '../config/prisma';

interface AuditLogInput {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
}

export const recordAuditLog = async ({ tenantId, userId, action, entityType, entityId, ipAddress }: AuditLogInput) => {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: tenantId ?? undefined,
        userId: userId ?? undefined,
        action,
        entityType,
        entityId,
        ipAddress
      }
    });
  } catch (error) {
    // Intentionally swallow errors to avoid blocking main flow
    console.error('Failed to write audit log', error);
  }
};
