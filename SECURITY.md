# Security Policy

Advisora CRM (Consulting CRM System) is an open-source **portfolio and
educational** full-stack SaaS CRM. It demonstrates production-style security
patterns (auth separation, RBAC, tenant scoping, document controls, audit
logging, rate limits, and redaction), but it is **not** a certified compliance
product, penetration-tested commercial platform, or guarantee of fitness for
real regulated data.

Use this project for learning, portfolio review, and carefully controlled
demo/staging environments. Do not treat it as certified SOC 2, ISO, HIPAA, or
similar compliance software.

## Reporting a Security Concern

### Do

- Report security concerns **privately** when they involve exploit details,
  token leakage, tenant isolation bugs, or document access issues.
- Prefer GitHub’s private vulnerability reporting for this repository when
  available: **Security → Report a vulnerability** on the GitHub repo page.
- If private reporting is unavailable, contact the maintainer through a
  **private channel** linked from the maintainer’s GitHub profile
  ([@Ductri2006](https://github.com/Ductri2006)), without including live secrets
  in the first message.
- Describe the impact, affected component, and safe reproduction steps using
  **fictional** demo data only.
- Allow reasonable time for triage before any public discussion.

### Do not

- Open a **public** GitHub issue with exploit PoCs, stolen/leaked tokens, or
  step-by-step attack scripts that endanger deployed demos.
- Post real `.env` values, database URLs, JWT secrets, provider API keys,
  signed URLs, password hashes, or session cookies.
- Upload real customer files or personally identifiable information “as proof.”
- Demand immediate disclosure or claim a CVE without coordination.

If you accidentally commit a secret to a fork or PR, rotate the credential
immediately, remove it from history if possible, and notify the maintainer.

## Supported Scope

This policy focuses on the software as published in this repository and any
official demo/staging deployments maintained by the author.

In scope examples:

- Authentication bypass or token purpose confusion (internal vs portal)
- Broken RBAC or privilege escalation between Admin / Manager / Staff / portal
- Cross-tenant data access (organization isolation failures)
- Document download or visibility policy bypasses
- Exposure of storage paths, signed URLs, hashes, or internal notes in APIs
- Unsafe logging of secrets or sensitive request metadata
- Injection or path-traversal issues in upload/download flows
- Missing auth checks on sensitive routes

Out of scope / limited response examples:

- Issues that require physical access or compromised developer machines
- Denial of service against free-tier hosting (Render sleep, rate limits, etc.)
- Vulnerabilities only present after deliberately disabling security env flags
- Third-party provider outages (Neon, Vercel, Render, Resend, S3-compatible)
- Social engineering of demo account holders
- Feature requests framed as “security” without a concrete risk model

## Sensitive Areas (extra care)

Contributors and reviewers should treat these paths and concepts as high risk:

| Area | Why it matters |
| --- | --- |
| Auth (internal JWT) | Session integrity for Admin/Manager/Staff |
| Auth (customer portal JWT) | Separate token purpose; must not call admin APIs |
| RBAC / authorize middleware | Role boundaries for mutations and reads |
| Multi-tenant organization scope | Prevents cross-workspace data leakage |
| Workspace signup / invitations | Account provisioning and tokenized accept flows |
| Customer portal accounts | Customer-scoped data access |
| Documents (upload/download/visibility) | Confidential file handling |
| Storage providers & signed URLs | Path/URL leakage risk |
| Scan / OCR abstractions | Untrusted file content handling |
| Activity, case history, download audit | Integrity of audit trails |
| Rate limiting & Helmet/CORS | Abuse resistance and browser security posture |
| Redaction helpers | Prevent secrets in logs and error payloads |
| Provider readiness (email, storage, AI) | Misconfiguration can leak data externally |
| Seed / demo scripts | Must remain fictional; no real credentials in repo |

Internal implementation references (for maintainers and careful contributors):

- [docs/security-hardening.md](docs/security-hardening.md)
- [docs/security-rbac-matrix.md](docs/security-rbac-matrix.md)
- [docs/cloud-storage-setup.md](docs/cloud-storage-setup.md)

## Secrets and Environment Configuration

- Never commit `.env`, `.env.*` local files, key material, or private certs.
- Copy from `.env.example` files and configure values **locally** or in your
  hosting provider’s secret store (Vercel, Render, etc.).
- Rotate any credential that may have been exposed in chat, screenshots, or
  CI logs.
- Prefer dummy values for CI; this repository’s CI is designed not to deploy
  or mutate production databases automatically.
- Do not paste production connection strings into issues, PRs, or docs.
- Do not share raw secret-scanner output in public issues or chat if it may
  contain real credentials. Prefer redacted findings (path, type, masked
  preview only) as in [docs/secret-hygiene-audit.md](docs/secret-hygiene-audit.md).

## Demo Data Policy

- Seeded users, customers, cases, and documents are **fictional**.
- Do not import real client lists, contracts, or identity documents into demo
  databases that may be shared or screenshotted.
- Public portfolio materials should avoid revealing private provider settings.

## Disclosure Preferences

When a report is confirmed:

1. Maintainer acknowledges receipt when possible.
2. Fix is prepared privately or in a carefully reviewed PR.
3. Public discussion can follow after a patch is available or risk is low.

There is no paid bug bounty for this portfolio project. Good-faith educational
reports are appreciated and credited if the reporter wants public thanks.

## Maintainer

- Author: **Nguyễn Đức Trí**
- Role: AI student at HUFLIT; long-term portfolio project maintainer
- GitHub: [https://github.com/Ductri2006](https://github.com/Ductri2006)

## Disclaimer

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND. See
[LICENSE](LICENSE). Security documentation in this repository describes
intended design and hardening steps for learning and staging use; it does not
certify that any deployment is free of vulnerabilities.
