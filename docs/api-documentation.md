# API Documentation

This document defines the REST API contract for the Consulting CRM System. It
started as a design reference and now tracks the implemented portfolio API for
auth, workspace signup, workspace settings, workspace invitations, CRM workflows,
internal users, documents, dashboard, reports, and the Organization / Workspace tenant
foundation. Step 30 adds the Admin/Manager Activity Center and customer-safe
Portal Updates feed. Step 31 adds security header, rate-limit, token-purpose,
redaction, audit, and production smoke documentation.

## Base URL and Conventions

```txt
/api
```

- Requests and responses use `application/json` unless an endpoint states otherwise.
- Protected endpoints require `Authorization: Bearer <token>`.
- Date-only values use ISO 8601 format (`YYYY-MM-DD`).
- Timestamps returned by the API use ISO 8601 UTC format.
- Collection endpoints use `page` and `limit` for pagination.
- Public catalog/intake endpoints are grouped under `/api/public`; public
  invitation preview and accept routes live under `/api/invitations/public`.
- Path parameters such as `:id` represent UUID values unless noted otherwise.
- Protected CRM endpoints are scoped to `request.user.organizationId`.
- The UI may call this concept Workspace; the backend data model calls it
  `Organization`.
- Clients must not send `organizationId` in body or query payloads. Unknown
  fields are rejected by validation.
- Services remain a global catalog in this step.

Security conventions:

- The API disables `x-powered-by` and uses Helmet security headers including
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and
  `Referrer-Policy: no-referrer`.
- JSON and URL-encoded request bodies are limited to `1mb`. Multipart upload
  size remains controlled by document upload middleware and `MAX_FILE_SIZE_MB`.
- Sensitive route groups are rate-limited. A blocked request returns `429` with
  the generic message `Too many requests. Please try again later.`.
