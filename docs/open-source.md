# Open Source Notes

This document is a short index for open-source readiness of Advisora CRM. It
does not replace the root legal and community files; it points contributors and
portfolio reviewers to the right places.

## Project Identity

Advisora CRM (Consulting CRM System) is an open-source, production-style
full-stack SaaS CRM built as a long-term portfolio project. It combines:

- A public consulting website
- An internal multi-tenant admin CRM
- A separate customer portal
- Document handling, activity/audit trails, and provider abstractions

It is intended for education, portfolio demonstration, and careful staging
demos — not as a certified commercial compliance product.

## Author

- **Nguyễn Đức Trí**
- AI student at **HUFLIT**
- GitHub: [Ductri2006](https://github.com/Ductri2006)

Long-term goal: maintain a clear, reviewable portfolio codebase that shows
fullstack SaaS architecture, security-conscious multi-tenant design, and
practical documentation.

## License

- License: [MIT](../LICENSE)
- Copyright (c) 2026 Nguyễn Đức Trí

You may use, modify, and distribute the software under the MIT terms. Keep the
copyright and permission notice in substantial portions of the Software.

## Community Files

| File | Purpose |
| --- | --- |
| [LICENSE](../LICENSE) | MIT license text |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | How to propose issues/PRs and run local checks |
| [SECURITY.md](../SECURITY.md) | Private security reporting and sensitive areas |
| [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) | Lightweight community standards |
| [README.md](../README.md) | Project overview, setup, deployment, and demos |

## Security and Secrets

- Never commit `.env` files, JWT secrets, database URLs, provider keys, or
  signed URLs.
- Configure environment variables locally and in hosting dashboards only.
- Report vulnerabilities privately — see [SECURITY.md](../SECURITY.md).
- Sensitive implementation areas include auth, RBAC, tenant isolation, portal
  access, documents, signed URLs, audit logging, and provider readiness.

Related technical docs:

- [security-hardening.md](security-hardening.md)
- [security-rbac-matrix.md](security-rbac-matrix.md)
- [production-readiness.md](production-readiness.md)

## Demo Data

- Seed and demo content is **fictional only**.
- Do not load real customer records, contracts, or identity documents into
  shared demo environments.
- Screenshots must not reveal secrets, private provider consoles, or real
  personal data. See [screenshots/README.md](screenshots/README.md).

## Contributions Welcome

Educational contributions are encouraged:

- Documentation clarity
- Accessibility and UI polish
- Bug fixes with small scope
- Tests and verification scripts
- i18n parity and missing-key fixes

Please open an issue before large refactors of auth, RBAC, tenant isolation,
or document security. See [CONTRIBUTING.md](../CONTRIBUTING.md) for the
expected PR checklist and completion report format.

## Honest Positioning

This repository documents production-oriented patterns and staging deployment
paths. It does **not** claim:

- Certified SOC 2 / ISO / HIPAA compliance
- Guaranteed uptime SLAs
- Real enterprise customer references
- Bug-free operation under all production loads

Treat live demo URLs as best-effort portfolio hosting (for example, free-tier
backends may sleep and cold-start).
