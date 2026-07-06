# Architecture

This document summarizes the Advisora CRM architecture as of the Step 34
portfolio release. It focuses on current implemented behavior and uses Mermaid
diagrams only so the diagrams render directly on GitHub.

## High-Level System Architecture

```mermaid
flowchart TB
  subgraph Browser["Browser / User Surfaces"]
    PublicUI["Public Website\nHome, services, consultation"]
    AdminUI["Admin CRM\nProtectedRoute + AdminLayout"]
    PortalUI["Customer Portal\nPortalProtectedRoute + PortalLayout"]
    AdminClient["Internal API client\nconsulting_crm_access_token"]
    PortalClient["Portal API client\nadvisora_portal_access_token"]
  end

  subgraph Frontend["React/Vite Frontend on Vercel"]
    Router["React Router routes"]
    I18n["i18next EN/VI\nadvisora_locale"]
  end

  subgraph Backend["Express API on Render"]
    Hardening["Security layer\nHelmet, CORS, body limits, rate limits, redaction"]
    PublicRoutes["Public routes\nservices, consultation, invitations"]
    InternalAuth["Internal Auth/RBAC\nJWT purpose internal"]
    PortalAuth["Customer Portal Auth\nJWT purpose customer_portal"]
    Modules["CRM modules\ncustomers, cases, tasks, appointments, docs, dashboard, activity"]
    PortalModules["Portal modules\nprofile, cases, docs, updates"]
    Email["Email provider\nConsole or Resend"]
  end

  subgraph Data["Data and File Layer"]
    Tenant["Multi-tenant Organization scope"]
    Prisma["Prisma ORM"]
    DB[("PostgreSQL / Neon")]
    Storage["Document storage abstraction\nLocal dev/demo or private S3-compatible"]
    Scanner["Scanner and OCR providers\ndisabled, mock, ClamAV, Tesseract-ready"]
    Audit["Activity and audit logs\nActivityLog, CaseHistory, DocumentDownloadAudit"]
  end

  PublicUI --> Router
  AdminUI --> Router
  PortalUI --> Router
  Router --> I18n
  Router --> AdminClient
  Router --> PortalClient
  Router --> PublicRoutes

  AdminClient --> Backend
  PortalClient --> Backend
  PublicRoutes --> Backend

  Backend --> Hardening
  Hardening --> InternalAuth
  Hardening --> PortalAuth
  Hardening --> PublicRoutes
  InternalAuth --> Modules
  PortalAuth --> PortalModules
  PublicRoutes --> Modules

  Modules --> Tenant
  PortalModules --> Tenant
  Tenant --> Prisma
  Prisma --> DB
  Modules --> Storage
  PortalModules --> Storage
  Storage --> Scanner
  Modules --> Audit
  PortalModules --> Audit
  Audit --> DB
  Modules --> Email
```

## Request Flow For Admin CRM

```mermaid
sequenceDiagram
  actor Staff as Admin / Manager / Staff
  participant UI as Admin React route
  participant Client as Internal API client
  participant API as Express /api
  participant Auth as Internal auth middleware
  participant Service as CRM service
  participant Prisma as Prisma ORM
  participant DB as PostgreSQL

  Staff->>UI: Open /admin/*
  UI->>Client: Read consulting_crm_access_token
  Client->>API: Request with internal Bearer token
  API->>Auth: Verify JWT and optional role guard
  Auth-->>API: request.user with organizationId
  API->>Service: Controller validates input and calls service
  Service->>Prisma: Query with organizationId and role scope
  Prisma->>DB: SQL query
  DB-->>Prisma: Same-workspace records
  Prisma-->>Service: Model data
  Service-->>API: Safe DTO or protected file stream
  API-->>UI: JSON, validation error, auth error, or stream

  Note over Auth,Service: Portal-purpose JWTs are rejected by internal auth.
  Note over Service,DB: Staff reads are scoped by assignment, ownership, or explicit service rules.
```

Admin route and authorization examples:

- `/admin/activity` is Admin/Manager-only in the frontend and backend.
- `/admin/users`, `/admin/invitations`, and `/admin/settings` are Admin-only.
- Internal document download uses `/api/documents/:id/download`.
- Staff document access is limited to documents they uploaded or documents
  linked to assigned cases.

## Request Flow For Customer Portal

```mermaid
sequenceDiagram
  actor Customer as Customer portal account
  participant UI as Portal React route
  participant Client as Portal API client
  participant API as /api/portal
  participant Auth as Portal auth middleware
  participant Service as Portal service
  participant Prisma as Prisma ORM
  participant DB as PostgreSQL

  Customer->>UI: Open /portal/login
  UI->>API: POST /api/portal/auth/login with workspaceSlug, email, password
  API->>Service: Validate active workspace and portal account
  Service->>Prisma: Find account scoped by workspace slug and email
  Prisma->>DB: SQL query
  DB-->>Prisma: Portal account and customer
  Service-->>API: Portal JWT with purpose customer_portal
  API-->>UI: Safe session payload

  Customer->>UI: Open dashboard, cases, documents, or updates
  UI->>Client: Read advisora_portal_access_token
  Client->>API: Portal request with Bearer token
  API->>Auth: Require purpose customer_portal
  Auth-->>Service: portalAccount organizationId and customerId
  Service->>Prisma: Query by organizationId and customerId
  Prisma->>DB: SQL query
  DB-->>Prisma: Own cases, visible documents, safe updates
  Service-->>API: Portal-safe DTOs
  API-->>UI: No internal notes, storage paths, signed URLs, or hashes

  Note over Auth,Service: Internal CRM JWTs are rejected by portal auth.
```

