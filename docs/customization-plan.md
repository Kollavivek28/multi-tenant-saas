# Customization Plan

## Objectives
1. Build a production-ready React frontend that covers authentication (registration/login), tenant dashboard, projects, tasks, and user management.
2. Introduce a Docker-based development experience with containers for the database, backend API, and frontend app, including automatic Prisma migrations plus seed execution and shared environment variable handling.
3. Produce the required documentation set: research summary, PRD, architecture overview, technical specification, API reference, README, and `submission.json`.

## Workstreams & Tasks

### 1. React Frontend
- **Stack**: Vite + React + TypeScript + React Router + Zustand (state) + React Query (API caching) + TailwindCSS for styling.
- **Auth flow**:
  - Public routes for registration/login with form validation, error surfaces.
  - Persist JWT + tenant context via secure storage (httpOnly cookie assumption) and refresh via `/auth/me`.
  - Protected route wrapper handling redirects when unauthenticated.
- **Role-aware UI**:
  - Global user context storing `role` & `tenantId` to toggle admin-only controls (user management, tenant settings) vs regular user (tasks/projects only).
- **Pages/Features**:
  1. Registration & Login screens.
  2. Dashboard: KPIs (users, projects, tasks) + recent activity (leveraging backend stats endpoints).
  3. Projects list/detail: CRUD actions, task summaries, progress indicators, filtering.
  4. Task board/table: inline status updates, priority chips, assignment controls.
  5. User management: invite/create, role toggles, status badges.
  6. Profile/settings: update password, personal info.
- **API layer**: shared client with axios, auto attaches token, handles 401 refresh/redirect.
- **Validation & feedback**: zod-based form schemas (aligning with backend); toast notifications for success/error.
- **Testing**: Component tests for critical flows (login form, protected routes) using Vitest + React Testing Library.

### 2. Docker & Environment
- **Services**:
  - `db`: PostgreSQL 15 with mounted volume + init scripts.
  - `backend`: existing Node service, runs `prisma migrate deploy && prisma db seed && pnpm dev` (or `start`).
  - `frontend`: Vite dev server (or prod build + nginx) depending on target; use multi-stage Dockerfile.
- **Shared env**:
  - Central `.env` for local non-secret defaults; `.env.backend` & `.env.frontend` referencing same base via docker-compose `env_file`.
  - Document environment variables in README + `.env.example` for each service.
- **Automation**:
  - Compose `post-up` command or entrypoint script ensures migrations + seeds run before backend boots.
  - Provide `Makefile` or npm scripts to orchestrate `docker compose up`, `down`, `logs`.

### 3. Documentation Set
- **Research** (`docs/research.md`): competitor analysis, target personas, compliance considerations.
- **PRD** (`docs/prd.md`): problem statement, goals, KPIs, user stories, acceptance criteria.
- **Architecture** (`docs/architecture.md`): system diagram, data flow, module breakdown, deployment topology (Docker).
- **Technical Spec** (`docs/technical-spec.md`): detailed APIs, data models, services, third-party deps.
- **API Reference** (`docs/api-reference.md`): endpoint catalog, request/response schemas, auth requirements.
- **README** (`README.md`): overview, prerequisites, setup (local & Docker), testing, env variables.
- **Submission** (`submission.json`): metadata for delivery (name, repo, instructions summary).

## Execution Order
1. Scaffold React frontend & install dependencies.
2. Implement auth + protected routing + shared layout.
3. Build dashboard/projects/tasks/users features incrementally with API integration & tests.
4. Create Dockerfiles + `docker-compose.yml`, ensure migrations/seeds auto-run.
5. Align environment handling + `.env.example` files.
6. Author documentation set and update README/submission file.
7. Final verification: lint/tests, docker compose up, review docs.
