import type { SubscriptionPlan } from '@prisma/client';

export const PLAN_LIMITS: Record<SubscriptionPlan, { maxUsers: number; maxProjects: number }> = {
  free: { maxUsers: 5, maxProjects: 3 },
  pro: { maxUsers: 25, maxProjects: 15 },
  enterprise: { maxUsers: 100, maxProjects: 50 }
};

export const getPlanLimits = (plan: SubscriptionPlan) => PLAN_LIMITS[plan];
