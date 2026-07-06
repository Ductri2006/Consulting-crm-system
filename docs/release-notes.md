# Release Notes

## v1.0.0 Portfolio Release

This release packages Advisora CRM / Consulting CRM System as a portfolio-ready
fullstack SaaS demo. It is suitable for GitHub, CV, and interview review with
fictional seeded data. It is not approval to handle real sensitive production
data without completing the production limitations listed below.

## Highlights

- Public consulting website with services, projects, news, contact,
  consultation, appointment, workspace signup, and invitation accept routes.
- Internal Admin CRM with dashboard, customers, consultation requests, cases,
  appointments, tasks, documents, reports, users, invitations, workspace
  settings, and Activity Center.
- Customer portal with separate login, dashboard, safe profile summary, case
  tracking, document upload/download, and updates feed.
- Multi-tenant workspace foundation through `Organization` scope.
- Workspace signup and invitation flows for controlled onboarding demos.
- Case workflow with status transitions, priority, assignment, deadlines, and
  history.
- Secure document management with internal-only defaults, Admin/Manager
  customer-visible controls, protected download routes, scan/OCR metadata,
  storage abstraction, and download audit metadata.
- Local document storage for development/demo and S3-compatible private object
  storage support for production-like deployments.
- Activity Center and customer-safe Portal Updates.
- Bilingual English/Vietnamese UI with persisted `advisora_locale`.
- Security hardening: JWT purpose separation, RBAC, tenant verification, rate
  limits, Helmet/security headers, body limits, and redacted logs/errors.
- Final QA documentation and release-oriented README polish.
- GitHub Actions CI foundation for client/server build, lint, Prisma, i18n, and
  documentation safety checks without auto-deploying or mutating databases.
- Rule-based consultation workflow automation that turns public intake into a
  same-workspace follow-up task, ActivityLog events, and optional assignee
  email notifications.
- On-demand AI Case Summary for internal case detail, with safe context
  building, mock/demo provider, optional external provider mode, AI-specific
  rate limit, and ActivityLog events.
- Provider readiness documentation for private S3-compatible storage and Resend
  email, plus a dry-run-first `verify:providers` command.
- Step 38.5 modern SaaS UI polish for the public landing page, Admin CRM
  surfaces, and Customer Portal surfaces using lightweight React/Tailwind/CSS
  visuals only.

## Verification

Step 33 final QA passed before this release documentation pass:

- Client `npm run build`
- Client `npm run lint`
- Server `npm run build`
- Server `npm run lint`
- Server `npx prisma validate`
- Server `npm run prisma:generate`
- EN/VI i18n key parity check
- Static `t('...')` missing-key scan
- Server `npm run verify:tenant-isolation`
- Public/admin/portal local smoke
- Document security regression review
- Security headers and rate-limit smoke
- Production smoke script readiness

Step 34 release-doc verification re-ran the build/lint/Prisma/i18n and tenant
checks after documentation changes.

Step 35 adds CI verification on push and pull request to `main`:

- Client install, lint, i18n check, and build.
- Server install, Prisma generate/validate, lint, and build.
- Docs/safety whitespace guard.
- Manual production smoke workflow is available only through
  `workflow_dispatch` with `SMOKE_*` secrets.

Step 36 adds consultation automation verification:

- Public request creation remains tenant-mapped by
  `DEFAULT_ORGANIZATION_SLUG`.
- Auto follow-up task creation uses same-tenant Manager/Admin assignment.
- Email provider disabled/failure paths are non-blocking.
- Activity Center and dashboard recent activity can display automation events.
- EN/VI labels and i18n key parity stay aligned.

Step 37 adds AI case summary verification:

- Internal `/api/cases/:id/ai-summary` route is protected by internal auth,
  tenant scope, AI rate limit, and Staff assigned-case access.
- Mock provider returns structured summary output without API keys or network
  calls for portfolio demo/CI.
- External provider mode requires secure env configuration and sends only
  sanitized context.
- AI context excludes raw files, storage paths, signed URLs, full OCR text,
  token/hash fields, IP/user-agent values, database URLs, and provider secrets.
- Generated, failed, and skipped AI summary attempts write generic ActivityLog
  events.

Step 38 adds provider readiness verification:

- `cd server && npm run verify:providers` is the documented entry point.
- Dry-run is the default and does not upload storage objects or send email.
- Live storage write/read/delete requires explicit opt-in with
  `PROVIDER_READINESS_MODE=live` and `PROVIDER_READINESS_ALLOW_WRITE=true`.
- Live Resend test email requires `PROVIDER_READINESS_MODE=live` and
  `PROVIDER_READINESS_TEST_EMAIL_TO` pointing to a staging/test recipient.

Step 38.5 adds modern landing and CRM UI polish verification:

- Public home page presents a premium SaaS-style hero with a lightweight
  HTML/Tailwind mock CRM dashboard, floating status cards, capability strip,
  workflow preview, and security/provider readiness section.
- Admin CRM remains a fast 2D business interface with polished shared surfaces,
  metric cards, tables, modal semantics, loading/empty/error states, topbar,
  and mobile navigation semantics.
- Customer Portal keeps separate portal auth/API usage while adding a more
  trust-focused dashboard, navigation, and document card treatment.
- New visible public copy is covered by EN/VI i18n resources.
- No Next.js project, WebGL/Three.js, GSAP, external image URLs, fake
  screenshots, uploaded files, or heavy animation dependency is added.

Production smoke live run remains conditional: run `npm run smoke:production`
only when safe deployed `SMOKE_*` credentials are configured outside the
repository.

## Known Limitations

- Render Free may sleep; the first backend request can be slow.
- The repository is portfolio/staging-ready, not approved for real sensitive
  production data.
- In-memory rate limiting is not distributed; use Redis or another shared
  limiter before multi-instance production.
- Local storage is the default for dev/demo. Production-like document handling
  should use private S3-compatible storage. Local storage is not durable on
  hosted environments that restart, redeploy, or scale instances.
- Live cloud storage and Resend email require external provider accounts,
  verified/dashboard-managed secrets, and staging/test readiness checks; they
  are not configured by this repository.
- ClamAV/Tesseract provider hooks exist, but real scanner/OCR infrastructure
  must be provisioned outside the repository.
- Browser local storage stores demo Bearer tokens; higher-risk production
  should review HttpOnly cookie sessions or another hardened session strategy.
- Public contact and appointment forms are validation/demo flows only.
- Public news/projects are typed frontend content, not backend CMS APIs.
- Consultation-request conversion is not implemented yet.
- Consultation automation is rule-based inline automation, not a workflow
  builder or background job queue; email delivery depends on provider setup.
- AI summary is assistive and on-demand. There is no chat AI, vector database,
  RAG pipeline, training flow, or background queue yet.
- No realtime notifications, customer messaging, billing/payment, report
  exports, or automated Playwright E2E suite yet.
- Screenshots are not committed yet; use the screenshots checklist before final
  public portfolio publishing, including the Step 38.5 modern landing hero,
  landing feature/security section, admin dashboard polish, AI summary panel,
  and customer portal dashboard.

## Next Improvements

- Add real screenshot assets after a sensitive-data review.
- Add Playwright E2E coverage for public, admin, and portal smoke paths.
- Add production object storage, malware scanning, and OCR infrastructure.
- Add provider-specific runbooks for the selected storage vendor and email
  domain once real accounts are chosen.
- Add refresh-token rotation, token revocation, and password recovery.
- Add customer messaging and notification preferences.
- Add report exports and richer analytics.
- Add billing/payment and customer self-service profile updates.
