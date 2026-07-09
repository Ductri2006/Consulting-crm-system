# Contributing to Advisora CRM

Thank you for your interest in contributing. Advisora CRM is an open-source,
portfolio-oriented full-stack SaaS CRM built as a long-term learning and
portfolio project by **Nguyễn Đức Trí** (AI student at HUFLIT;
[GitHub @Ductri2006](https://github.com/Ductri2006)).

Educational contributions are welcome: documentation fixes, accessibility
improvements, UI polish, bug reports, tests, and small scoped code changes.

Please read this guide together with [SECURITY.md](SECURITY.md) and
[docs/open-source.md](docs/open-source.md) before opening a pull request.

## Ground Rules

1. **Be kind and professional.** Keep discussion technical and constructive.
2. **Prefer small, scoped changes.** One concern per PR is easier to review.
3. **Do not commit secrets.** Never add `.env` files, API keys, JWT secrets,
   database URLs, provider credentials, signed URLs, or real personal data.
4. **Use fictional demo data only.** Seed data, fixtures, screenshots, and
   issue reproductions must not include real customer information.
5. **Do not claim compliance or production guarantees.** This is a portfolio
   and educational project, not a certified security or compliance product.
6. **Treat security-sensitive areas carefully.** Auth, RBAC, multi-tenant
   isolation, portal access, documents, signed URLs, and audit logging need
   extra review. Do not “fix around” with those areas without discussion.

## How to Contribute

### Issues

- Search existing issues before opening a new one.
- Use a clear title and describe expected vs actual behavior.
- Include reproduction steps when reporting bugs (local setup, browser, OS).
- Mark security concerns carefully — see [SECURITY.md](SECURITY.md). Do **not**
  post exploit details, tokens, passwords, or private environment values in
  public issues.
- Feature ideas are welcome when framed as educational or portfolio-friendly
  improvements (docs, DX, tests, accessibility, focused refactors).

### Pull Requests

1. Fork the repository (or create a branch if you have write access).
2. Create a focused branch name, for example:
   - `docs/fix-typo-readme`
   - `fix/client-empty-state-copy`
   - `chore/update-contributing`
3. Make the smallest change that solves the problem.
4. Run the local checks documented below that apply to your change.
5. Open a PR against `main` with a short summary and testing notes.
6. Link related issues when applicable.

PR scope tips:

| Preferred | Avoid without prior discussion |
| --- | --- |
| Docs and README clarity | Broad refactors across many modules |
| UI copy, loading/empty states | Auth, JWT, or session redesign |
| Lint/build fixes | Tenant isolation model changes |
| i18n key parity / missing keys | RBAC matrix redesign |
| Small accessibility improvements | Document storage / signed URL redesign |
| Focused bug fixes with tests or repro notes | Large dependency upgrades with behavior changes |

### Security-Sensitive Changes

Changes that touch the following areas should be discussed in an issue first
and must include a clear risk note in the PR:

- Authentication and JWT handling (internal and portal)
- Authorization / RBAC middleware and role checks
- Multi-tenant / organization scoping
- Customer portal account and token flows
- Document upload, download, visibility, and storage providers
- Signed URL generation or storage path handling
- Activity / audit / download audit logging
- Rate limiting, Helmet/CORS, redaction helpers
- Provider readiness (email, storage, OCR/scan, AI summary)
- Seed scripts and demo credential generation

If a change could weaken tenant isolation or expose documents across
workspaces, stop and open a discussion instead of shipping a partial fix.

## Local Setup

High-level setup (full detail lives in the root [README.md](README.md)):

```bash
git clone https://github.com/Ductri2006/Consulting-crm-system.git
cd Consulting-crm-system

cd server
cp .env.example .env
# Configure DATABASE_URL, CLIENT_URL, JWT_SECRET, and optional providers locally
npm install
npm run prisma:generate
npm run prisma:deploy
# Optional fictional demo data only:
# DEMO_SEED_ENABLED=true npm run seed:demo
npm run dev

# In another terminal:
cd client
cp .env.example .env
# Set VITE_API_BASE_URL to your local API, e.g. http://localhost:5000/api
npm install
npm run dev
```

Never commit real environment files or provider secrets. Configure everything
locally or in your private hosting dashboard.

## Local Checks

Run the checks that match the surface you changed. CI already runs many of
these on push and pull request to `main`.

Client:

```bash
cd client
npm run lint
npm run i18n:check
npm run build
```

Server:

```bash
cd server
npm run lint
npx prisma validate
npm run prisma:generate
npm run build
npm run verify:providers
```

Tenant isolation (when you touch multi-tenant queries, auth, portal, or
documents — requires a configured local database and seed data):

```bash
cd server
npm run verify:tenant-isolation
```

Whitespace / docs hygiene before finishing:

```bash
git diff --check
```

Notes:

- Do not run production smoke or live provider write/send checks against shared
  environments unless you control those credentials and understand the risk.
- Do not commit `dist/`, `node_modules/`, uploads, or generated artifacts.
- Prefer dry-run provider verification over live external calls.

## Demo Data and Screenshots

- Demo and seed content is **fictional only**.
- Do not upload real customer files, contracts, IDs, or personal records.
- Screenshots must not show:
  - Real secrets, API keys, connection strings, or JWT values
  - Private provider dashboards or billing screens
  - Real names, emails, phone numbers, or addresses of real people
  - Production admin consoles for systems outside this demo
- Prefer the fictional seeded brand/workspace content when capturing UI.

See [docs/screenshots/README.md](docs/screenshots/README.md) for naming and
viewport guidance.

## Expected Completion Report (for larger contributions)

For multi-file or behavior-changing PRs, include a short completion report in
the PR description:

```markdown
## Summary
- What changed and why

## Scope
- Files / modules touched
- Explicitly out of scope

## Local checks run
- [ ] client lint / i18n / build (if client touched)
- [ ] server lint / prisma validate / build (if server touched)
- [ ] verify:providers (if providers/config touched)
- [ ] verify:tenant-isolation (if tenant/auth/portal/docs touched)
- [ ] git diff --check

## Security notes
- Secrets: none committed
- Demo data: fictional only
- Sensitive areas touched: (none | list auth/RBAC/tenant/portal/docs/audit/etc.)
- Risk / residual concerns: ...

## How to verify
- Steps a reviewer can follow locally
```

Small docs-only PRs can use a shorter version of the same structure.

## License

By contributing, you agree that your contributions are licensed under the
project’s [MIT License](LICENSE).

## Questions

- General product/docs questions: open a GitHub Discussion or Issue.
- Security concerns: follow [SECURITY.md](SECURITY.md) — do not disclose
  sensitive details publicly.
