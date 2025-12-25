import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { getPlanLimits } from '../src/utils/subscription';

const prisma = new PrismaClient();

const ensurePassword = async (password: string) => bcrypt.hash(password, 10);

const ensureSuperAdmin = async () => {
  const email = 'superadmin@system.com';
  const existing = await prisma.user.findFirst({ where: { email, tenantId: null } });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      email,
      passwordHash: await ensurePassword('Admin@123'),
      fullName: 'System Super Admin',
      role: 'super_admin'
    }
  });
};

const ensureTenantWithData = async () => {
  const subdomain = 'demo';
  const tenantName = 'Demo Company';
  const plan = 'pro' as const;
  const limits = getPlanLimits(plan);

  let tenant = await prisma.tenant.findUnique({ where: { subdomain } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        subdomain,
        status: 'active',
        subscriptionPlan: plan,
        maxUsers: limits.maxUsers,
        maxProjects: limits.maxProjects
      }
    });
  }

  let admin = await prisma.user.findFirst({ where: { tenantId: tenant.id, email: 'admin@demo.com' } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'admin@demo.com',
        passwordHash: await ensurePassword('Demo@123'),
        fullName: 'Demo Admin',
        role: 'tenant_admin'
      }
    });
  }

  const userSeeds = [
    { email: 'user1@demo.com', fullName: 'Demo User One' },
    { email: 'user2@demo.com', fullName: 'Demo User Two' }
  ];

  for (const seed of userSeeds) {
    const existing = await prisma.user.findFirst({ where: { tenantId: tenant.id, email: seed.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: seed.email,
          passwordHash: await ensurePassword('User@123'),
          fullName: seed.fullName,
          role: 'user'
        }
      });
    }
  }

  const users = await prisma.user.findMany({ where: { tenantId: tenant.id } });
  type TenantUser = (typeof users)[number];
  const creatorId = users.find((user: TenantUser) => user.role === 'tenant_admin')?.id || users[0]?.id;
  if (!creatorId) {
    throw new Error('Failed to locate tenant admin for seeding projects');
  }

  const projectSeeds = [
    { name: 'Project Alpha', description: 'First demo project' },
    { name: 'Project Beta', description: 'Second demo project' }
  ];

  for (const projectSeed of projectSeeds) {
    const existingProject = await prisma.project.findFirst({ where: { tenantId: tenant.id, name: projectSeed.name } });
    if (!existingProject) {
      await prisma.project.create({
        data: {
          tenantId: tenant.id,
          name: projectSeed.name,
          description: projectSeed.description,
          createdById: creatorId
        }
      });
    }
  }

  const projects = await prisma.project.findMany({ where: { tenantId: tenant.id } });
  const defaultAssignee = users.find((user: TenantUser) => user.role === 'user');

  for (const project of projects) {
    const tasks = await prisma.task.findMany({ where: { projectId: project.id } });
    if (tasks.length >= 3) continue;

    await prisma.task.create({
      data: {
        projectId: project.id,
        tenantId: tenant.id,
        title: `${project.name} kickoff`,
        description: 'Initial planning session',
        priority: 'high',
        assignedToId: defaultAssignee?.id,
        dueDate: new Date()
      }
    });

    await prisma.task.create({
      data: {
        projectId: project.id,
        tenantId: tenant.id,
        title: `${project.name} QA`,
        description: 'Quality assurance review',
        priority: 'medium',
        status: 'in_progress'
      }
    });

    await prisma.task.create({
      data: {
        projectId: project.id,
        tenantId: tenant.id,
        title: `${project.name} launch`,
        description: 'Release and rollout activities',
        priority: 'low',
        status: 'todo'
      }
    });
  }
};

async function main() {
  await ensureSuperAdmin();
  await ensureTenantWithData();
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
