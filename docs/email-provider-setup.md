# Email Provider Setup

This guide explains how to prepare outbound email for Advisora CRM workspace
invitations, consultation follow-up notifications, and provider readiness
checks.

The repository does not include live email credentials. `console` email remains
the default for development and demos. Resend delivery is supported when you
provide a verified sender and API key through your deployment provider's secret
manager.

## Supported Modes

| Mode | Use it for | Behavior |
| --- | --- | --- |
| `EMAIL_PROVIDER=console` | Local development, portfolio demos, staging previews | Logs a masked recipient and redacted preview metadata. No email is sent. |
| `EMAIL_PROVIDER=disabled` | Environments where email must not be attempted | Skips delivery and returns `DISABLED`. |
| `EMAIL_PROVIDER=resend` | Staging or production-like email delivery | Sends through Resend when `RESEND_API_KEY` and a verified `EMAIL_FROM` are configured. |

Use `console` or `disabled` until a real provider account, sender verification,
and safe test-recipient plan are ready.

## Email Use Cases

The current backend sends or skips email for:

- Workspace invitation create/resend.
- Consultation request follow-up notifications to the assigned same-workspace
  Manager or Admin.
- Provider readiness test messages when live email verification is explicitly
  enabled.

Email delivery failure is non-blocking for invitation persistence and public
consultation intake. The backend records generic activity status without
including secrets, raw provider credentials, or invite tokens in logs.

## Environment Variables

Set these only in your local `.env` or hosting-provider secret store:

| Variable | Required | Notes |
| --- | --- | --- |
| `APP_NAME` | Optional | Name used in email templates. Defaults to `Advisora CRM`. |
| `EMAIL_PROVIDER` | Yes | `disabled`, `console`, or `resend`. Defaults to `console`. |
| `EMAIL_FROM` | Resend delivery | Must be a verified Resend sender for live delivery. |
| `EMAIL_REPLY_TO` | Optional | Reviewed support or operations inbox. |
| `RESEND_API_KEY` | Resend delivery | Store only as a secret. Never commit it. |
| `CLIENT_URL` | Invitations | First configured frontend origin is used to build invite links. |
| `CONSULTATION_AUTO_EMAIL_ENABLED` | Optional | Set `false` to disable consultation follow-up email attempts. |

Example shape:

```dotenv
APP_NAME="Advisora CRM"
EMAIL_PROVIDER=resend
EMAIL_FROM="Advisora CRM <no-reply@example.com>"
EMAIL_REPLY_TO="support@example.com"
RESEND_API_KEY=<secret-from-resend>
```

The placeholders above are not sample secrets. Replace them only in the
provider dashboard or local `.env` file, not in committed files.

## Resend Setup

1. Create or select a Resend account.
2. Verify the sender domain or sender address that will appear in `EMAIL_FROM`.
3. Create a scoped API key for the target environment.
4. Store `RESEND_API_KEY` in the hosting provider secret store.
5. Store `EMAIL_FROM` with the verified sender identity.
6. Use a staging/test recipient before sending to real users.
7. Run provider readiness in dry-run mode first.

Do not reuse production email credentials in staging. Do not commit dashboard
secrets, DNS verification values, screenshots containing keys, or provider
response payloads that include sensitive data.

## Setup Checklist

1. Verify the sender domain or address in Resend.
2. Add `RESEND_API_KEY` to Render or the deployment provider secret store.
3. Set `EMAIL_FROM` to the verified sender.
4. Restart the backend so the new environment is loaded.
5. Run `npm run verify:providers` in dry-run mode.
6. Run live email readiness only to your own staging/test address.
7. Create one invitation in staging and confirm delivery or safe fallback.
8. Resend that invitation and confirm the old invite link is invalid.
9. Trigger consultation automation and confirm the assigned staff email only if
   `CONSULTATION_AUTO_EMAIL_ENABLED=true`.

## Invitation Token Handling

Invitation tokens are sensitive.

- The database stores only a SHA-256 `tokenHash`.
- Create and resend responses return a one-time `inviteUrl` so an Admin can copy
  it if email is disabled or delivery fails.
- Console email logs use a redacted invitation URL.
- Resending rotates the token and invalidates older links immediately.
- Accepted, revoked, expired, and invalid tokens cannot be reused.

Do not paste raw invite links into public issues, logs, screenshots, or release
notes.

## Readiness Check

Run the provider readiness script from the server directory:

```bash
cd server
npm run verify:providers
```

The default mode is `dry-run`.

- `EMAIL_PROVIDER=console` confirms that no real delivery will be attempted.
- `EMAIL_PROVIDER=disabled` confirms email is intentionally disabled.
- `EMAIL_PROVIDER=resend` checks that required Resend configuration is present.
- Dry-run mode does not send an email.

Live email verification is explicit opt-in and requires a safe recipient:

```bash
cd server
PROVIDER_READINESS_MODE=live PROVIDER_READINESS_TEST_EMAIL_TO=<staging-recipient@example.com> npm run verify:providers
```

The script sends one generic readiness email only when
`EMAIL_PROVIDER=resend`, `PROVIDER_READINESS_MODE=live`, and
`PROVIDER_READINESS_TEST_EMAIL_TO` are set. The recipient is masked in script
output.

If you are also verifying live S3 storage in the same run, add
`PROVIDER_READINESS_ALLOW_WRITE=true` only after confirming the bucket or prefix
is disposable.

## Staging Checklist

- Use a verified sender, not an unverified production domain.
- Send first to a staging/test recipient.
- Create one pending invitation and confirm `emailDelivery`.
- Resend that invitation and confirm the old invite link no longer works.
- Confirm logs redact `RESEND_API_KEY`, invite tokens, and preview URLs.
- Confirm email failure does not delete the invitation or public consultation
  request.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Readiness fails with missing API key | Confirm `EMAIL_PROVIDER=resend` has `RESEND_API_KEY` in the secret store, not in committed files. |
| Provider rejects sender | Confirm `EMAIL_FROM` exactly matches a verified Resend sender or domain identity. |
| Provider rejects recipient | Use a staging/test recipient first and review provider account restrictions. |
| No real email is sent | Confirm `EMAIL_PROVIDER` is not `disabled` or `console`, and `PROVIDER_READINESS_MODE=live` is set only for intentional tests. |
| Email lands in spam or promotions | Review sender domain DNS, SPF/DKIM/DMARC, and message reputation before real use. |
| From or reply-to is wrong | Confirm `EMAIL_FROM` and optional `EMAIL_REPLY_TO` are set in the deployment provider and the backend was restarted. |

## Known Limitations

- Live Resend delivery requires an external Resend account, sender verification,
  and dashboard-managed secrets.
- The repository does not include bounce handling, webhook processing,
  unsubscribe preferences, or email analytics.
- Email templates are currently English-only even though the frontend supports
  English and Vietnamese UI labels.
