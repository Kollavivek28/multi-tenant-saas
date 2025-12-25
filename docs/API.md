# API Reference
All endpoints are prefixed with `http://localhost:5000/api` in local development (Docker: `http://backend:5000/api`). Authentication uses JWT Bearer tokens returned by the login endpoint. Unless noted, responses follow `{ success: boolean, message?: string, data: T }`.

## Authentication
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register-tenant` | Public | Provision a new tenant and tenant admin. |
| `POST` | `/auth/login` | Public | Obtain JWT for super admin or tenant user. |
# API Reference
Base URL (local dev): `http://localhost:5000/api`

Authentication uses JWT Bearer tokens. Unless noted, responses follow `{ "success": boolean, "message?": string, "data": T }` and errors follow `{ "success": false, "message": string }`.

## Auth Endpoints
### 1. Register Tenant
- **Method**: `POST`
- **Endpoint**: `/auth/register-tenant`
- **Auth**: Public
- **Body**:
```json
{
  "tenantName": "Test Inc",
  "subdomain": "testinc",
  "adminFullName": "Test Admin",
  "adminEmail": "admin@testinc.com",
  "adminPassword": "Password123!"
}
```
- **Response** `201`:
```json
{
  "success": true,
  "message": "Tenant registered successfully",
  "data": {
    "tenantId": "uuid",
    "subdomain": "testinc",
    "adminUser": {
      "id": "uuid",
      "email": "admin@testinc.com",
      "fullName": "Test Admin",
      "role": "tenant_admin"
    }
  }
}
```

### 2. Login
- **Method**: `POST`
- **Endpoint**: `/auth/login`
- **Auth**: Public
- **Body**:
```json
{
  "email": "admin@demo.com",
  "password": "Demo@123",
  "tenantSubdomain": "demo"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@demo.com",
      "fullName": "Demo Admin",
      "role": "tenant_admin",
      "tenantId": "uuid"
    },
    "token": "<jwt>",
    "expiresIn": 86400
  }
}
```

### 3. Current User
- **Method**: `GET`
- **Endpoint**: `/auth/me`
- **Auth**: Bearer token
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@demo.com",
    "fullName": "Demo Admin",
    "role": "tenant_admin",
    "isActive": true,
    "tenant": {
      "id": "uuid",
      "name": "Demo Company",
      "subdomain": "demo",
      "subscriptionPlan": "pro",
      "maxUsers": 25,
      "maxProjects": 15
    }
  }
}
```

### 4. Logout
- **Method**: `POST`
- **Endpoint**: `/auth/logout`
- **Auth**: Bearer token
- **Response**: `200 OK` with `{ "success": true, "message": "Logged out successfully" }`

## Tenant Endpoints
### 5. List Tenants (super admin)
- **Method**: `GET`
- **Endpoint**: `/tenants?status=&subscriptionPlan=&page=&limit=`
- **Auth**: `super_admin`
- **Response**:
```json
{
  "success": true,
  "data": {
    "tenants": [
      {
        "id": "uuid",
        "name": "Demo Company",
        "subdomain": "demo",
        "status": "active",
        "subscriptionPlan": "pro",
        "totalUsers": 5,
        "totalProjects": 2,
        "createdAt": "2025-12-24T12:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalTenants": 1,
      "limit": 10
    }
  }
}
```

### 6. Get Tenant Details
- **Method**: `GET`
- **Endpoint**: `/tenants/:tenantId`
- **Auth**: Same tenant member or `super_admin`
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Demo Company",
    "subdomain": "demo",
    "status": "active",
    "subscriptionPlan": "pro",
    "maxUsers": 25,
    "maxProjects": 15,
    "createdAt": "2025-12-24T12:11:00.000Z",
    "stats": {
      "totalUsers": 5,
      "totalProjects": 2,
      "totalTasks": 6
    }
  }
}
```

### 7. Update Tenant
- **Method**: `PUT`
- **Endpoint**: `/tenants/:tenantId`
- **Auth**: `super_admin` (tenant admins can only rename)
- **Body** (example):
```json
{
  "name": "Demo HQ",
  "subscriptionPlan": "pro",
  "maxUsers": 50,
  "status": "active"
}
```
- **Response**: `{ "success": true, "message": "Tenant updated successfully", "data": { "id": "uuid", "name": "Demo HQ", "updatedAt": "..." } }`

### 8. Invite Tenant User
- **Method**: `POST`
- **Endpoint**: `/tenants/:tenantId/users`
- **Auth**: `tenant_admin`
- **Body**:
```json
{
  "email": "analyst@demo.com",
  "password": "User@123",
  "fullName": "Analytics Lead",
  "role": "user"
}
```
- **Response** `201`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "analyst@demo.com",
    "fullName": "Analytics Lead",
    "role": "user",
    "tenantId": "uuid",
    "isActive": true,
    "createdAt": "2025-12-24T12:30:00.000Z"
  }
}
```

### 9. List Tenant Users
- **Method**: `GET`
- **Endpoint**: `/tenants/:tenantId/users?role=&search=&page=&limit=`
- **Auth**: Same tenant member or `super_admin`
- **Response**: User list with pagination (similar to tenant list example).

## User Endpoints
### 10. List Users (tenant-aware)
- **Method**: `GET`
- **Endpoint**: `/users?tenantId=&role=&isActive=&search=&page=&limit=`
- **Auth**: Bearer (`super_admin` may specify `tenantId`)
- **Response**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user1@demo.com",
        "fullName": "Demo User One",
        "role": "user",
        "isActive": true,
        "tenantId": "uuid",
        "createdAt": "2025-12-24T12:15:00.000Z"
      }
    ],
    "total": 3,
    "pagination": { "currentPage": 1, "totalPages": 1, "limit": 50 }
  }
}
```

