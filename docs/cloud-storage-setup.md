# Cloud Storage Setup

This guide explains how to prepare Advisora CRM document storage for local,
staging, and production-like environments.

The repository does not include live cloud credentials. Local storage remains
the default for development and demos. S3-compatible storage is supported when
you provide a private bucket and credentials through your deployment provider's
secret manager.

## Supported Modes

| Mode | Use it for | Behavior |
| --- | --- | --- |
| `DOCUMENT_STORAGE_PROVIDER=local` | Local development, portfolio demos, tiny smoke tests | Stores objects under `UPLOAD_DIR`. No cloud account is required. |
| `DOCUMENT_STORAGE_PROVIDER=s3` | Staging or production-like document handling | Stores objects in a private S3-compatible bucket using environment-provided credentials. |

Do not use local disk storage for durable hosted environments. Hosts such as
Render can restart or replace instances, and local uploads can disappear after a
deploy, restart, or scale event.

## Prerequisites

Before enabling `s3`, prepare:

- A private S3-compatible bucket dedicated to this environment.
- A service credential with least-privilege access to that bucket or approved
  object prefixes.
- Secure environment-variable storage in the hosting provider.
- A tiny fictional test file for readiness checks.
- A documented scan policy for skipped, failed, and infected files.

Use separate buckets and credentials for staging and production. Never reuse
local demo values or production credentials in staging.

## Environment Variables

Set these only in your local `.env` or hosting-provider secret store:

| Variable | Required | Notes |
| --- | --- | --- |
| `DOCUMENT_STORAGE_PROVIDER` | Yes | Use `local` or `s3`. Defaults to `local`. |
| `UPLOAD_DIR` | Local only | Local object directory. Defaults to `uploads`. |
| `DOCUMENT_STORAGE_BUCKET` | S3 only | Private bucket name. Do not expose it in client code. |
| `DOCUMENT_STORAGE_REGION` | S3 only | Bucket region or provider region. |
| `DOCUMENT_STORAGE_ENDPOINT` | Optional | S3-compatible endpoint for providers outside AWS. |
| `DOCUMENT_STORAGE_ACCESS_KEY_ID` | S3 only | Store only as a secret. Never commit it. |
| `DOCUMENT_STORAGE_SECRET_ACCESS_KEY` | S3 only | Store only as a secret. Never commit it. |
| `DOCUMENT_STORAGE_FORCE_PATH_STYLE` | Optional | Defaults to `true`, useful for many S3-compatible providers. |
| `DOCUMENT_SIGNED_URL_EXPIRES_SECONDS` | Optional | Defaults to `300`; allowed range is 60 to 3600 seconds. |

Example shape:

```dotenv
DOCUMENT_STORAGE_PROVIDER=s3
DOCUMENT_STORAGE_BUCKET=<private-staging-bucket>
DOCUMENT_STORAGE_REGION=<region>
DOCUMENT_STORAGE_ENDPOINT=<optional-s3-compatible-endpoint>
DOCUMENT_STORAGE_ACCESS_KEY_ID=<secret-from-provider>
DOCUMENT_STORAGE_SECRET_ACCESS_KEY=<secret-from-provider>
DOCUMENT_STORAGE_FORCE_PATH_STYLE=true
DOCUMENT_SIGNED_URL_EXPIRES_SECONDS=300
```

The placeholders above are not sample secrets. Replace them only in the
provider dashboard or local `.env` file, not in committed files.

## Bucket Security Requirements

Keep the bucket private:

- Block public access and avoid public bucket policies.
- Do not grant public ACLs to objects.
- Do not serve document objects directly from the frontend.
- Do not place bucket names, object keys, signed URLs, or local paths in JSON
  responses.
- Rotate the storage credential if it appears in logs, screenshots, tickets, or
  commits.

Use least privilege. The backend needs object write, read, existence check, and
delete access for application objects. Limit permissions to the environment
bucket and, where your provider supports it, the `documents/*` and
`provider-readiness/*` prefixes.

The application generates object keys server-side in this shape:

```text
documents/{organizationId}/{documentId}/{uuid}-{safeFilename}
```

Clients must not choose object keys.

## Setup Checklist

1. Create a private bucket for the target environment.
2. Create a least-privilege access key for that bucket or approved prefixes.
3. Add `DOCUMENT_STORAGE_*` values to Render or the deployment provider secret
   store.