- Rate-limited responses include standard helper headers such as
  `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and
  `Retry-After` when applicable.
- Request logging and error output must redact Bearer tokens, invitation
  tokens, password/token/secret query values, storage URLs, local file paths,
  and upload paths.
- See [Security Hardening](security-hardening.md) and
  [Security RBAC Matrix](security-rbac-matrix.md) for the full Step 31 review.

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
    "organizationId": "organization_id",
    "organization": {
      "id": "organization_id",
      "name": "Advisora Demo Workspace",
      "slug": "advisora-demo"
    },
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

## Workspace Signup API

Public workspace signup is disabled unless the backend environment has:

```env
WORKSPACE_SIGNUP_ENABLED=true
```

### Create Workspace

```http
POST /api/workspaces/signup
```

Request body:

```json
{
  "workspaceName": "Acme Advisory Workspace",
  "workspaceSlug": "acme-advisory",
  "industry": "Legal Consulting",
  "website": "https://example.com",
  "phone": "+1 202 555 0100",
  "email": "hello@example.com",
  "address": "Demo office address",
  "ownerFullName": "Acme Demo Owner",
  "ownerEmail": "owner.demo@acme.test",
  "ownerPhone": "+1 202 555 0101",
  "password": "Acme-Demo-Owner-2026!",
  "confirmPassword": "Acme-Demo-Owner-2026!"
}
```

Required fields are `workspaceName`, `ownerFullName`, `ownerEmail`, and
`password`. `confirmPassword` is optional for API clients but must match
`password` when sent.

Slug rules:

- Explicit `workspaceSlug` is normalized to lowercase and may contain only
  lowercase letters, numbers, and hyphens after normalization.
- Explicit duplicate slugs return `409 Conflict`.
- If omitted, the backend generates a slug from `workspaceName` and appends
  `-2`, `-3`, and so on when needed.

Successful response data:

```json
{
  "accessToken": "jwt_token",
  "user": {
    "id": "user_id",
    "organizationId": "organization_id",
    "fullName": "Acme Demo Owner",
    "email": "owner.demo@acme.test",
    "role": "ADMIN",
    "organization": {
      "id": "organization_id",
      "name": "Acme Advisory Workspace",
      "slug": "acme-advisory-workspace"
    }
  },
  "organization": {
    "id": "organization_id",
    "name": "Acme Advisory Workspace",
    "slug": "acme-advisory-workspace"
  }
}
```

Notes:

- The owner user is created as the first active `ADMIN`.
- `User.email` is globally unique in Step 23.
- Client-supplied `role`, `organizationId`, `isActive`, and `passwordHash` are
  rejected.
- `passwordHash` is never returned.
- Public consultation requests still map to `DEFAULT_ORGANIZATION_SLUG`.
- Billing, workspace switching, workspace-specific public portals, and
  customer self-registration remain future roadmap scope.

## Workspace Settings API

Workspace Settings is the administrator-facing profile for the current
Organization tenant. The frontend labels it Workspace.

### Get Current Workspace

```http
GET /api/workspace/me
```

Requires an active `ADMIN`, `MANAGER`, or `STAFF` access token.

Response data:

```json
{
  "workspace": {
    "id": "organization_id",
    "name": "Advisora Demo Workspace",
    "slug": "advisora-demo",
    "industry": "Consulting",
    "website": "https://example.com",
    "phone": "+1 202 555 0100",
    "email": "workspace@example.com",
    "address": "Demo office address",
    "logoUrl": "https://example.com/logo.png",
    "isActive": true,
    "createdAt": "2026-07-04T00:00:00.000Z",
    "updatedAt": "2026-07-04T00:00:00.000Z"
  }
}
```

### Update Current Workspace

```http
PATCH /api/workspace/me
```

Requires an active `ADMIN` access token. `MANAGER` and `STAFF` receive `403`.

Request body fields are optional, but at least one field is required:

```json
{
  "name": "Advisora Demo Workspace",
  "slug": "advisora-demo",
  "industry": "Consulting",
  "website": "https://example.com",
  "phone": "+1 202 555 0100",
  "email": "workspace@example.com",
  "address": "Demo office address",
  "logoUrl": "https://example.com/logo.png"
}
```

Rules:

- The server updates only `request.user.organizationId`; clients cannot send
  `organizationId`, `id`, `isActive`, `createdAt`, or `updatedAt`.
- `name` must be 2-120 characters when sent.
- `slug` is normalized to lowercase, trims leading/trailing hyphens, allows
  lowercase letters, numbers, and hyphens only, and must be 3-50 characters.
- Reusing the current workspace slug is allowed; using another workspace slug
  returns `409 Conflict`.
- `website` and `logoUrl` must be valid URLs or empty/null. Logo upload is not
  part of this step.
- Optional `industry`, `email`, `phone`, `address`, `website`, and `logoUrl`
  can be cleared with `""` or `null`.
- Successful updates write `WORKSPACE_UPDATED` to `ActivityLog`.
- Public consultation requests still map to `DEFAULT_ORGANIZATION_SLUG`; this
  endpoint does not change backend environment configuration.

## 2. User API

All user-management endpoints are protected. Internal user management is
restricted to administrators and covers only CRM users: `ADMIN`, `MANAGER`, and
`STAFF`. Public visitors and customer portal accounts are outside this module.
Administrators manage only users in their current workspace. New users are
assigned to the current workspace by the server.

### Get Users

```http
GET /api/users
```

Query parameters:

- `search`
- `role`: `ADMIN`, `MANAGER`, or `STAFF`
- `isActive`: `true` or `false`
- `page`
- `limit`

Response data uses the paginated envelope:

```json
{
  "items": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

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
  "phone": "0123456789",
  "role": "STAFF",
  "password": "temporary-password",
  "isActive": true
}
```

### Update User

```http
PATCH /api/users/:id
```

Allowed fields:

- `fullName`
- `phone`
- `avatarUrl`
- `role`
- `isActive`

Setting `isActive=false` deactivates the account. Reactivate by setting
`isActive=true`.

### Reset User Password

```http
PATCH /api/users/:id/password
```

Request body:

```json
{
  "newPassword": "temporary-password"
}
```

Rules:

- Hard delete is not available in this phase.
- Deactivation is used instead of delete to preserve historical ownership.
- The API prevents the last active administrator from being deactivated or
  demoted.
- User responses never include `passwordHash`.
- User responses belong to the current workspace only.
- `/api/users/assignable` remains available to `ADMIN` and `MANAGER` for
  assignment dropdowns and returns only active internal users in the same
  workspace.

Deletion should be rejected when retaining the user is necessary for related cases, tasks, documents, news, or activity logs. Disabling is the preferred operation in that situation.

## 2.5 Workspace Invitation API

Workspace invitations are for internal CRM users only. Admin endpoints require
an active `ADMIN` account and are scoped to `request.user.organizationId`.
Manager and staff users are blocked by backend authorization.

### List Invitations

```http
GET /api/invitations
```

Query parameters:

- `search`
- `role`: `ADMIN`, `MANAGER`, or `STAFF`
- `status`: `PENDING`, `ACCEPTED`, `REVOKED`, or `EXPIRED`
- `page`
- `limit`

Responses use the paginated envelope and never include `tokenHash`.

### Create Invitation

```http
POST /api/invitations
```

Request body:

```json
{
  "email": "new.staff@example.com",
  "role": "STAFF",
  "expiresInDays": 7,
  "sendEmail": true
}
```

Rules:

- `expiresInDays` defaults to 7 and must be between 1 and 30.
- `sendEmail` defaults to `true`; when false, the invitation is created and
  email delivery returns `DISABLED`.
- Existing global user emails return `409`.
- A duplicate unexpired pending invitation in the same workspace returns `409`.
- The server generates a 32-byte random token and stores only a SHA-256
  `tokenHash`.
- The response returns `invitation`, a one-time `inviteUrl`, and
  `emailDelivery`. The link is available only at create/resend time for manual
  fallback; invitation lists cannot recover old raw tokens or invite URLs.
- `emailDelivery.status` is `DISABLED`, `MOCK_SENT`, `SENT`, or `FAILED`.
  Provider errors are sanitized and email failure does not delete the
  invitation.

### Resend Invitation

```http
POST /api/invitations/:id/resend
```

Request body:

```json
{
  "expiresInDays": 7
}
```

Only current-workspace `PENDING` or `EXPIRED` invitations can be resent.
Resending generates a new raw token, stores a new SHA-256 `tokenHash`, sets the
status to `PENDING`, updates `expiresAt`, and returns a new one-time
`inviteUrl` plus `emailDelivery`. Older invite links immediately stop working.
Accepted and revoked invitations return `409`.

Email provider modes:

- `EMAIL_PROVIDER=console` returns `MOCK_SENT` and logs only masked recipient
  and redacted accept URL metadata.
- `EMAIL_PROVIDER=disabled` returns `DISABLED`.
- `EMAIL_PROVIDER=resend` sends through Resend when `RESEND_API_KEY` and
  `EMAIL_FROM` are configured outside the repo; missing config returns
  `FAILED` without rolling back the invitation.

### Revoke Invitation

```http
PATCH /api/invitations/:id/revoke
```

Only current-workspace `PENDING` invitations can be revoked. Revocation is a
soft state change to `REVOKED`; the record remains for audit and list history.

### Public Invitation Preview

```http
GET /api/invitations/public/:token
```

Preview returns safe invitation details:

```json
{
  "invitation": {
    "email": "new.staff@example.com",
    "role": "STAFF",
    "expiresAt": "2026-07-11T00:00:00.000Z",
    "organization": {
      "id": "<organization-uuid>",
      "name": "Advisora Demo Workspace",
      "slug": "advisora-demo"
    }
  }
}
```

Invalid, expired, revoked, accepted, or inactive-workspace invitations return a
generic public error and do not use `401`, so the frontend does not clear an
unrelated current session.

### Public Invitation Accept

```http
POST /api/invitations/public/:token/accept
```

Request body:

```json
{
  "fullName": "New Staff User",
  "phone": "0123456789",
  "password": "Strong-Password-2026!",
  "confirmPassword": "Strong-Password-2026!"
}
```

Accept creates an active user in the invitation's workspace with the
invitation's role. Clients cannot submit or override `role`, `organizationId`,
`isActive`, or `passwordHash`. Successful accept marks the invitation
`ACCEPTED`, links `acceptedById`, writes an activity log without token data,
and returns `accessToken`, safe `user`, and safe `organization` for auto-login.

## 2.6 Customer Portal API

Customer portal auth is separate from internal CRM auth. Portal accounts use
`CustomerPortalAccount`, and portal JWTs include
`purpose: "customer_portal"`. Internal tokens cannot call portal endpoints, and
portal tokens cannot call internal admin endpoints.

### Portal Login

```http
POST /api/portal/auth/login
```

Request body:

```json
{
  "workspaceSlug": "advisora-demo",
  "email": "customer@example.com",
  "password": "Portal-Password-2026!"
}
```

Successful response data:

```json
{
  "accessToken": "portal_jwt",
  "portalAccount": {
    "id": "portal_account_id",
    "organizationId": "organization_id",
    "customerId": "customer_id",
    "email": "customer@example.com",
    "isActive": true,
    "lastLoginAt": "2026-07-04T00:00:00.000Z",
    "createdAt": "2026-07-04T00:00:00.000Z",
    "updatedAt": "2026-07-04T00:00:00.000Z"
  },
  "customer": {
    "id": "customer_id",
    "fullName": "Nguyen Van A",
    "phone": "0909000000",
    "email": "customer@example.com",
    "address": "Ho Chi Minh City"
  },
  "organization": {
    "id": "organization_id",
    "name": "Advisora Demo Workspace",
    "slug": "advisora-demo"
  }
}
```

Failed portal login returns `401` with the generic message
`Invalid workspace, email, or password.`.

### Current Portal Session

```http
GET /api/portal/auth/me
Authorization: Bearer <portal-token>
```

Returns the same safe `portalAccount`, `customer`, and `organization` data
without a new token.

### Portal Profile

```http
GET /api/portal/me
Authorization: Bearer <portal-token>
```

Returns the safe portal session plus an `overview` object. Step 28 sets
`caseTrackingAvailable=true`; Step 29 adds customer portal document
upload/download through separate portal routes, and Step 30 adds a safe portal
updates feed. Messages, billing, realtime/push notifications, and customer
self-registration remain outside this step.

### Portal Case Summary

```http
GET /api/portal/cases/summary
Authorization: Bearer <portal-token>
```

Returns aggregate case data for the authenticated portal account only:

```json
{
  "totalCases": 3,
  "activeCases": 2,
  "completedCases": 1,
  "cancelledCases": 0,
  "upcomingAppointments": 1,
  "nextAppointment": {
    "id": "appointment_id",
    "appointmentDate": "2026-07-10T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "10:00",
    "method": "ONLINE",
    "status": "CONFIRMED",
    "staff": {
      "id": "user_id",
      "fullName": "Demo Consultant",
      "role": "STAFF"
    }
  },
  "casesByStatus": [],
  "recentCases": []
}
```

### Portal Case List

```http
GET /api/portal/cases?page=1&limit=10&status=PROCESSING&search=CASE
Authorization: Bearer <portal-token>
```

Allowed query fields:

- `page`
- `limit` from 1 to 50
- `status`
- `search` by case code or title

Clients cannot send `organizationId`, `customerId`, `assignedToId`, or staff
filters. The backend always scopes by
`request.customerPortal.portalAccount.organizationId` and `customerId`.

Safe list items include case code, title, status, priority, service summary,
assigned staff summary, timestamps, latest public activity, and safe counts.
They do not include internal case notes, case-history notes, staff email/phone,
document file URLs, token hashes, or password hashes.

### Portal Case Detail

```http
GET /api/portal/cases/:id
Authorization: Bearer <portal-token>
```

The detail lookup requires `id + organizationId + customerId`. A case from
another customer or workspace returns a generic `404`.

Safe detail data includes:

- Case overview fields: `id`, `caseCode`, `title`, `description`, `status`,
  `priority`, service summary, assigned staff summary, timestamps, and
  deadline/completed dates.
- Customer safe summary for the authenticated portal customer.
- Timeline derived from case history action/status fields. Internal history
  `note` values are not returned.
- Appointment safe fields: date, time, method, status, and safe staff summary.
- Portal-visible document metadata only: file name, document type, MIME type,
  size, source, visibility, and creation time. Raw file paths and
  `Document.fileUrl` are never returned.
- Task safe summary: title, status, priority, deadline, and update time.

Portal case endpoints are read-only. There are no portal routes for creating,
editing, assigning, deleting, or status-updating cases, tasks, or appointments.
Documents are handled by the dedicated portal document endpoints below.

### Portal Documents

All portal document endpoints require a customer portal token. Internal CRM
tokens are rejected by portal auth, and portal tokens are rejected by internal
document routes.

```http
GET /api/portal/documents?page=1&limit=10&search=passport
Authorization: Bearer <portal-token>
```

Allowed query fields:

- `page`
- `limit` from 1 to 50
- `search` by file name, case code, or case title
- `caseId`
- `fileType`
- `source`: `INTERNAL` or `CUSTOMER_PORTAL`

The backend always scopes by the portal account's `organizationId` and
`customerId`. If a document is linked to a case, that case must also belong to
the same organization and customer. Returned documents must have
`visibility=CUSTOMER_VISIBLE`. Portal uploads are created with
`source=CUSTOMER_PORTAL` and `visibility=CUSTOMER_VISIBLE` by default, but an
Admin or Manager can hide them later by changing visibility back to
`INTERNAL_ONLY`.

Safe response items include:

```json
{
  "id": "document_id",
  "fileName": "passport.pdf",
  "fileType": "IDENTITY_DOCUMENT",
  "size": 245760,
  "source": "CUSTOMER_PORTAL",
  "visibility": "CUSTOMER_VISIBLE",
  "scanStatus": "CLEAN",
  "caseProfile": {
    "id": "case_id",
    "caseCode": "CASE-2026-001",
    "title": "Property transfer",
    "status": "PROCESSING"
  },
  "uploadedByLabel": "Customer",
  "downloadAvailable": true,
  "downloadUnavailableReason": null,
  "createdAt": "2026-07-05T00:00:00.000Z"
}
```

Portal responses do not include `fileUrl`, `storageKey`, bucket names, object
keys, local paths, raw upload paths, `passwordHash`, `tokenHash`, staff email,
or internal-only documents.

```http
POST /api/portal/documents
Authorization: Bearer <portal-token>
Content-Type: multipart/form-data
```

Form data:

- `file` (required)
- `caseProfileId` (optional; must belong to the portal customer and workspace)
- `fileType` (optional; defaults to `OTHER`)

The customer and organization are taken only from the portal session. Successful
uploads are stored as `source=CUSTOMER_PORTAL`,
`visibility=CUSTOMER_VISIBLE`, and `uploadedByPortalAccountId=<portal account>`.
The backend writes `CUSTOMER_PORTAL_DOCUMENT_UPLOADED`.

```http
GET /api/portal/documents/:id/download
Authorization: Bearer <portal-token>
```

The portal download route is separate from `/api/documents/:id/download`. It
queries the database with organization, customer, visibility, and case-ownership
predicates before resolving the stored object. The backend enforces scan policy
before streaming; `INFECTED` documents and, by default, `FAILED` scans cannot be
downloaded. Unauthorized, hidden, cross-customer, cross-workspace, or missing
documents return a generic `404`. Successful streams write a
`DocumentDownloadAudit` row and update backend/admin `downloadCount` plus
`lastDownloadedAt`.

### Portal Updates

All portal update endpoints require a customer portal token. Internal CRM tokens
are rejected by portal auth, and portal tokens are rejected by internal activity
routes.

```http
GET /api/portal/updates?page=1&limit=20&type=DOCUMENT&caseId=<case-uuid>
Authorization: Bearer <portal-token>
```

Allowed query fields:

- `page`
- `limit` from 1 to 50
- `type`: `CASE`, `APPOINTMENT`, `DOCUMENT`, or `ACCOUNT`
- `caseId` (optional; must belong to the portal customer's workspace and
  customer record)

The backend always scopes by the portal account's `organizationId` and
`customerId`. The optional `caseId` is validated before any update sources are
queried. The feed is normalized from safe `CaseHistory` action/status fields,
appointments, customer-visible documents, document-download audits for the
current portal account, and account readiness. It does not return raw internal
`ActivityLog` rows.

Safe response items include:

```json
{
  "id": "document:document_id",
  "type": "DOCUMENT",
  "title": "A document is now available",
  "description": "A document was shared with you.",
  "occurredAt": "2026-07-05T00:00:00.000Z",
  "entityType": "Document",
  "entityId": "document_id",
  "caseProfile": {
    "id": "case_id",
    "caseCode": "CASE-2026-001",
    "title": "Property transfer"
  },
  "action": "DOCUMENT_AVAILABLE"
}
```

Portal update responses do not include internal notes, raw activity
descriptions, `fileUrl`, file paths, storage keys, object keys, bucket names,
signed URLs, `passwordHash`, `tokenHash`, IP addresses, or user-agent data.
Documents appear only when `visibility=CUSTOMER_VISIBLE` and scoped to the
portal account.

```http
GET /api/portal/updates/summary
Authorization: Bearer <portal-token>
```

The summary returns `totalUpdates`, `latestUpdateAt`, and the latest five safe
updates. Portal Updates are read-only and are not realtime websocket or push
notifications.

## 3. Customer API

Customer endpoints are protected and available according to role and assignment rules.
All customer operations are scoped to the authenticated user's workspace.

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

### Customer Portal Account Management

These endpoints require an internal `ADMIN` or `MANAGER` token. `STAFF` users
receive `403`. All operations are scoped to the internal actor's
`organizationId`.

```http
GET /api/customers/:id/portal-account
POST /api/customers/:id/portal-account
PATCH /api/customers/:id/portal-account/password
PATCH /api/customers/:id/portal-account/deactivate
PATCH /api/customers/:id/portal-account/activate
```

Create request body:

```json
{
  "email": "customer@example.com",
  "password": "Portal-Password-2026!"
}
```

`email` and `password` are optional. If `email` is omitted, the backend uses
the customer email. If `password` is omitted, the backend generates a
temporary password and returns it once as `temporaryPassword`.

Safe response data:

```json
{
  "account": {
    "id": "portal_account_id",
    "organizationId": "organization_id",
    "customerId": "customer_id",
    "email": "customer@example.com",
    "isActive": true,
    "lastLoginAt": null,
    "createdAt": "2026-07-04T00:00:00.000Z",
    "updatedAt": "2026-07-04T00:00:00.000Z"
  },
  "temporaryPassword": "shown-only-when-generated"
}
```

Responses never include `passwordHash`. Create, reset, deactivate, and activate
write activity logs.

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

New requests receive the default status `NEW` and are assigned to the active
workspace configured by `DEFAULT_ORGANIZATION_SLUG`, with `advisora-demo` as
the fallback. Public clients cannot select another workspace.

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

### Planned: Convert Request to Customer

```http
POST /api/consultation-requests/:id/convert-to-customer
```

Planned endpoint; it is not mounted in the current backend route list. The
current release supports request review and status updates, but
request-to-customer conversion remains future work.

### Planned: Convert Request to Case Profile

```http
POST /api/consultation-requests/:id/convert-to-case
```

Planned endpoint; it is not mounted in the current backend route list. When
implemented, it should create or link the customer before creating a case
profile and mark the request as `CONVERTED` only after a successful
transaction.

## 6. Case Profile API

All case endpoints are protected and scoped to the authenticated user's
workspace. Staff access is further limited to assigned cases unless elevated by
role.

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

### Planned: Submit Public Appointment Request

```http
POST /api/public/appointments
```

Planned endpoint; it is not mounted in the current backend route list. In the
current release, the public appointment page is a frontend validation/demo
flow. When implemented, the backend should match or create a customer record
from submitted contact details before creating the appointment.

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
Internal uploads default to `source=INTERNAL` and `visibility=INTERNAL_ONLY`.
Uploads use the configured storage provider. `DOCUMENT_STORAGE_PROVIDER=local`
stores server-local objects for development; `s3` stores objects in a private
S3-compatible bucket. The API stores generated object keys internally and does
not return them to clients.

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

### Download Document

```http
GET /api/documents/:id/download
```

This route uses internal CRM auth only. Customer portal downloads must use
`/api/portal/documents/:id/download`.

The backend checks internal authorization, scan policy, and object existence
before streaming. Successful streams create `DocumentDownloadAudit` records and
increment `downloadCount`; unsafe scan statuses are blocked before the object is
opened.

### Update Portal Visibility

```http
PATCH /api/documents/:id/portal-visibility
```

Requires `ADMIN` or `MANAGER`.

Request body:

```json
{
  "visibility": "CUSTOMER_VISIBLE"
}
```

Allowed values are `INTERNAL_ONLY` and `CUSTOMER_VISIBLE`. The endpoint never
changes the stored file, customer, case, or organization. Visibility changes
write `DOCUMENT_PORTAL_VISIBILITY_UPDATED`.

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

## 11. Planned News API

The current release renders public news pages from typed frontend content. The
backend CMS-style news endpoints below are planned and are not mounted in the
current backend route list.

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

## 12. Planned Project Gallery API

The current release renders public project/gallery pages from typed frontend
content. The backend CMS-style project endpoints below are planned and are not
mounted in the current backend route list.

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

## 13. Activity Center API

The Activity Center is an internal Admin/Manager workspace audit view. It uses
the authenticated user's workspace as the tenant boundary; clients cannot send
`organizationId` in query or body payloads.

### Get Activity

```http
GET /api/activity?page=1&limit=20&sort=newest
Authorization: Bearer <internal-token>
```

Query parameters:

- `page` default `1`
- `limit` default `20`, maximum `100`
- `action` optional, maximum 100 characters
- `entityType` optional, maximum 100 characters
- `actorUserId` optional UUID
- `search` optional, maximum 100 characters
- `fromDate` optional ISO/date value
- `toDate` optional ISO/date value
- `sort`: `newest` or `oldest`

Access:

- `ADMIN` and `MANAGER`: allowed for their current workspace.
- `STAFF`: blocked with `403`.

The backend normalizes safe activity items from `ActivityLog`, `CaseHistory`,
`Appointment`, `Task`, `Document`, and `DocumentDownloadAudit`. Every source
query includes `organizationId=request.user.organizationId`, and filters/search
are applied inside that scoped predicate.

Response item shape:

```json
{
  "id": "activity:activity_log_id",
  "action": "WORKSPACE_UPDATED",
  "entityType": "Organization",
  "entityId": "organization_id",
  "description": "Workspace profile updated.",
  "createdAt": "2026-07-05T00:00:00.000Z",
  "actor": {
    "id": "user_id",
    "fullName": "Admin User",
    "role": "ADMIN"
  }
}
```

Descriptions are sanitized before returning. Activity responses must not expose
raw passwords, invite tokens, JWTs, token hashes, storage keys, object keys,
signed URLs, local file paths, bucket names, or environment values.

### Get Activity Summary

```http
GET /api/activity/summary
Authorization: Bearer <internal-token>
```

Returns:

- `totalToday`
- `documentEventsToday`
- `portalEventsToday`
- `caseEventsToday`
- `recentActivities` latest 5

Activity Center endpoints are read-only. Step 30 does not add realtime
websocket, push notification, email notification automation, or complex
notification preferences.

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
- `429 Too Many Requests`: rate limit exceeded for auth, public, invitation,
  upload, or download route groups
- `422 Unprocessable Content`: field validation failure
- `500 Internal Server Error`: unexpected server failure

Rate-limited endpoint groups:

| Group | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/login`, `POST /api/portal/auth/login`, `POST /api/workspaces/signup` |
| Public | `POST /api/public/consultation-requests` |
| Invitation | `POST /api/invitations`, `POST /api/invitations/:id/resend`, `GET /api/invitations/public/:token`, `POST /api/invitations/public/:token/accept` |
| Upload | `POST /api/documents/upload`, `POST /api/portal/documents` |
| Download | `GET /api/documents/:id/download`, `GET /api/portal/documents/:id/download` |

