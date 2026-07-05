# Security RBAC Matrix

This matrix documents the Step 31 access model. Backend authorization is the
source of truth; frontend route hiding is only a usability layer.

## Roles

| Role | Identity source | Token boundary |
| --- | --- | --- |
| `ADMIN` | Internal `User` | Internal JWT, accepted only by internal middleware |
| `MANAGER` | Internal `User` | Internal JWT, accepted only by internal middleware |
| `STAFF` | Internal `User` | Internal JWT, accepted only by internal middleware |
| Customer Portal Account | `CustomerPortalAccount` | Portal JWT with `purpose: "customer_portal"` |
| Public anonymous | No account | No token |

Legend:

- `R` read/list/detail.
- `C` create/upload.
- `U` update/status/toggle/reset.
- `D` delete/revoke/deactivate where implemented.
- `Scoped` means the backend narrows access by assignment, ownership,
  `organizationId`, `customerId`, or case relationship.
- `Blocked` means backend should return `401`, `403`, or generic `404`
  depending on the route and information-disclosure risk.

## Matrix

| Module | Main routes | ADMIN | MANAGER | STAFF | Customer Portal | Public anonymous |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard | `/admin/dashboard`, `/api/dashboard/*` | R workspace | R workspace | R scoped operational data; no staff performance | Blocked | Blocked |
| Customers | `/admin/customers`, `/api/customers` | R/C/U/D workspace | R/C/U/D workspace, subject to service rules | R scoped; mutations constrained by backend rules | Own safe profile via `/api/portal/me` only | Blocked |
| Consultation Requests | `/admin/consultation-requests`, `/api/consultation-requests`, `/api/public/consultation-requests` | R/U workspace, convert flows when implemented | R/U workspace | R/U scoped by backend rules | Blocked | C public consultation request only |
| Cases | `/admin/cases`, `/api/cases` | R/C/U/D workspace | R/C/U/D workspace | R/U scoped to assigned cases; destructive actions constrained | R own read-only cases via `/api/portal/cases` | Blocked |
| Appointments | `/admin/appointments`, `/api/appointments` | R/C/U/D workspace | R/C/U/D workspace | R/U scoped to assigned/self work | R own appointment summaries through portal case/profile/update APIs | Public appointment form is frontend demo only in current backend |
| Tasks | `/admin/tasks`, `/api/tasks` | R/C/U/D workspace | R/C/U/D workspace | R/C/U/D scoped to assignee/creator/assigned case rules | R safe task summaries on own portal case detail | Blocked |
| Documents | `/admin/documents`, `/api/documents` | R/C/U/D workspace; toggle portal visibility | R/C/U/D workspace; toggle portal visibility | R/C/D scoped to uploaded docs or assigned cases; no visibility toggle | Blocked from internal routes | Blocked |
| Activity Center | `/admin/activity`, `/api/activity` | R workspace audit feed | R workspace audit feed | Blocked | Blocked | Blocked |
| Users | `/admin/users`, `/api/users` | R/C/U/reset/deactivate workspace internal users | Blocked except `/api/users/assignable` | Blocked | Blocked | Blocked |
| Invitations | `/admin/invitations`, `/api/invitations` | R/C/resend/revoke workspace invitations | Blocked | Blocked | Blocked | Preview/accept only through `/api/invitations/public/:token` |
| Workspace Settings | `/admin/settings`, `/api/workspace/me` | R/U current workspace | R current workspace only | R current workspace only | Safe workspace summary through portal session | Blocked |
| Portal Cases | `/portal/cases`, `/api/portal/cases` | Blocked from portal API with internal token | Blocked from portal API with internal token | Blocked from portal API with internal token | R own customer cases only | Blocked |
| Portal Documents | `/portal/documents`, `/api/portal/documents` | Blocked from portal API with internal token; use internal document routes instead | Blocked from portal API with internal token; use internal document routes instead | Blocked from portal API with internal token | R/C/download own visible documents only | Blocked |
| Portal Updates | `/portal/updates`, `/api/portal/updates` | Blocked from portal API with internal token | Blocked from portal API with internal token | Blocked from portal API with internal token | R own safe updates only | Blocked |