### 11. Update User Profile
- **Method**: `PUT`
- **Endpoint**: `/users/:userId`
- **Auth**: User themselves, tenant admin, or super admin
- **Body**:
```json
{
  "fullName": "Updated Name",
  "role": "tenant_admin",
  "isActive": true
}
```
- **Response**: `{ "success": true, "message": "User updated successfully", "data": { "id": "uuid", "role": "tenant_admin", "isActive": true } }`

### 12. Change User Role
- **Method**: `PATCH`
- **Endpoint**: `/users/:userId/role`
- **Auth**: `tenant_admin` (same tenant) or `super_admin`
- **Body**: `{ "role": "user" }`
- **Response**: `{ "success": true, "data": { "id": "uuid", "role": "user", "updatedAt": "..." } }`

### 13. Toggle User Status
- **Method**: `PATCH`
- **Endpoint**: `/users/:userId/status`
- **Auth**: `tenant_admin` or `super_admin`
- **Body**: `{ "isActive": false }`
- **Response**: `{ "success": true, "data": { "id": "uuid", "isActive": false } }`

### 14. Delete User
- **Method**: `DELETE`
- **Endpoint**: `/users/:userId`
- **Auth**: `tenant_admin` (cannot delete self) or `super_admin`
- **Response**: `{ "success": true, "message": "User deleted successfully" }`

## Project Endpoints
### 15. Create Project
- **Method**: `POST`
- **Endpoint**: `/projects`
- **Auth**: Tenant member
- **Body**:
```json
{
  "name": "Q1 Launch",
  "description": "Ship the onboarding revamp",
  "status": "active"
}
```
- **Response** `201` returns the project record including creator info.

### 16. List Projects
- **Method**: `GET`
- **Endpoint**: `/projects?tenantId=&status=&search=&page=&limit=`
- **Auth**: Tenant member (`super_admin` may pass `tenantId`)
- **Response** includes `projects` array with `taskCount` and `completedTaskCount` plus pagination.

### 17. Project Details
- **Method**: `GET`
- **Endpoint**: `/projects/:projectId`
- **Auth**: Same tenant or `super_admin`
- **Response** includes project metadata, creator, tenant, `_count.tasks`.

### 18. Update Project
- **Method**: `PUT`
- **Endpoint**: `/projects/:projectId`
- **Auth**: Project creator, tenant admin, or `super_admin`
- **Body**:
```json
{
  "name": "Q1 Launch - Phase 2",
  "description": "Expand rollout",
  "status": "in_progress"
}
```
- **Response**: Updated project record with success message.

### 19. Delete Project
- **Method**: `DELETE`
- **Endpoint**: `/projects/:projectId`
- **Auth**: Project creator, tenant admin, or `super_admin`
- **Response**: `{ "success": true, "message": "Project deleted successfully" }`

### 20. Create Task (within project)
- **Method**: `POST`
- **Endpoint**: `/projects/:projectId/tasks`
- **Auth**: Tenant member with access to project
- **Body**:
```json
{
  "title": "Kickoff call",
  "description": "Schedule with stakeholders",
  "priority": "high",
  "assignedTo": "user-uuid",
  "dueDate": "2025-12-31"
}
```
- **Response** `201` returns full task record with assignee info.

### 21. List Tasks for Project
- **Method**: `GET`
- **Endpoint**: `/projects/:projectId/tasks?status=&priority=&assignedTo=&search=&page=&limit=`
- **Auth**: Tenant member
- **Response**: Task array with pagination info.

## Task Endpoints (standalone)
### 22. Update Task Status
- **Method**: `PATCH`
- **Endpoint**: `/tasks/:taskId/status`
- **Auth**: Tenant member (same tenant) or `super_admin`
- **Body**: `{ "status": "completed" }`
- **Response**: `{ "success": true, "data": { "id": "uuid", "status": "completed", "updatedAt": "..." } }`

### 23. Update Task
- **Method**: `PUT`
- **Endpoint**: `/tasks/:taskId`
- **Auth**: Tenant member (same tenant) or `super_admin`
- **Body**:
```json
{
  "title": "QA Sign-off",
  "description": "Verify acceptance tests",
  "status": "in_progress",
  "priority": "medium",
  "assignedTo": "user-uuid",
  "dueDate": "2026-01-05"
}
```
- **Response**: Updated task record with assignee info.

## Authentication Notes
- Acquire JWT via `/auth/login` and include `Authorization: Bearer <token>` header.
- `super_admin` users can query across tenants (e.g., `GET /users?tenantId=...`).
- Tenant admins can invite users, manage roles/status, projects, and tasks.
- Audit logs automatically capture every mutation (register, login, CRUD) with tenant context.
- `500` – unexpected server error.

Refer to `submission.json` for ready-to-use credentials during evaluation.