4. Restart the backend so the new environment is loaded.
5. Run `npm run verify:providers` in dry-run mode.
6. Optionally run live mode with write/delete enabled against a disposable
   staging bucket or prefix.
7. Upload a tiny fictional test document through the app.
8. Download it as an authorized internal user.
9. Verify unauthorized, cross-tenant, and portal access boundaries.
10. Confirm API JSON does not expose bucket names, object keys, storage keys,
    signed URLs, `fileUrl`, raw upload paths, or local filesystem paths.

## Backend Access Boundary

Storage provider details stay backend-only.

- Internal uploads require internal CRM auth and CRM role checks.
- Portal uploads require portal auth and the authenticated portal account's
  customer scope.
- Internal documents default to `INTERNAL_ONLY`.
- A portal user can see an internal document only after an Admin or Manager sets
  it `CUSTOMER_VISIBLE`.
- Internal and portal download routes check tenant/customer/case scope,
  visibility, scan policy, and object existence before streaming.
- Successful downloads write `DocumentDownloadAudit` and update download
  metadata.

API responses can expose safe document metadata such as file name, type, size,
source, visibility, scan status, OCR status, and download availability. They
must not expose `storageKey`, object keys, bucket names, signed URLs,
`fileUrl`, raw upload paths, or local filesystem paths.

## Scan And OCR Policy

Local/demo defaults are intentionally permissive:

- `DOCUMENT_MALWARE_SCANNER=disabled` records skipped scan status.
- `DOCUMENT_ALLOW_DOWNLOAD_WHEN_SCAN_SKIPPED=true` keeps local demos usable.
- `DOCUMENT_ALLOW_DOWNLOAD_WHEN_SCAN_FAILED=false` blocks failed scans by
  default.
- `DOCUMENT_OCR_PROVIDER=disabled` avoids OCR infrastructure requirements.

Before handling real customer documents, configure and verify external scanner
infrastructure, decide whether skipped scans should block downloads, and enable
OCR only for approved MIME types and size limits.

## Readiness Check

Run the provider readiness script from the server directory:

```bash
cd server
npm run verify:providers
```

The default mode is `dry-run`.

- With `local` storage, the script confirms local mode and does not require
  cloud secrets.
- With `s3` storage, the script validates that required configuration loads and
  reports storage settings safely.
- Dry-run mode does not upload, read, sign, or delete any storage object.

Live storage verification is explicit opt-in. Run it only against a disposable
staging bucket or prefix:

```bash
cd server
PROVIDER_READINESS_MODE=live PROVIDER_READINESS_ALLOW_WRITE=true npm run verify:providers
```

In live mode, the script writes a disposable text object, confirms it exists,
reads it back, verifies its contents, and deletes it. If
`PROVIDER_READINESS_ALLOW_WRITE` is not `true`, live storage writes are skipped
with a warning.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Server fails to start with S3 config | Confirm bucket, region, access key, and secret are present in the secret store. |
| 403 access denied | Review bucket policy, access-key permissions, region, endpoint, and whether the key is limited to the expected prefix. |
| Wrong endpoint or path-style behavior | Confirm `DOCUMENT_STORAGE_ENDPOINT` is a valid HTTP/HTTPS URL and `DOCUMENT_STORAGE_FORCE_PATH_STYLE` matches the selected S3-compatible provider. |
| Upload succeeds but download returns not found | Confirm the object was not deleted and the bucket/prefix matches the configured environment. |
| Readiness dry-run passes but live write is skipped | Set both `PROVIDER_READINESS_MODE=live` and `PROVIDER_READINESS_ALLOW_WRITE=true`. |
| Hosted uploads disappear after deploy | `DOCUMENT_STORAGE_PROVIDER` is still `local`; configure private S3-compatible storage for durability. |
| Browser CORS error while downloading | Downloads should go through backend routes. If using signed URLs later, review bucket CORS separately and keep URLs short-lived. |
| Signed URL expires too quickly or too slowly | Review `DOCUMENT_SIGNED_URL_EXPIRES_SECONDS`; keep it short and within the supported 60-3600 second range. |
| JSON contains storage keys or bucket names | Treat as a security bug and fix the response serializer before exposing staging. |
