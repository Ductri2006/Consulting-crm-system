# Compact curl smoke test

This is a compact companion to [api-smoke-test.md](./api-smoke-test.md). In
Windows PowerShell use `curl.exe`, because `curl` can be an alias for
`Invoke-WebRequest`.

Set placeholders for values copied from earlier responses:

```powershell
$BASE_URL = "http://localhost:5000"
$TOKEN = "<paste-token-here>"
$SERVICE_ID = "<service-id>"
$CUSTOMER_ID = "<customer-id>"
$CASE_ID = "<case-id>"
$DOCUMENT_ID = "<document-id>"
$TODAY = Get-Date -Format 'yyyy-MM-dd'
```

Health, login, and public services:

```powershell
curl.exe "$BASE_URL/api/health"

$loginBody = @{
  email = "admin@advisora.demo"
  password = "password123"
} | ConvertTo-Json -Compress

$loginBody | curl.exe -X POST "$BASE_URL/api/auth/login" `
  -H "Content-Type: application/json" `
  --data-binary '@-'

curl.exe "$BASE_URL/api/public/services"
```

Copy `data.accessToken` from login into `$TOKEN`, and copy an item ID from
`data.items` into `$SERVICE_ID`. Piping JSON through standard input avoids the
quote-stripping behavior of native executable arguments in Windows PowerShell.

Create the customer and public request:

```powershell
$customerBody = @{
  fullName = "Phase 10 Test Customer"
  phone = "+84901234567"
  email = "phase10.customer@example.com"
  source = "Phase 10 real database smoke test"
} | ConvertTo-Json -Compress

$customerBody | curl.exe -X POST "$BASE_URL/api/customers" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  --data-binary '@-'

$requestBody = @{
  fullName = "Phase 10 Public Request"
  phone = "+84907654321"
  email = "phase10.request@example.com"
  serviceId = $SERVICE_ID
  message = "Please contact me about a Phase 10 database test."
} | ConvertTo-Json -Compress

$requestBody | curl.exe -X POST "$BASE_URL/api/public/consultation-requests" `
  -H "Content-Type: application/json" `
  --data-binary '@-'
```

Copy `data.customer.id` into `$CUSTOMER_ID`, then create and advance a case:

```powershell
$caseBody = @{
  customerId = $CUSTOMER_ID
  serviceId = $SERVICE_ID
  title = "Phase 10 database verification case"
  priority = "HIGH"
  deadline = "2099-12-31T17:00:00.000Z"
} | ConvertTo-Json -Compress

$caseBody | curl.exe -X POST "$BASE_URL/api/cases" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  --data-binary '@-'
```

Copy `data.case.id` into `$CASE_ID`, then advance the case:

```powershell
$statusBody = @{
  status = "VERIFYING"
  note = "Phase 10 transition check"
} | ConvertTo-Json -Compress

$statusBody | curl.exe -X PATCH "$BASE_URL/api/cases/$CASE_ID/status" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  --data-binary '@-'
```

Create related records:

```powershell
$appointmentBody = @{
  customerId = $CUSTOMER_ID
  caseProfileId = $CASE_ID
  appointmentDate = $TODAY
  startTime = "09:00"
  endTime = "10:00"
  method = "ONLINE"
} | ConvertTo-Json -Compress

$appointmentBody | curl.exe -X POST "$BASE_URL/api/appointments" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  --data-binary '@-'

$taskBody = @{
  caseProfileId = $CASE_ID
  title = "Review Phase 10 verification"
  priority = "HIGH"
  deadline = "2099-12-29T17:00:00.000Z"
} | ConvertTo-Json -Compress

$taskBody | curl.exe -X POST "$BASE_URL/api/tasks" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  --data-binary '@-'
```

Create a valid one-pixel PNG, then upload and download it:

```powershell
$UPLOAD_PATH = ".\tmp\phase10-upload.png"
$DOWNLOAD_PATH = ".\tmp\phase10-download.png"
New-Item -ItemType Directory -Force ".\tmp" | Out-Null

$pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
[IO.File]::WriteAllBytes($UPLOAD_PATH, [Convert]::FromBase64String($pngBase64))

curl.exe -X POST "$BASE_URL/api/documents/upload" `
  -H "Authorization: Bearer $TOKEN" `
  -F "file=@$UPLOAD_PATH;type=image/png" `
  -F "customerId=$CUSTOMER_ID" `
  -F "caseProfileId=$CASE_ID" `
  -F "fileType=OTHER"
```

Copy `data.document.id` into `$DOCUMENT_ID`, then download:

```powershell
curl.exe "$BASE_URL/api/documents/$DOCUMENT_ID/download" `
  -H "Authorization: Bearer $TOKEN" `
  --output "$DOWNLOAD_PATH"

if ((Get-FileHash $UPLOAD_PATH).Hash -ne (Get-FileHash $DOWNLOAD_PATH).Hash) {
  throw "Downloaded content does not match the uploaded file."
}

Remove-Item -LiteralPath $UPLOAD_PATH, $DOWNLOAD_PATH
```

The temporary files live under the Git-ignored `server/tmp` directory and are
removed after their hashes match.

Dashboard checks:

```powershell
curl.exe "$BASE_URL/api/dashboard/overview" `
  -H "Authorization: Bearer $TOKEN"

curl.exe "$BASE_URL/api/dashboard/cases-by-status" `
  -H "Authorization: Bearer $TOKEN"

curl.exe "$BASE_URL/api/dashboard/recent-activities?limit=10" `
  -H "Authorization: Bearer $TOKEN"
```

Expected status codes and response assertions are listed in the full API
checklist. Never save `$TOKEN` in a committed file.