Portal routes intentionally use a separate auth context, API client, token key,
and layout from the internal Admin CRM.

## Document Upload And Download Security Flow

```mermaid
flowchart TD
  Upload["Upload request"] --> UploadRoute{"Route family"}
  UploadRoute -->|"/api/documents/upload"| InternalUpload["Internal auth + CRM role"]
  UploadRoute -->|"/api/portal/documents"| PortalUpload["Portal auth + customer scope"]

  InternalUpload --> Validate["Validate file type, size, customer, case, role scope"]
  PortalUpload --> Validate
  Validate --> Store["Store through document storage provider"]
  Store --> Scan["Scanner/OCR provider runs or marks skipped"]
  Scan --> Metadata["Create Document metadata\nsource, visibility, scan status, OCR status"]
  Metadata --> Activity["Write upload ActivityLog"]
  Activity --> SafeUpload["Return safe JSON\nno storageKey, bucket, signed URL, or raw path"]

  Download["Download request"] --> DownloadRoute{"Download route"}
  DownloadRoute -->|"/api/documents/:id/download"| InternalDownload["Internal auth + document read scope"]
  DownloadRoute -->|"/api/portal/documents/:id/download"| PortalDownload["Portal auth + organizationId + customerId + CUSTOMER_VISIBLE"]

  InternalDownload --> Policy{"Scan policy allows download?"}
  PortalDownload --> Policy
  Policy -->|No| Block["Block before opening object"]
  Policy -->|Yes| Object{"Stored object exists?"}
  Object -->|No| Missing["Return not found"]
  Object -->|Yes| Stream["Backend streams object"]
  Stream --> Audit["On successful finish\nDocumentDownloadAudit + downloadCount + lastDownloadedAt"]
```

Document security invariants:

- Portal download uses a dedicated portal route and never the internal admin
  download route.
- Internal uploads default to `source=INTERNAL` and
  `visibility=INTERNAL_ONLY`.
- Portal uploads are created as `source=CUSTOMER_PORTAL` and
  `visibility=CUSTOMER_VISIBLE`.
- A customer can see an internal document only after an Admin or Manager marks
  it `CUSTOMER_VISIBLE`.
- Portal JSON responses never expose raw file paths, buckets, storage keys,
  object keys, signed URLs, password hashes, token hashes, IP addresses, or
  user-agent data.

## Tenant Isolation Explanation

```mermaid
flowchart TB
  Org["Organization workspace"] --> Users["User.organizationId"]
  Org --> Customers["Customer.organizationId"]
  Org --> Cases["CaseProfile.organizationId"]
  Org --> Documents["Document.organizationId"]
  Org --> Activity["ActivityLog.organizationId"]
  Org --> Downloads["DocumentDownloadAudit.organizationId"]
  Org --> PortalAccounts["CustomerPortalAccount.organizationId"]

  InternalToken["Internal JWT"] --> InternalScope["request.user.organizationId"]
  PortalToken["Portal JWT"] --> PortalScope["portalAccount organizationId + customerId"]
  PublicRequest["Public consultation request"] --> DefaultWorkspace["DEFAULT_ORGANIZATION_SLUG"]

  InternalScope --> InternalQueries["Internal services ignore client-supplied organizationId"]
  PortalScope --> PortalQueries["Portal services require own customer and visible records"]
  DefaultWorkspace --> PublicQueries["Public intake maps to configured workspace"]

  InternalQueries --> SameWorkspace["Same-workspace CRM data"]
  PortalQueries --> OwnCustomer["Own customer cases, documents, appointments, updates"]
  PublicQueries --> Intake["Consultation request in default workspace"]

  SameWorkspace -. not returned .-> OtherWorkspace["Other workspace data"]
  OwnCustomer -. not returned .-> OtherCustomer["Other customer data"]

  Verify["npm run verify:tenant-isolation"] --> Checks["Users, customers, cases, tasks, documents, audits, portal accounts, relation leaks"]
```

The tenant boundary is the `Organization` model. Internal services derive scope
from the authenticated internal user's `organizationId`; portal services derive
scope from the authenticated portal account's `organizationId` and `customerId`;
public consultation intake maps to the configured `DEFAULT_ORGANIZATION_SLUG`.

`npm run verify:tenant-isolation` is a read-only verification script for the
Advisora and Northstar demo workspaces. It does not reset the database or delete
staging data.
