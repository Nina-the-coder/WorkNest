# WorkNest Authorization & Routing - Testing Guide

## Overview

This document provides comprehensive testing instructions for the new authorization and routing architecture implemented in WorkNest.

## Test Environment Setup

### Prerequisites

- Backend running on http://localhost:5000 (or configured port)
- Frontend running on http://localhost:5173 (or configured Vite port)
- MongoDB connection active
- Test users created (see below)

### Create Test Users (via direct database or registration)

**Admin User:**

```json
{
  "email": "admin@test.com",
  "password": "password123",
  "name": "Admin User",
  "role": "admin"
}
```

**Employee User:**

```json
{
  "email": "employee@test.com",
  "password": "password123",
  "name": "Employee User",
  "role": "employee"
}
```

---

## Frontend Testing

### 1. Authentication & Login

- [ ] Navigate to http://localhost:5173
- [ ] Login page displays (/login)
- [ ] Login with admin@test.com / password123
- [ ] Token and user (with permissions) stored in localStorage
- [ ] Redirected to /admin/dashboard
- [ ] Logout and login with employee user
- [ ] Redirected to /employee/dashboard

### 2. Permission-Aware Navigation

#### Admin User Navigation

Login as admin@test.com and verify:

- [ ] Sidebar shows: Dashboard, Employees, Tasks, Products, Customers, Quotations, Orders, Profile
- [ ] All navigation links are clickable
- [ ] Clicking each link navigates correctly (no 403 errors from backend)

#### Employee User Navigation

Login as employee@test.com and verify:

- [ ] Sidebar shows only: Dashboard, Customers, Products, Orders, Quotations, Profile
- [ ] ⚠️ NO "Employees", "Tasks" menu items visible (employees lack EMPLOYEE_READ and TASK_READ)
- [ ] Clicking "Customers" works (has CUSTOMER_READ permission)
- [ ] Clicking "Products" works (has PRODUCT_READ permission)

### 3. ProtectedRoute Component

- [ ] Unauthenticated user: Accessing /admin/dashboard redirects to / (login)
- [ ] Clear localStorage completely and try to access /admin/\* → redirects to /
- [ ] Authenticated admin accessing /admin/dashboard → renders correctly
- [ ] Authenticated employee accessing /admin/employees → redirects to /unauthorized
- [ ] /unauthorized page displays with "Access Denied" message

### 4. Error Page

- [ ] Navigate to /unauthorized in browser
- [ ] Page displays: "403 Access Denied" title
- [ ] Two buttons: "Go to Dashboard" and "Go Back"
- [ ] "Go to Dashboard" button navigates to /admin/dashboard (or /employee/dashboard based on role)

---

## Backend Testing - API Authorization

### Setup: Get Tokens

**Get Admin Token:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'
```

Response includes:

```json
{
  "token": "eyJhbGc...",
  "user": {
    "_id": "...",
    "name": "Admin User",
    "email": "admin@test.com",
    "role": "admin",
    "permissions": [
      "CUSTOMER_READ",
      "CUSTOMER_CREATE",
      "CUSTOMER_UPDATE",
      "CUSTOMER_ARCHIVE",
      "PRODUCT_READ",
      "PRODUCT_CREATE",
      "PRODUCT_UPDATE",
      "PRODUCT_ARCHIVE",
      "EMPLOYEE_READ",
      "EMPLOYEE_CREATE",
      "EMPLOYEE_UPDATE",
      "EMPLOYEE_ARCHIVE",
      "TASK_READ",
      "TASK_CREATE",
      "TASK_UPDATE",
      "TASK_DELETE",
      "ORDER_READ",
      "ORDER_CREATE",
      "ORDER_UPDATE",
      "ORDER_ARCHIVE",
      "QUOTATION_READ",
      "QUOTATION_CREATE",
      "QUOTATION_UPDATE",
      "QUOTATION_SUBMIT",
      "QUOTATION_APPROVE",
      "QUOTATION_REJECT",
      "QUOTATION_ARCHIVE",
      "DASHBOARD_READ"
    ]
  }
}
```

**Get Employee Token:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@test.com","password":"password123"}'
```

Response includes limited permissions:

```json
{
  "permissions": [
    "CUSTOMER_READ",
    "PRODUCT_READ",
    "TASK_READ",
    "ORDER_READ",
    "QUOTATION_READ",
    "QUOTATION_CREATE",
    "QUOTATION_UPDATE",
    "DASHBOARD_READ"
  ]
}
```