## Route Guard Notes

- `/admin/activity` is protected by frontend `ProtectedRoute` for
  `ADMIN`/`MANAGER` and backend `authorizeRoles(ADMIN, MANAGER)`.
- `/admin/users`, `/admin/invitations`, and `/admin/settings` are
  `ADMIN`-only in the frontend and backend.
- `/portal/*` protected pages use `PortalProtectedRoute` and `PortalLayout`;
  they do not use `AdminLayout`.
- `/api/portal/*` requires a customer portal token. Internal tokens return
  `401`.
- `/api/documents/*` requires internal auth. Portal tokens return `401`.
- `/api/documents/:id/download` is internal-only.
- `/api/portal/documents/:id/download` is portal-only.
- Public invitation preview/accept routes are token-based and rate-limited.
  They must not log or return token hashes.

## Rate Limit Groups

| Group | Protected routes |
| --- | --- |
| Auth | `POST /api/auth/login`, `POST /api/portal/auth/login`, `POST /api/workspaces/signup` |
| Public | `POST /api/public/consultation-requests` |
| Invitation | `POST /api/invitations`, `POST /api/invitations/:id/resend`, `GET /api/invitations/public/:token`, `POST /api/invitations/public/:token/accept` |
| Upload | `POST /api/documents/upload`, `POST /api/portal/documents` |
| Download | `GET /api/documents/:id/download`, `GET /api/portal/documents/:id/download` |

The current limiter is process-local and IP-based. Use a shared Redis-backed
limiter or equivalent before multi-instance production.

## Tenant Scope Rules

Internal services:

- Use `request.user.organizationId`.
- Ignore or reject client-supplied `organizationId`.
- Return only same-workspace users, customers, cases, appointments, tasks,
  documents, activity logs, and reports.

Portal services:

- Use `request.customerPortal.portalAccount.organizationId`.
- Use `request.customerPortal.portalAccount.customerId`.
- Validate any `caseId` belongs to the same portal customer and organization.
- Return generic `404` for cross-customer, cross-workspace, hidden, or missing
  cases/documents where revealing existence would be unsafe.

Public services:

- Consultation requests map to `DEFAULT_ORGANIZATION_SLUG`.
- Workspace signup is disabled unless `WORKSPACE_SIGNUP_ENABLED=true`.
- Invitation preview/accept uses the hashed-token lookup and invitation
  workspace, not client-supplied role or organization.

## Document Visibility Rules

- Internal document uploads default to `INTERNAL_ONLY`.
- Portal can list/download only `CUSTOMER_VISIBLE` documents scoped to its own
  customer and organization.
- Admin/Manager must explicitly toggle an internal document to
  `CUSTOMER_VISIBLE` before a customer can see it.
- Portal responses must never expose `fileUrl`, `filePath`, raw upload paths,
  `storageKey`, bucket names, object keys, signed URLs, or local paths.
- Portal download must use `/api/portal/documents/:id/download`, never the
  internal admin download route.
- `source=CUSTOMER_PORTAL` is not itself a staff read permission. Staff access
  to portal-uploaded documents through internal APIs still requires uploaded-by
  or assigned-case scope.

## Audit Expectations By Role

| Action family | Expected audit source |
| --- | --- |
| Workspace create/update | `ActivityLog` |
| User create/update/activate/deactivate/password reset | `ActivityLog` |
| Invitation create/resend/revoke/accept | `ActivityLog` |
| Portal account create/reset/activate/deactivate | `ActivityLog` |
| Case status/history | `CaseHistory` |
| Internal and portal document upload | `ActivityLog` |
| Document visibility toggle | `ActivityLog` |
| Successful internal and portal download | `DocumentDownloadAudit` |

Audit descriptions should be generic and redacted. Passwords, tokens, token
hashes, storage paths, object keys, signed URLs, IP addresses, and user-agent
values must not be exposed to portal responses.
