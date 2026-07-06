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
  should use private S3-compatible storage.
- ClamAV/Tesseract provider hooks exist, but real scanner/OCR infrastructure
  must be provisioned outside the repository.
- Browser local storage stores demo Bearer tokens; higher-risk production
  should review HttpOnly cookie sessions or another hardened session strategy.
- Public contact and appointment forms are validation/demo flows only.
- Public news/projects are typed frontend content, not backend CMS APIs.
- Consultation-request conversion is not implemented yet.
- No realtime notifications, customer messaging, billing/payment, report
  exports, or automated Playwright E2E suite yet.
- Screenshots are not committed yet; use the screenshots checklist before final
  public portfolio publishing.

## Next Improvements

- Add real screenshot assets after a sensitive-data review.
- Add Playwright E2E coverage for public, admin, and portal smoke paths.
- Add production object storage, malware scanning, and OCR infrastructure.
- Add refresh-token rotation, token revocation, and password recovery.
- Add customer messaging and notification preferences.
- Add report exports and richer analytics.
- Add billing/payment and customer self-service profile updates.
