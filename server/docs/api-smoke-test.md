# Real-database API smoke test

Run this checklist only after applying migrations, seeding, running
`npm run db:verify`, and starting the server with `npm run dev`.

Use Postman, Thunder Client, or `curl.exe` with:

```text
Base URL: http://localhost:5000
Content-Type: application/json
```

Protected requests require:

```http
Authorization: Bearer <access-token>
```

All JSON endpoints use a `success`, `message`, and `data` response envelope.
Keep the following values as the test progresses:

| Variable | Read from |
| --- | --- |
| `TOKEN` | Login response: `data.accessToken` |
| `SERVICE_ID` | Public-services response: `data.items[0].id` |
| `CUSTOMER_ID` | Create-customer response: `data.customer.id` |
| `CASE_ID` | Create-case response: `data.case.id` |
| `DOCUMENT_ID` | Upload response: `data.document.id` |

Use a disposable database or unique test data. Replace
`<TODAY_YYYY-MM-DD>` with the current server date; case and task deadlines are
intentionally in the future.

## Checklist

### 1. Health

```http
GET /api/health
```

Expected: `200 OK`, `success: true`, and `data.status: "ok"`.

### 2. Log in as the seeded administrator

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "admin@advisora.demo",
  "password": "password123"
}
```

Expected: `200 OK`. Save `data.accessToken` as `TOKEN`. The response user must
have role `ADMIN` and must not contain `passwordHash`.

### 3. List public services

```http
GET /api/public/services
```

Expected: `200 OK` and the four seeded services (the database may also contain
other active services). Save one active service ID from `data.items[0].id` as
`SERVICE_ID`.

### 4. Create a customer

```http
POST /api/customers
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

```json
{
  "fullName": "Phase 10 Test Customer",
  "phone": "+84901234567",
  "email": "phase10.customer@example.com",
  "source": "Phase 10 real database smoke test"
}
```

Expected: `201 Created`. Save `data.customer.id` as `CUSTOMER_ID`.

### 5. Submit a public consultation request

```http
POST /api/public/consultation-requests
Content-Type: application/json
```

```json
{
  "fullName": "Phase 10 Public Request",
  "phone": "+84907654321",
  "email": "phase10.request@example.com",
  "serviceId": "<SERVICE_ID>",
  "message": "Please contact me about a Phase 10 database test."
}
```

Expected: `201 Created` and `data.request.status: "NEW"`.

### 6. Create a case

```http
POST /api/cases
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

```json
{
  "customerId": "<CUSTOMER_ID>",
  "serviceId": "<SERVICE_ID>",
  "title": "Phase 10 database verification case",
  "description": "Created while verifying the API against PostgreSQL.",
  "priority": "HIGH",
  "deadline": "2099-12-31T17:00:00.000Z"
}
```

Expected: `201 Created`, a generated `data.case.caseCode`, and
`data.case.status: "RECEIVED"`. Save `data.case.id` as `CASE_ID`.

### 7. Advance the case status

```http
PATCH /api/cases/<CASE_ID>/status
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

```json
{
  "status": "VERIFYING",
  "note": "Phase 10 transition check"
}
```

Expected: `200 OK` and `data.case.status: "VERIFYING"`. This also creates case
history used by the recent-activities dashboard.

### 8. Create an appointment

```http
POST /api/appointments
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

```json
{
  "customerId": "<CUSTOMER_ID>",
  "caseProfileId": "<CASE_ID>",
  "appointmentDate": "<TODAY_YYYY-MM-DD>",
  "startTime": "09:00",
  "endTime": "10:00",
  "method": "ONLINE",
  "note": "Phase 10 database verification appointment"
}
```

Expected: `201 Created` and `data.appointment.status: "PENDING"`. Using the
current server date allows the dashboard overview check to include this
appointment in `todayAppointments`.

### 9. Create a task

```http
POST /api/tasks
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

```json
{
  "caseProfileId": "<CASE_ID>",
  "title": "Review Phase 10 verification",
  "description": "Confirm migration, seed, and API results.",
  "priority": "HIGH",
  "deadline": "2099-12-29T17:00:00.000Z"
}
```

Expected: `201 Created` and `data.task.status: "TODO"`.

### 10. Upload a local document

Select a small PDF, JPEG, PNG, WebP, Word, or Excel test file, then send
`multipart/form-data`:

```http
POST /api/documents/upload
Authorization: Bearer <TOKEN>
Content-Type: multipart/form-data
```

| Field | Value |
| --- | --- |
| `file` | Select the local supported test file |
| `customerId` | `<CUSTOMER_ID>` |
| `caseProfileId` | `<CASE_ID>` |
| `fileType` | `OTHER` |

Expected: `201 Created`. Save `data.document.id` as `DOCUMENT_ID`. Confirm the
response exposes metadata but no absolute local filesystem path.

### 11. Download the uploaded document

```http
GET /api/documents/<DOCUMENT_ID>/download
Authorization: Bearer <TOKEN>
```

Expected: `200 OK`, a file response, and content matching the uploaded file.
Confirm a physical file exists under the configured `UPLOAD_DIR`. Delete the
test data/file after verification if it is no longer needed.

### 12. Dashboard overview

```http
GET /api/dashboard/overview
Authorization: Bearer <TOKEN>
```

Expected: `200 OK`. Confirm the customer, case, pending-task, document, and
new-consultation-request totals reflect the records just created. Confirm
`todayAppointments` includes the current-date appointment from step 8.

### 13. Cases by status

```http
GET /api/dashboard/cases-by-status
Authorization: Bearer <TOKEN>
```

Expected: `200 OK`. Every case status is present, including zero-count
statuses, and `VERIFYING` includes the created case.

### 14. Recent activities

```http
GET /api/dashboard/recent-activities?limit=10
Authorization: Bearer <TOKEN>
```

Expected: `200 OK`. Confirm recent case-history activity includes the created
case/status transition and no actor object contains `passwordHash`.

## Result record

Record the database target without credentials, timestamp, migration status,
seed result, `db:verify` result, and pass/fail for steps 1–14. Do not record the
Bearer token or connection string.

This checklist documents expected behavior from the current code. It is not
evidence that a particular PostgreSQL instance was tested until a dated result
record has been completed.
