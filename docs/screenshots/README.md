# Screenshots Checklist

No screenshot images are committed yet. Use this checklist before final
portfolio publishing and add only real screenshots captured from the local or
staging demo environment.

## Naming Convention

Use lowercase kebab-case PNG files:

- `public-home.png`
- `public-home-modern-hero.png`
- `public-home-features-security.png`
- `public-consultation.png`
- `admin-dashboard.png`
- `admin-cases.png`
- `admin-ai-summary-panel.png`
- `admin-documents.png`
- `admin-activity.png`
- `portal-dashboard.png`
- `portal-case-detail.png`
- `portal-documents.png`
- `portal-updates.png`
- `bilingual-switch.png`

Place files in this directory:

```text
docs/screenshots/
```

## Recommended Viewports

- Desktop: `1440x900`
- Tablet: `768x1024`
- Mobile: `390x844`

Capture the main portfolio screenshots on desktop first, then add selected
mobile screenshots for navigation, portal layout, and EN/VI switching.

## Screenshots To Capture

- [ ] Modern landing hero with mock CRM dashboard:
  `docs/screenshots/public-home-modern-hero.png`
- [ ] Landing feature, workflow, and security/provider readiness section:
  `docs/screenshots/public-home-features-security.png`
- [ ] Public homepage: `docs/screenshots/public-home.png`
- [ ] Public consultation form: `docs/screenshots/public-consultation.png`
- [ ] Admin dashboard polish: `docs/screenshots/admin-dashboard.png`
- [ ] Admin cases workflow: `docs/screenshots/admin-cases.png`
- [ ] AI summary panel in internal case detail:
  `docs/screenshots/admin-ai-summary-panel.png`
- [ ] Admin documents with source/visibility/scan status:
  `docs/screenshots/admin-documents.png`
- [ ] Admin Activity Center: `docs/screenshots/admin-activity.png`
- [ ] Customer portal dashboard polish:
  `docs/screenshots/portal-dashboard.png`
- [ ] Customer portal case detail:
  `docs/screenshots/portal-case-detail.png`
- [ ] Customer portal documents: `docs/screenshots/portal-documents.png`
- [ ] Customer portal updates: `docs/screenshots/portal-updates.png`
- [ ] English/Vietnamese switch state:
  `docs/screenshots/bilingual-switch.png`

## Capture Safety Rules

- Use fictional seeded demo data only.
- Do not show `.env` files, provider dashboards, database URLs, JWT secrets,
  API keys, access tokens, local storage, or browser devtools containing tokens.
- Do not show raw invitation tokens, generated temporary passwords, or copied
  invite links.
- Do not upload real customer files or personal information.
- Crop or retake any screenshot that exposes private local paths, provider
  settings, terminal secrets, or real email inbox content.
- Keep screenshots visually honest: no edited/fake UI states and no placeholder
  binary files.

## README Usage

Only add image links to the root `README.md` after the corresponding PNG files
exist in this directory and have been reviewed for sensitive data.
