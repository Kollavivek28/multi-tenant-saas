CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "TenantStatus" AS ENUM ('active', 'suspended', 'trial');
CREATE TYPE "SubscriptionPlan" AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'tenant_admin', 'user');
CREATE TYPE "ProjectStatus" AS ENUM ('active', 'archived', 'completed');
CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'completed');
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high');

CREATE TABLE "Tenant" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "subdomain" VARCHAR(255) UNIQUE NOT NULL,
  "status" "TenantStatus" NOT NULL DEFAULT 'active',
  "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'free',
  "maxUsers" INTEGER NOT NULL DEFAULT 5,
  "maxProjects" INTEGER NOT NULL DEFAULT 3,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NULL,
  "email" VARCHAR(255) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "fullName" VARCHAR(255) NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'user',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX "User_tenant_email_unique" ON "User"("tenantId", "email");
CREATE INDEX "User_tenant_idx" ON "User"("tenantId");

CREATE TABLE "Project" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "status" "ProjectStatus" NOT NULL DEFAULT 'active',
  "createdById" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT
);

CREATE INDEX "Project_tenant_idx" ON "Project"("tenantId");

CREATE TABLE "Task" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "status" "TaskStatus" NOT NULL DEFAULT 'todo',
  "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
  "assignedToId" UUID,
  "dueDate" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
  CONSTRAINT "Task_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX "Task_tenant_project_idx" ON "Task"("tenantId", "projectId");

CREATE TABLE "AuditLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID,
  "userId" UUID,
  "action" VARCHAR(255) NOT NULL,
  "entityType" VARCHAR(255),
  "entityId" VARCHAR(255),
  "ipAddress" VARCHAR(255),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX "AuditLog_tenant_idx" ON "AuditLog"("tenantId");

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" TEXT PRIMARY KEY,
  "checksum" TEXT NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" TEXT NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);