### Test 1: Authentication Required

#### 1.1 - No Token (401 Unauthorized)

```bash
curl -X GET http://localhost:5000/api/customers
```

Expected response (401):

```json
{
  "message": "No token provided..."
}
```

#### 1.2 - Invalid Token (401 Unauthorized)

```bash
curl -X GET http://localhost:5000/api/customers \
  -H "Authorization: Bearer invalid-token"
```

Expected response (401):

```json
{
  "message": "Invalid or expired token"
}
```

### Test 2: Permission-Based Access Control

#### 2.1 - ADMIN Reading Customers (200 OK)

```bash
# Using admin token
curl -X GET http://localhost:5000/api/customers \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected: 200 OK with customer list

#### 2.2 - EMPLOYEE Reading Customers (200 OK)

```bash
# Employee has CUSTOMER_READ permission
curl -X GET http://localhost:5000/api/customers \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN"
```

Expected: 200 OK with customer list

#### 2.3 - EMPLOYEE Creating Customer (403 Forbidden)

```bash
# Employee lacks CUSTOMER_CREATE permission
curl -X POST http://localhost:5000/api/customers \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Customer"}'
```

Expected response (403):

```json
{
  "message": "Insufficient permissions for this action",
  "requiredPermissions": ["CUSTOMER_CREATE"]
}
```

### Test 3: Resource-Specific Operations

#### 3.1 - CUSTOMER_READ (GET)

- [ ] Admin: ✅ Can GET /api/customers
- [ ] Employee: ✅ Can GET /api/customers

#### 3.2 - CUSTOMER_UPDATE (PUT)

```bash
# Admin can update
curl -X PUT http://localhost:5000/api/customers/:customerId \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'
```

Expected: 200 OK

```bash
# Employee cannot update (lacks CUSTOMER_UPDATE)
curl -X PUT http://localhost:5000/api/customers/:customerId \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'
```

Expected: 403 Forbidden

#### 3.3 - CUSTOMER_ARCHIVE (DELETE)

```bash
# Admin can delete
curl -X DELETE http://localhost:5000/api/customers/:customerId \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected: 200 OK

```bash
# Employee cannot delete (lacks CUSTOMER_ARCHIVE)
curl -X DELETE http://localhost:5000/api/customers/:customerId \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN"
```

Expected: 403 Forbidden

### Test 4: Product Management

#### 4.1 - PRODUCT_READ (GET)

- [ ] Admin: ✅ Can GET /api/products
- [ ] Employee: ✅ Can GET /api/products

#### 4.2 - PRODUCT_CREATE (POST)

```bash
# Admin can create
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "name=Product" -F "price=100" -F "image=@file.jpg"
```

Expected: 201 Created

```bash
# Employee cannot create (lacks PRODUCT_CREATE)
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -F "name=Product" -F "price=100" -F "image=@file.jpg"
```

Expected: 403 Forbidden

### Test 5: Employee Management (Admin-Only)

#### 5.1 - EMPLOYEE_READ

- [ ] Admin: ✅ Can GET /api/employees
- [ ] Employee: ❌ Cannot GET /api/employees (403 Forbidden)

#### 5.2 - EMPLOYEE_CREATE

```bash
# Employee cannot create other employees
curl -X POST http://localhost:5000/api/employees \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Emp","email":"emp@test.com","role":"employee"}'
```

Expected: 403 Forbidden

#### 5.3 - EMPLOYEE_UPDATE

```bash
# Employee cannot update employees
curl -X PUT http://localhost:5000/api/employees/:empId \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated"}'
```

Expected: 403 Forbidden

### Test 6: Task Management

#### 6.1 - TASK_READ

- [ ] Admin: ✅ Can GET /api/tasks
- [ ] Employee: ✅ Can GET /api/tasks

#### 6.2 - TASK_CREATE

```bash
# Admin can create tasks
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Task 1"}'
```

Expected: 201 Created

```bash
# Employee cannot create tasks (lacks TASK_CREATE)
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Task 1"}'
```

Expected: 403 Forbidden

### Test 7: Order Management

#### 7.1 - ORDER_READ

- [ ] Admin: ✅ Can GET /api/orders
- [ ] Employee: ✅ Can GET /api/orders

#### 7.2 - ORDER_UPDATE (status changes)

