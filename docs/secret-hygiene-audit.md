# Secret Hygiene Audit — Advisora CRM (Step 38.10)

| Field | Value |
| --- | --- |
| **Date** | 2026-07-09 |
| **Repo** | Ductri2006/Consulting-crm-system (public portfolio SaaS CRM) |
| **Workspace** | `D:\consulting_crm_system` |
| **Branch** | `main` |
| **HEAD SHA** | `4fca1d50cae301cf07c6cace56ec86e4e08a90d6` |
| **HEAD subject** | Step 38.9 — Open Source Readiness Docs |
| **Auditor role** | Security / Application Security (read-mostly audit) |
| **Tools** | `git`, PowerShell, workspace `grep` / file reads; **gitleaks: unavailable** (not installed; not installed by this audit) |
| **Scope** | Tracked tree, git history metadata, workflows, docs, seeds, env examples, local untracked sensitive files (names + masked previews only) |

## Critical rules followed

- Audit first; no credential rotation; no history rewrite; no auth/RBAC/tenant/portal/document/provider code changes.
- **No full secrets** printed in this report (masked previews only).
- No application behavior code modified.
- Optional hardening limited to root `.gitignore` secret-path coverage.

---

## 1. Git status and identity

| Check | Result |
| --- | --- |
| `git status --short` (start) | Clean working tree (no staged/unstaged tracked changes) |
| Branch | `main` |
| HEAD | `4fca1d50cae301cf07c6cace56ec86e4e08a90d6` |
| Commit count on HEAD | 54 |
| Local untracked secret-like file | `server/.env` present on disk, **gitignored**, **not tracked** (`git status --ignored` shows `!! server/.env`) |

---

## 2. Sensitive paths — tracked vs ignored

### Tracked (expected / non-secret)

| Path | Assessment |
| --- | --- |
| `client/.env.example` | Placeholders only; safe |
| `server/.env.example` | Placeholders only; safe |
| `server/prisma/migrations/**/migration.sql` | Schema DDL only; no data dumps or credentials |
| `server/prisma/migrations/migration_lock.toml` | Prisma lock provider metadata (not a secret) |

### Not tracked (good)

| Pattern | Result |
| --- | --- |
| `.env` (real) | Not tracked; `server/.env` exists locally and is ignored |
| `*.pem` / `*.key` / `credentials.json` / `secrets.json` / service account files | None found on disk under the workspace (excluding `node_modules`); none tracked |
| `uploads/` / `server/uploads/` | Ignored; no upload blobs tracked (only source filenames containing “upload”) |
| `client/dist/` / `server/dist/` | Build outputs not tracked (0 paths under `git ls-files`) |
| SQL dumps (`*.dump`, backup dumps) | None tracked |

### History of sensitive path names

| Path family | Commits that added/touched real secret files |
| --- | --- |
| Real `.env` (not example) | **None** in history |
| `*.pem` / `*.key` | **None** |
| `credentials*` / `secrets*` / service accounts | **None** |
| `uploads/**` content | **None** |
| SQL dumps | **None** |
| `.env.example` only | Multiple historical commits (expected; placeholders) |

Pickaxe (`git log -S`) for fragments associated with the **local** managed DB URL host/user/password prefix and local JWT demo string: **no history hits**. Conclusion: local live-looking credentials do **not** appear to have been committed.

---

## 3. Gitleaks

| Tool | Status |
| --- | --- |
| `gitleaks` | **Unavailable** (not on PATH). Not installed by this audit. |
| Recommendation | Maintainers may run gitleaks or GitHub secret scanning separately; CI does not currently run a dedicated secret scanner job. |

---

## 4. Manual secret pattern greps (sanitized)

Patterns covered (non-exhaustive): `DATABASE_URL`, `JWT_SECRET`, `AKIA…`, `sk-…`, `ghp_…`, `eyJ…` JWTs, `postgres(ql)://…`, `BEGIN PRIVATE KEY`, hardcoded `apiKey`/`secret` assignments, `printenv`, workflow env dumps.

### Published / tracked hits (all acceptable or documented)

| Location | Type | Masked / nature | Tree vs history | Severity |
| --- | --- | --- | --- | --- |
| `server/.env.example`, docs | Placeholder env names | `<postgres-connection-url>`, `<strong-private-secret-…>` | Tree | **D** accepted |
| `.github/workflows/ci.yml` | CI dummy DB URL + JWT | `postgresql://ci_user:ci_password@localhost:5432/ci_db`; JWT `ci-jwt-secret-…` | Tree | **D** accepted (non-production, localhost) |
| `.github/workflows/provider-readiness.yml` | Dry-run dummy env | `postgresql://provider_readiness:…@localhost…`; JWT `provider-readiness-jwt-secret-…` | Tree | **D** accepted |
| Seeds + README demo tables | Fictional demo passwords | `password123`, `Advisora-Demo-*-2026!`, `Northstar-Demo-*-2026!`, portal demo password | Tree | **D** accepted (labeled fictional / local / demo) |
| Source | Env reads only | `env.JWT_SECRET`, Zod validation — no hardcoded production secret | Tree | None |
| Frontend `VITE_*` | Public API base URL only | `VITE_API_BASE_URL` → localhost or deploy URL placeholders | Tree | None |
| AWS `AKIA…`, `sk-live`, `ghp_`, PEM blocks, raw JWTs | — | **No matches** in tracked source/docs of that form | Tree | None |

