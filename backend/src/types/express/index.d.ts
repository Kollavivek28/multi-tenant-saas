import type { UserRole } from '../common';

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        tenantId: string | null;
        role: UserRole;
      };
    }
  }
}

export {};