```bash
# Admin can update order status
curl -X PUT http://localhost:5000/api/orders/:orderId \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

Expected: 200 OK

```bash
# Employee cannot update order status (lacks ORDER_UPDATE)
curl -X PUT http://localhost:5000/api/orders/:orderId \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

Expected: 403 Forbidden

### Test 8: Quotation Management

#### 8.1 - QUOTATION_READ

- [ ] Admin: ✅ Can GET /api/quotations
- [ ] Employee: ✅ Can GET /api/quotations

#### 8.2 - Future quotation endpoints (when implemented)

Will require: QUOTATION_CREATE, QUOTATION_UPDATE, QUOTATION_SUBMIT, QUOTATION_APPROVE, QUOTATION_REJECT, QUOTATION_ARCHIVE

### Test 9: Dashboard

#### 9.1 - DASHBOARD_READ

- [ ] Admin: ✅ Can GET /api/dashboard/dashboard-metrics
- [ ] Employee: ✅ Can GET /api/dashboard/dashboard-metrics

### Test 10: Registration (Admin-Only)

#### 10.1 - Unauthenticated cannot register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@test.com","password":"password123"}'
```

Expected: 401 Unauthorized

#### 10.2 - Employee cannot register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"new@test.com","password":"password123"}'
```

Expected: 403 Forbidden (not admin role)

#### 10.3 - Admin can register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"new@test.com","password":"password123","name":"New User","role":"employee"}'
```

Expected: 201 Created

---

## Test Checklist - Summary

### Authentication Tests

- [ ] Login returns user with permissions array
- [ ] No token = 401 Unauthorized
- [ ] Invalid token = 401 Unauthorized
- [ ] Expired token = 401 Unauthorized
- [ ] Valid token allows access

### Authorization Tests

- [ ] Admin has all permissions
- [ ] Employee has limited permissions
- [ ] Missing permission = 403 Forbidden
- [ ] Permission message includes required permissions

### Frontend Tests

- [ ] Navigation shows permission-based items
- [ ] Unauthorized page (403) works
- [ ] ProtectedRoute redirects unauthenticated users
- [ ] ProtectedRoute redirects unauthorized users to /unauthorized
- [ ] localStorage contains user with permissions

### API Tests (All Resources)

- [ ] GET (READ): Authorized users can read
- [ ] POST (CREATE): Only authorized users can create
- [ ] PUT (UPDATE): Only authorized users can update
- [ ] DELETE (ARCHIVE): Only authorized users can delete

---

## Troubleshooting

### Issue: "No token provided" even with token in header

- **Cause:** Authorization header format incorrect
- **Fix:** Ensure format is: `Authorization: Bearer <token>` (with space)

### Issue: 403 Forbidden instead of expected 200

- **Cause:** User lacks required permission
- **Fix:** Verify user's role and permission mapping in rolePermissions.js

### Issue: Navigation items not hiding for employees

- **Cause:** localStorage doesn't have user.permissions
- **Fix:** Ensure login response includes permissions array (check auth.service.js)

### Issue: ProtectedRoute redirecting to /unauthorized instead of /login

- **Cause:** User is authenticated but lacks permission
- **Fix:** This is correct behavior! Check permission requirements

### Issue: Sidebar not importing permissions utility

- **Cause:** Import path error
- **Fix:** Verify: `import { hasPermission } from "../../utils/permissions";`

---

## Automated Test Examples (Jest)

See `/backEnd/tests/unit/` for existing test structure. To add authorization tests:

```javascript
// Example test structure for authorization
describe("Authorization Middleware", () => {
  test("should reject request without required permission", () => {
    // Mock req with user lacking permission
    // Call requirePermission middleware
    // Expect 403 response
  });

  test("should allow request with required permission", () => {
    // Mock req with user having permission
    // Call requirePermission middleware
    // Call next() and verify it was called
  });
});
```

---

## Future Testing (After Phase 2 - Route Unification)

After migrating to `/app/*` unified routes, add tests for:

- [ ] Same resource routes work for both admin and employee
- [ ] UI/navigation dynamically shows based on permissions
- [ ] Permission-based actions appear/disappear in UI
- [ ] API permissions remain consistent regardless of frontend route

---

## Notes

- All tests assume standardized response format with `statusCode` and `message`
- Use Postman or similar tool for API testing if command line is unavailable
- Token expiration is set to "1d" - update tests if this changes
- Role names are lowercase: "admin", "employee" (case-sensitive in code)