### Local untracked (operator action)

| Location | Type | Masked preview | Tree vs history | Severity |
| --- | --- | --- | --- | --- |
| `server/.env` (local only) | Managed PostgreSQL `DATABASE_URL` (cloud host) | `postgresql://…:***@….neon.tech/…` (host/user/password fully redacted beyond provider TLD) | **Disk only**; gitignored; **not in history** | **A** (local operator) / **not published** |
| `server/.env` (local only) | `JWT_SECRET` | local demo-style string (length ≥32; value not shown) | Disk only; not in history | **B** local weak/demo JWT if same secret reused on any shared deploy |

**Recommended actions (operator, not performed by this audit):**

1. Keep `server/.env` untracked forever; never paste full values into issues, PRs, screenshots, or chat.
2. If this Neon database is shared, staging, or was ever pasted outside the machine: **rotate** DB password and any related JWT/provider secrets in the provider console (do not commit new values).
3. Prefer distinct local vs staging vs production secrets; do not reuse the local JWT on Render/Vercel.

---

## 5. Frontend exposure

| Check | Result |
| --- | --- |
| `client/src/config/env.ts` | Only `import.meta.env.VITE_API_BASE_URL` with localhost default |
| `client/.env.example` | Single public var: `VITE_API_BASE_URL=http://localhost:5000/api` |
| Service / admin keys in client | **None** found |
| Admin password arrays in client bundle source | **None**; demo passwords appear in docs/README only, not as client-side auth bypass |
| CI client env | `VITE_API_BASE_URL: "http://localhost:5000/api"` (public) |

**Verdict:** Frontend does not embed backend secrets, JWT secrets, or provider keys via `VITE_*`.

---

## 6. Backend configuration and hygiene

| Area | Assessment |
| --- | --- |
| `server/src/config/env.ts` | Zod-validated env; secrets required from environment; no hardcoded production credentials |
| `server/.env.example` | Empty or placeholder values for all sensitive keys |
| Seeds | Fictional emails (`*.advisora.test`, `*.northstar.test`, `admin@advisora.demo`); passwords hashed with bcrypt; legacy `password123` for minimal seed; richer demo passwords documented as demo-only |
| `sanitizeUser` | Strips `passwordHash` from API user payloads |
| `redact.ts` | Redacts Bearer tokens, invite paths, storage URLs, `DATABASE_URL` / `JWT_SECRET` / Resend / S3 key env assignments, local paths, upload paths; object keys matching token/password/secret/key/url/path |
| Hardcoded production secrets in `src/` | **None** found |
| Logging | Server startup logs host/port only; no `printenv` |

**Low note (D):** Named string redaction list does not explicitly include `AI_API_KEY=…`, but object-key redaction matches `/key/i`. Acceptable residual risk for free-form log strings.

---

## 7. Documentation

| Check | Result |
| --- | --- |
| README demo accounts | Explicitly labeled **fictional / demo-only**; not real customer credentials |
| Deployment / staging guides | Instruct secrets only in provider stores; forbid committing `DATABASE_URL` / `JWT_SECRET` |
| `SECURITY.md` | Explicit ban on posting real `.env` values; rotate if exposed |
| Smoke docs using `password123` | Local/legacy seed documentation; production checklists require disabling known legacy credential |

**Verdict:** Docs contain intentional demo passwords only; no real provider secrets observed.

---

## 8. `.gitignore` completeness

### Before audit

Ignored: exact `.env`, some `.env.*.local`, `uploads/`, DBs, `dist/`, etc.

**Gaps confirmed via `git check-ignore`:**

| Path example | Was ignored? |
| --- | --- |
| `.env.production` / `.env.development` / `.env.staging` / `.env.test` | **No** |
| `secrets.json` / `credentials.json` | **No** |
| `*.pem` / `id_rsa` | **No** |

Also: root ignore listed `prisma/migrations/migration_lock.toml` (wrong path vs `server/prisma/...`) — lockfile is intentionally tracked under `server/`; rule was ineffective/misplaced (not a secret issue).

### After optional fix (this audit)

Root `.gitignore` tightened to:

- `.env` + `.env.*` with `!.env.example` and `!**/.env.example`
- Key material patterns (`*.pem`, `*.key`, p12/pfx/jks, common SSH private key names)
- `credentials.json`, `secrets.json`, service-account JSON globs
- Dump-like DB backups (`*.dump`, `*.sql.bak`, `*.sql.gz`) without ignoring Prisma `migration.sql`
- Corrected Prisma dev DB paths; removed ineffective lockfile ignore line

---

## 9. GitHub workflows

