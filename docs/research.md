# Research Summary

## Problem Context
Multi-tenant SaaS platforms allow separate organizations to share a single codebase while keeping data, configuration, and billing isolated. Target customers are SMB teams that need lightweight project, task, and user management but lack the resources to run and secure dedicated infrastructure. Key pains include onboarding speed, data security, and admin visibility across tenants.

## Personas & Needs
- **Operations Manager (Primary Admin):** Needs to provision tenants quickly, manage users/projects, and export audit logs for compliance.
- **Project Lead (Power User):** Expects consolidated dashboards, project progress insights, and the ability to assign tasks across teams.
- **Contributor (Standard User):** Requires streamlined task updates, notifications, and personal workload visibility across projects/tenants.

## Market Landscape
| Competitor | Strengths | Gaps We Address |
| --- | --- | --- |
| Atlassian Jira | Deep workflow customization, marketplace apps | Complex setup, expensive for SMB tenants |
| Asana | Excellent UX, automation templates | Limited tenant-level isolation & custom roles |
| Monday.com | Visual boards, integrations | Opinionated data model, limited audit exports |
| Linear | Fast issue tracking | Focused on software teams, lacks multi-tenant controls |

**Differentiators:** Opinionated tenant onboarding, built-in audit logging, and role-aware dashboards tuned for cross-tenant visibility without marketplace sprawl.

## Technical Direction & Justification
- **Frontend:** Vite + React + React Router deliver fast DX, and React Query + axios standardize data fetching/caching. React Hook Form + zod provide declarative validation aligned with backend schemas. TailwindCSS keeps styling consistent while enabling tenant theming.
- **Backend:** Node/Express with Prisma + PostgreSQL offers relational guarantees for tenant scoping. Prisma's schema-driven migrations simplify multi-tenant data modeling (tenant, users, projects, tasks, audit_logs). JWT auth keeps the API stateless, and middleware enforces role-based access.
- **Infrastructure:** Docker Compose orchestrates Postgres, backend, and frontend containers, ensuring consistent local environments. Future deployment targets container platforms (Azure Web Apps, AWS ECS) with the same images.
- **Multi-tenancy Model:** Each tenant owns users, projects, tasks, and audit logs via `tenantId` foreign keys. Query helpers enforce tenant scoping. Audit trails capture user + tenant context for every mutation.

## Security & Compliance Considerations
- **Isolation:** Every database query filters by `tenantId`. Composite unique constraints (e.g., `tenantId + slug`) prevent cross-tenant collisions.
- **Authentication:** JWT access tokens signed with `JWT_SECRET`, refresh or re-auth on expiry. Passwords hashed via bcrypt. Optional MFA and IP restrictions are roadmap items.
- **Authorization:** Roles (`owner`, `admin`, `member`, `viewer`) enforced at middleware and UI route level. Admin-only endpoints guard user management and tenant settings.
- **Data Privacy:** PII limited to necessary attributes (name, email). Provide export + delete routines for GDPR. Audit logs tracked for SOC 2 evidence.
- **Infrastructure Hardening:** HTTPS termination, secure cookies, CORS allowlist per environment, secrets passed via `.env`/KeyVault. Nightly backups on Postgres volume snapshots.

## Risks & Mitigations
- **Tenant Data Leakage:** Mitigated by centralized query helper + automated tests that assert tenant scoping.
- **Onboarding Friction:** Provide CLI/seed scripts plus admin UI wizard to create tenants and default roles.
- **Performance Hotspots:** Add composite indexes (`tenantId + status`, `tenantId + projectId`) and background jobs for heavy analytics.
- **Operational Complexity:** Docker + Make targets standardize workflows; documentation outlines env vars and CI/CD checks.

## Success Metrics
- Tenant provisioning time < 5 minutes end-to-end.
- <1% support tickets related to access/authentication per quarter.
- P95 dashboard load time < 1.5s with 50 concurrent tenants.
- 100% of write operations logged in `audit_logs` table.