## 15. Authentication and Authorization Notes

- Public service, news, project, consultation-request, and appointment-request endpoints do not require authentication.
- All other endpoints require a valid JWT access token.
- Administrators can access all modules and manage users.
- Managers can monitor operations, assign work, and access reports and activity logs.
- Staff can access customers, cases, appointments, tasks, and documents permitted by assignment rules.
- Organization / Workspace isolation is enforced by `organizationId` on
  internal users and CRM business records. Dashboard and report aggregates are
  scoped by the current workspace.
- The current demo/staging deployment uses one default workspace:
  `Advisora Demo Workspace` (`advisora-demo`). Workspace signup can create
  additional internal CRM workspaces when `WORKSPACE_SIGNUP_ENABLED=true`.
  Workspace invitations can add later internal users; billing, workspace
  switching, workspace-specific public portals, and customer self-registration
  remain future roadmap scope.
- Customer portal endpoints are separate from internal user endpoints. Portal
  JWTs require `purpose: "customer_portal"`, and portal responses expose only
  safe account, customer, and organization fields.
- Internal JWTs are signed with `purpose: "internal"` in Step 31. Older
  internal JWTs without a purpose remain accepted for compatibility, but portal
  tokens are never accepted by internal middleware.
- Authorization must be enforced by the backend; hiding UI actions is not a security control.
- Sensitive fields, including `passwordHash`, must never be returned by the API.

## 16. Implementation Notes

- Validate request bodies, query parameters, and uploaded files at the API boundary.
- Normalize pagination, filtering, sorting, error handling, and response envelopes across modules.
- Record important mutations in `ActivityLog`.
- Use database transactions for multi-record operations such as request conversion.
- Prevent duplicate slugs, user emails, and case codes through both validation and database constraints.
- Apply rate limiting and abuse protection to login and public form endpoints.
- Field-level permissions, refresh-token handling, protected document downloads, and deletion policies are enforced in backend services and must stay covered by regression tests.