| Workflow | Secrets handling | Issues |
| --- | --- | --- |
| `ci.yml` | Dummy localhost DB/JWT for build/lint/validate only; no deploy/migrate/seed | **None** critical. Dummy secrets are intentional. |
| `smoke.yml` | Uses `${{ secrets.SMOKE_* }}` only; validates presence without printing values; manual `workflow_dispatch` | **Good** |
| `provider-readiness.yml` | Real provider creds only via `${{ secrets.* }}` when S3/Resend selected; dummy JWT/DB for process boot; no `printenv` | **Good** |
| `dependabot.yml` | Ecosystem updates only | **N/A** |

No workflow dumps environment with `printenv` or echoes secret values.

---

## 10. Findings by severity

### A — Critical

| ID | Finding | Location | Published? | Action |
| --- | --- | --- | --- | --- |
| A-1 | Local `server/.env` contains a **live-looking managed Postgres URL** (Neon-style) | Disk: `server/.env` (line ~3 area) | **No** (untracked, ignored, not in history) | Operator: protect file; never commit; rotate DB credentials if exposure risk; keep separate from production |

### B — High

| ID | Finding | Location | Published? | Action |
| --- | --- | --- | --- | --- |
| B-1 | Local `JWT_SECRET` is a guessable demo-style string on disk | `server/.env` | **No** | Use a high-entropy secret for any non-local deploy; rotate if ever used outside local machine |

### C — Medium

| ID | Finding | Location | Published? | Action |
| --- | --- | --- | --- | --- |
| C-1 | `.gitignore` previously missed common env alternate names and key files | Root `.gitignore` | N/A (process) | **Mitigated** in this audit by expanding ignore rules |
| C-2 | No dedicated secret-scanning CI job (gitleaks/trufflehog) | `.github/workflows` | Process | Optional follow-up: add gitleaks or enable GitHub secret scanning / push protection |

### D — Low / accepted

| ID | Finding | Notes |
| --- | --- | --- |
| D-1 | Fictional demo passwords in seeds and public README | Acceptable for portfolio SaaS; labeled; must not be used as real production credentials |
| D-2 | Legacy `password123` in minimal `seed.ts` / verify script / local docs | Documented; demo seed path disables legacy admin where applicable; staging checklists require failure of known legacy login |
| D-3 | CI/provider-readiness dummy JWT and DB URLs committed | Localhost / fake credentials only |
| D-4 | `AI_API_KEY` not in named redact regex list | Residual; object-key redaction still covers many log shapes |
| D-5 | gitleaks not available in audit environment | Manual + git history review performed instead |

---

## 11. Residual risk summary

| Surface | Residual risk |
| --- | --- |
| Public GitHub tree @ HEAD | **Low** — no real DB URLs, JWT production secrets, cloud keys, PEMs, or upload dumps found tracked |
| Git history (this clone) | **Low** — no evidence real Neon/local JWT fragments were ever committed |
| Developer workstation | **Elevated until operator hygiene** — real-looking DB URL lives in ignored `server/.env` |
| Demo passwords | **Accepted** for open portfolio demos; any long-lived public staging must treat them as known-weak and isolate data |
| Automated secret scan | **Not run** (tool missing); GitHub-native scanning recommended |

---

## 12. Verdict

### Public repository secret hygiene: **PASS (with local-operator finding)**

- **Published tree and reachable history:** no critical secret material found committed.
- **Local workspace:** one ignored `server/.env` with live-looking database credentials — treat as **operator Critical** until confirmed non-production or rotated if shared/exposed.
- **Demo credentials:** intentionally public and fictional; acceptable for this portfolio project when environments stay non-sensitive.
- **Hygiene controls:** env examples, SECURITY.md, redaction helpers, workflow secret references, and (post-audit) stronger `.gitignore` support open-source safety.

### Not performed (by design)

- Credential rotation
- History rewrite / force-push
- Application auth/RBAC/tenant/portal/document/provider code changes
- Commits
- Installation of gitleaks or other scanners

---

## 13. Files created / modified by this audit

| File | Change |
| --- | --- |
| `docs/secret-hygiene-audit.md` | **Created** — this report |
| `.gitignore` | **Updated** — broader env/key/dump ignore patterns; keep `*.env.example` tracked |

No application runtime/source behavior files modified.

---

## 14. Confirmation checklist

- [x] No full secrets, tokens, passwords, DB URLs, JWT secrets, or API keys printed in this document (masked only)
- [x] No auth/RBAC/tenant/portal/document/provider application code modified
- [x] No credentials rotated by the auditor
- [x] No git history rewrite
- [x] No commit created by this audit
- [x] gitleaks reported unavailable when not installed
- [x] Findings classified A/B/C/D

---

## Appendix A — Recommended maintainer follow-ups (optional)

1. Enable GitHub **secret scanning** and **push protection** on the public repo.
2. Optionally add a CI job running gitleaks on PRs (config committed without secrets).
3. Periodically re-check that no `server/.env` / client env files appear in `git ls-files` or PR diffs.
4. For any shared Neon/Render project that used the local disk secrets: rotate in the provider UI and update only remote secret stores.
5. Keep demo passwords fictional; never load real PII into environments that use published demo credentials.
