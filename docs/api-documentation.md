# API Documentation

This document defines the initial REST API contract planned for the Consulting CRM System. It is a design reference for future frontend and backend implementation; no API is implemented in the foundation phase.

## Base URL and Conventions

```txt
/api
```

- Requests and responses use `application/json` unless an endpoint states otherwise.
- Protected endpoints require `Authorization: Bearer <token>`.
- Date-only values use ISO 8601 format (`YYYY-MM-DD`).
- Timestamps returned by the API use ISO 8601 UTC format.
- Collection endpoints use `page` and `limit` for pagination.
- Public endpoints are grouped under `/api/public`.
- Path parameters such as `:id` represent UUID values unless noted otherwise.

## 1. Authentication API

### Login

```http
POST /api/auth/login
```

Request body:

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Response data:

```json
{
  "accessToken": "jwt_token",
  "user": {
    "id": "user_id",
    "fullName": "Admin User",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

### Get Current User

```http
GET /api/auth/me
```

Headers:

```txt
Authorization: Bearer <token>
```

### Logout

```http
POST /api/auth/logout
```

The implementation should either revoke the active session/token or instruct the client to discard it, depending on the JWT session strategy selected during backend development.

## 2. User API

All user-management endpoints are protected. User creation, disabling, and deletion are restricted to administrators.

### Get Users

```http
GET /api/users
```

Query parameters:

- `search`
- `role`: `ADMIN`, `MANAGER`, `STAFF`, or `CUSTOMER`
- `isActive`
- `page`
- `limit`

### Get User Detail

```http
GET /api/users/:id
```

### Create User

```http
POST /api/users
```

Request body:

```json
{
  "fullName": "Staff User",
  "email": "staff@example.com",
  "password": "password123",
  "phone": "0123456789",
  "role": "STAFF"
}
```

### Update User

```http
PATCH /api/users/:id
```

### Disable User

```http
PATCH /api/users/:id/disable
```

Disabling a user sets `isActive` to `false` while retaining historical ownership and audit data.

### Delete User

```http
DELETE /api/users/:id
```

Deletion should be rejected when retaining the user is necessary for related cases, tasks, documents, news, or activity logs. Disabling is the preferred operation in that situation.

## 3. Customer API

Customer endpoints are protected and available according to role and assignment rules.

### Get Customers

```http
GET /api/customers
```

Query parameters:

- `search`
- `source`
- `page`
- `limit`

### Get Customer Detail

```http
GET /api/customers/:id
```

### Create Customer

```http
POST /api/customers
```

Request body:

```json
{
  "fullName": "Nguyen Van A",
  "phone": "0909000000",
  "email": "customer@example.com",
  "address": "Ho Chi Minh City",
  "identityNumber": "012345678901",
  "birthday": "2000-01-01",
  "source": "Website",
  "note": "Customer needs legal consulting."
}
```

### Update Customer

```http
PATCH /api/customers/:id
```

### Delete Customer

```http
DELETE /api/customers/:id
```

Deletion should be restricted when the customer has related cases, appointments, or documents. Archival or a future soft-delete policy is preferred for production use.

## 4. Service API

### Get Public Services

```http
GET /api/public/services
```

Returns active services and does not require authentication.

### Get Admin Services

```http
GET /api/services
```

### Get Service Detail

```http
GET /api/services/:id
```

### Create Service

```http
POST /api/services
```

Request body:

```json
{
  "name": "Legal Consulting",
  "slug": "legal-consulting",
  "description": "Professional legal consulting service.",
  "icon": "scale"
}
```

### Update Service

```http
PATCH /api/services/:id
```

### Delete Service

```http
DELETE /api/services/:id
```

Services referenced by requests or cases should be deactivated by setting `isActive` to `false` rather than deleted.

## 5. Consultation Request API

### Submit Consultation Request

```http
POST /api/public/consultation-requests
```

This endpoint is public.

Request body:

```json
{
  "fullName": "Nguyen Van A",
  "phone": "0909000000",
  "email": "customer@example.com",
  "serviceId": "service_id",
  "message": "I need consulting support."
}
```

New requests receive the default status `NEW`.

### Get Consultation Requests

```http
GET /api/consultation-requests
```

Query parameters:

- `status`: `NEW`, `CONTACTED`, `CONVERTED`, or `CLOSED`
- `serviceId`
- `search`
- `page`
- `limit`

### Get Request Detail

```http
GET /api/consultation-requests/:id
```

### Update Request Status

```http
PATCH /api/consultation-requests/:id/status
```

Request body:

```json
{
  "status": "CONTACTED"
}
```

### Convert Request to Customer

```http
POST /api/consultation-requests/:id/convert-to-customer
```

Creates or links a customer record and marks the request as `CONVERTED`.

### Convert Request to Case Profile

```http
POST /api/consultation-requests/:id/convert-to-case
```

Creates or links the customer before creating a case profile. The operation should be transactional and should mark the request as `CONVERTED` only after successful completion.

## 6. Case Profile API

All case endpoints are protected. Staff access is limited to assigned cases unless elevated by role.

### Get Case Profiles

```http
GET /api/cases
```

Query parameters:

- `search`
- `status`: `RECEIVED`, `VERIFYING`, `PROPOSING_SOLUTION`, `PROCESSING`, `COMPLETED`, or `CANCELLED`
- `priority`: `LOW`, `MEDIUM`, `HIGH`, or `URGENT`
- `serviceId`
- `assignedToId`
- `page`
- `limit`

### Get Overdue Cases

```http
GET /api/cases/overdue
```

Returns incomplete cases whose deadline is earlier than the current date. Backend routing should register this static route before `GET /api/cases/:id`.

### Get Case Detail

```http
GET /api/cases/:id
```

### Create Case Profile

```http
POST /api/cases
```

Request body:

```json
{
  "customerId": "customer_id",
  "serviceId": "service_id",
  "assignedToId": "staff_id",
  "title": "Land legal consulting case",
  "description": "Customer needs support with real estate documents.",
  "priority": "HIGH",
  "deadline": "2026-07-30"
}
```

The backend generates a unique `caseCode`; the initial status defaults to `RECEIVED`.

### Update Case Profile

```http
PATCH /api/cases/:id
```

### Update Case Status

```http
PATCH /api/cases/:id/status
```

Request body:

```json
{
  "status": "VERIFYING",
  "note": "Documents are being verified."
}
```

Each successful status change creates a case history record with the old status, new status, acting user, and optional note.

### Assign Staff to Case

```http
PATCH /api/cases/:id/assign
```

Request body:

```json
{
  "assignedToId": "staff_id"
}
```

### Get Case History

```http
GET /api/cases/:id/history
```

### Delete Case Profile

```http
DELETE /api/cases/:id
```

Deletion should be restricted when retention is required for history, documents, appointments, tasks, or audit records.

## 7. Appointment API

### Submit Public Appointment Request

```http
POST /api/public/appointments
```

This endpoint supports the public appointment form. The backend should match or create a customer record from the submitted contact details before creating the appointment.

Request body:

```json
{
  "fullName": "Nguyen Van A",
  "phone": "0909000000",
  "email": "customer@example.com",
  "appointmentDate": "2026-07-05",
  "startTime": "09:00",
  "method": "OFFLINE",
  "message": "Initial consultation appointment."
}
```

Public submissions receive the default status `PENDING`.

### Get Appointments

```http
GET /api/appointments
```

Query parameters:

- `date`
- `status`: `PENDING`, `CONFIRMED`, `COMPLETED`, or `CANCELLED`
- `staffId`
- `customerId`
- `page`
- `limit`

### Get Appointment Detail

```http
GET /api/appointments/:id
```

### Create Appointment

```http
POST /api/appointments
```

Request body:

```json
{
  "customerId": "customer_id",
  "caseProfileId": "case_id",
  "staffId": "staff_id",
  "appointmentDate": "2026-07-05",
  "startTime": "09:00",
  "endTime": "10:00",
  "method": "OFFLINE",
  "note": "Initial consultation appointment."
}
```

Supported appointment methods are `OFFLINE`, `ONLINE`, and `PHONE`.

### Update Appointment

```http
PATCH /api/appointments/:id
```

### Update Appointment Status

```http
PATCH /api/appointments/:id/status
```

Request body:

```json
{
  "status": "CONFIRMED"
}
```

Rescheduling is handled by updating `appointmentDate`, `startTime`, and `endTime` through the general update endpoint.

### Delete Appointment

```http
DELETE /api/appointments/:id
```

## 8. Task API

### Get Tasks

```http
GET /api/tasks
```

Query parameters:

- `status`: `TODO`, `IN_PROGRESS`, `DONE`, or `CANCELLED`
- `priority`: `LOW`, `MEDIUM`, `HIGH`, or `URGENT`
- `assignedToId`
- `caseProfileId`
- `page`
- `limit`

### Get Task Detail

```http
GET /api/tasks/:id
```

### Create Task

```http
POST /api/tasks
```

Request body:

```json
{
  "caseProfileId": "case_id",
  "title": "Verify customer documents",
  "description": "Check uploaded identity document and legal papers.",
  "assignedToId": "staff_id",
  "priority": "HIGH",
  "deadline": "2026-07-10"
}
```

The authenticated user is recorded as `createdById`; the initial status defaults to `TODO`.

### Update Task

```http
PATCH /api/tasks/:id
```

### Update Task Status

```http
PATCH /api/tasks/:id/status
```

Request body:

```json
{
  "status": "IN_PROGRESS"
}
```

### Delete Task

```http
DELETE /api/tasks/:id
```

## 9. Document API

### Upload Document

```http
POST /api/documents/upload
```

Content type:

```txt
multipart/form-data
```

Form data:

- `file` (required)
- `customerId` (optional when `caseProfileId` is supplied)
- `caseProfileId` (optional when `customerId` is supplied)
- `fileType`: `IDENTITY_DOCUMENT`, `REAL_ESTATE_DOCUMENT`, `CONTRACT`, `LEGAL_DOCUMENT`, `CONSTRUCTION_DOCUMENT`, or `OTHER`

At least one of `customerId` or `caseProfileId` should be supplied. File type, MIME type, and size must be validated before storage.

### Get Documents

```http
GET /api/documents
```

Query parameters:

- `customerId`
- `caseProfileId`
- `fileType`
- `page`
- `limit`

### Get Document Detail

```http
GET /api/documents/:id
```

### Delete Document

```http
DELETE /api/documents/:id
```

Deleting a document should remove or archive both its stored file and metadata according to the selected storage policy.

## 10. Dashboard API

Dashboard endpoints are protected and intended for managers and administrators unless a narrower staff view is explicitly implemented.

### Get Overview Statistics

```http
GET /api/dashboard/overview
```

Response data example:

```json
{
  "totalCustomers": 120,
  "totalCases": 86,
  "processingCases": 24,
  "completedCases": 48,
  "overdueCases": 5,
  "todayAppointments": 8
}
```

### Get Cases by Status

```http
GET /api/dashboard/cases-by-status
```

### Get Cases by Month

```http
GET /api/dashboard/cases-by-month
```

### Get Staff Performance

```http
GET /api/dashboard/staff-performance
```

### Get Upcoming Deadlines

```http
GET /api/dashboard/upcoming-deadlines
```

## 11. News API

### Get Public News

```http
GET /api/public/news
```

Returns published articles and does not require authentication.

### Get Public News Detail

```http
GET /api/public/news/:slug
```

### Get Admin News

```http
GET /api/news
```

### Create News

```http
POST /api/news
```

### Update News

```http
PATCH /api/news/:id
```

### Delete News

```http
DELETE /api/news/:id
```

Admin list and mutation endpoints support the `DRAFT`, `PUBLISHED`, and `ARCHIVED` publication statuses.

## 12. Project Gallery API

### Get Public Projects

```http
GET /api/public/projects
```

Returns published gallery items and does not require authentication.

### Get Public Project Detail

```http
GET /api/public/projects/:slug
```

### Get Admin Projects

```http
GET /api/projects
```

### Create Project

```http
POST /api/projects
```

### Update Project

```http
PATCH /api/projects/:id
```

### Delete Project

```http
DELETE /api/projects/:id
```

Admin list and mutation endpoints support the `DRAFT`, `PUBLISHED`, and `ARCHIVED` publication statuses.

## 13. Activity Log API

### Get Activity Logs

```http
GET /api/activity-logs
```

Query parameters:

- `userId`
- `action`
- `entityType`
- `page`
- `limit`

Activity logs are read-only through the API and should be visible only to authorized managers and administrators. Log records are created by backend services when auditable operations succeed.

## 14. API Response Format

Successful response:

```json
{
  "success": true,
  "message": "Request completed successfully.",
  "data": {}
}
```

Paginated collection response:

```json
{
  "success": true,
  "message": "Records retrieved successfully.",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

Validation error response:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "message": "Email must be valid."
    }
  ]
}
```

Recommended HTTP status codes:

- `200 OK`: successful read or update
- `201 Created`: successful creation
- `204 No Content`: successful deletion with no response body
- `400 Bad Request`: invalid request syntax or business rule
- `401 Unauthorized`: missing or invalid authentication
- `403 Forbidden`: insufficient permission
- `404 Not Found`: resource not found
- `409 Conflict`: duplicate or conflicting resource state
- `422 Unprocessable Content`: field validation failure
- `500 Internal Server Error`: unexpected server failure

## 15. Authentication and Authorization Notes

- Public service, news, project, consultation-request, and appointment-request endpoints do not require authentication.
- All other endpoints require a valid JWT access token.
- Administrators can access all modules and manage users.
- Managers can monitor operations, assign work, and access reports and activity logs.
- Staff can access customers, cases, appointments, tasks, and documents permitted by assignment rules.
- A customer portal and customer-authenticated endpoints are deferred to a future version.
- Authorization must be enforced by the backend; hiding UI actions is not a security control.
- Sensitive fields, including `passwordHash`, must never be returned by the API.

## 16. Implementation Notes

- Validate request bodies, query parameters, and uploaded files at the API boundary.
- Normalize pagination, filtering, sorting, error handling, and response envelopes across modules.
- Record important mutations in `ActivityLog`.
- Use database transactions for multi-record operations such as request conversion.
- Prevent duplicate slugs, user emails, and case codes through both validation and database constraints.
- Apply rate limiting and abuse protection to login and public form endpoints.
- Final field-level permissions, refresh-token handling, file-storage rules, and deletion policies will be decided during backend implementation.
