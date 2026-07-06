# Module Breakdown

This document describes the functional modules of the Consulting CRM System and their responsibilities. The modules are organized around the public customer journey, internal consulting workflow, administration, and reporting needs.

## 1. Public Website Module

The Public Website Module presents business information to visitors and provides the entry points to the customer reception workflow.

Main pages:

- Homepage
- About page
- Services page and service detail
- Projects page
- News page and article detail
- Contact page

Main features:

- Business introduction
- Service cards and service details
- Working process
- Project gallery
- News listing
- Contact form
- Consultation request form
- Appointment request form
- Responsive layout
- Basic SEO-friendly page structure

The module consumes published services, projects, and news. Public form submissions are passed to the relevant reception modules for internal follow-up.

## 2. Authentication Module

The Authentication Module establishes user identity and protects internal system features.

Main features:

- Login
- Logout
- Get current user
- Password hashing
- JWT access token generation and verification
- Authentication middleware
- Protected routes
- Role-based access control
- Active-user checks

Internal roles:

- Admin
- Manager
- Staff

Customer portal access uses separate `CustomerPortalAccount` records and portal
JWTs with `purpose: "customer_portal"` rather than an internal `User` role.
Authorization must be enforced by the backend; hiding user interface controls
alone is not sufficient.

## 3. User Management Module

The User Management Module allows administrators to manage internal system users and their access.

Main features:

- Create user
- Update user
- Disable user
- Deactivate or reactivate users instead of hard delete
- View user list and details
- Assign role
- Search users
- Filter users by role or status

User fields:

- Full name
- Email
- Password hash
- Phone
- Role
- Avatar
- Active status
- Created date
- Updated date

Key relationships:

- Users can own or be assigned case profiles.
- Users can be assigned appointments and tasks.
- Users can upload documents and trigger audited CRM actions.
- Significant user actions can produce activity log records.

## 4. Customer Management Module

The Customer Management Module maintains the central record for each customer.

Main features:

- Create customer
- Update customer
- Delete or disable customer when permitted
- View customer details
- Search customers by name, phone number, or email
- Filter customers
- Add internal notes
- View customer cases
- View customer appointments
- View customer documents
- View working history

Customer fields:

- Full name
- Phone
- Email
- Address
- Identity number
- Birthday
- Source
- Notes
- Created date
- Updated date

Customer records may originate from manual entry or conversion of a public consultation request. Access to identity and contact information must be restricted to authorized internal users.

## 5. Service Management Module

The Service Management Module stores the consulting services offered by the business and provides a shared service catalog to public and internal workflows.

Example services:

- Real estate consulting
- Legal consulting
- Investment consulting
- Construction consulting

Main features:

- Create service
- Update service
- Disable service
- View and manage the service list
- Publish active services on the public website
- Select a service when submitting a consultation request
- Select a service when creating a case profile

Disabling a service should prevent new selection without removing its historical relationship to existing requests or cases.

## 6. Consultation Request Module

The Consultation Request Module receives and manages consultation requests submitted through the public website.

Main features:

- Submit consultation request
- Store customer contact information, requested service, message, and optional attachment
- Display requests in the internal dashboard
- Search and filter requests
- Update request status
- Convert a request into a customer
- Convert a request into a case profile
- Retain the original request context after conversion

Request statuses:

- New
- Contacted
- Converted
- Closed

Conversion should avoid accidental duplicate customer or case records and should record the user and time responsible for the action.

## 7. Case Profile Management Module

The Case Profile Management Module is the core business module. It coordinates the customer, consulting service, responsible staff, workflow status, deadlines, and supporting work for a consulting engagement.

Main features:

- Create a case profile
- Generate a unique case code
- Assign a customer
- Assign a service
- Assign staff
- Update status
- Update priority
- Set and monitor a deadline
- Set a completion date
- Add notes
- Upload and link documents
- View case history
- Search and filter cases
- Identify upcoming and overdue cases

Case statuses:

- Received
- Verifying
- Proposing Solution
- Processing
- Completed
- Cancelled

Case priorities:

- Low
- Medium
- High
- Urgent

Key relationships:

- Each case belongs to a customer and a service.
- A case may be assigned to a staff member.
- A case may have appointments, tasks, documents, and history entries.

## 8. Case History Module

The Case History Module provides an immutable chronological record of important changes to a case profile.

Main features:

- Log case creation
- Log status changes
- Log staff assignment
- Log priority or deadline changes
- Log document uploads
- Log notes and other significant updates
- Show a timeline on the case detail page

Example history items:

- A user changed the case status from Received to Verifying.
- A manager assigned the case to a staff member.
- A user uploaded an identity document.
- A user added an internal note.

Each history item should identify the case, action, responsible user, timestamp, and relevant details. This module supplies case-specific traceability, while the Activity Log Module covers broader system activity.

## 9. Appointment Management Module

The Appointment Management Module manages appointment requests and scheduled interactions with customers.

Main features:

- Create an appointment
- Receive a public appointment request
- Assign customer, case, and staff when applicable
- Confirm an appointment
- Reschedule an appointment
- Cancel an appointment
- Mark an appointment as completed
- Filter appointments by date, staff, customer, or status
- Show today's appointments

Appointment statuses:

- Pending
- Confirmed
- Completed
- Cancelled

Appointment methods:

- Offline
- Online
- Phone

An appointment stores its date, start time, end time, method, status, notes, and relevant customer, staff, and case references.

## 10. Task Management Module

The Task Management Module helps managers and staff plan and track internal work.

Main features:

- Create task
- Assign task to staff
- Link task to a case profile
- Update task status
- Set task deadline
- Set task priority
- Add a description or notes
- Search and filter tasks
- Track overdue tasks

Task statuses:

- Todo
- In Progress
- Done
- Cancelled

Task priorities:

- Low
- Medium
- High
- Urgent

A task is overdue when its deadline has passed and it is neither done nor cancelled.

## 11. Document Management Module

The Document Management Module stores and organizes digital files related to customers and case profiles.

Main features:

- Upload document
- Validate file type and size
- Attach document to a case
- Attach document to a customer
- Store file metadata
- View and filter the document list
- Delete a document when permitted
- Control document access

Document types:

- Identity Document
- Real Estate Document
- Contract
- Legal Document
- Construction Document
- Other

Document metadata should include the file name, MIME type, size, uploader, type, related record, upload time, storage provider status, scan status, OCR status, and download audit counters. Raw storage keys, bucket names, local paths, and legacy file URLs stay backend-only; downloads use authenticated internal and portal routes backed by the configured local or S3-compatible private storage provider.

## 12. Dashboard Module

The Dashboard Module provides a role-appropriate overview of current business operations.

Main statistics:

- Total customers
- Total case profiles
- Cases by status
- Overdue cases
- Today's appointments
- Recent consultation requests
- Pending and overdue tasks
- Upcoming deadlines
- Monthly case count
- Staff performance
- Recent activity

Dashboard cards and charts should use consistent business definitions and link to the relevant filtered management view where practical.

## 13. Report Module

The Report Module provides aggregated operational and performance information over selected time periods.

Report types:

- Daily report
- Weekly report
- Monthly report
- Staff performance report
- Case status report
- Appointment report

Main features:

- Select a reporting period
- Aggregate cases, appointments, tasks, and performance data
- Compare operational results
- Restrict report access by role
- Support future Excel or PDF export

The Dashboard Module focuses on current at-a-glance information, while this module supports deeper period-based analysis.

## 14. Activity Log Module

The Activity Log Module records important actions performed by authenticated users across the system.

Logged actions may include:

- User login
- Create or update customer
- Create case
- Update case status
- Assign staff
- Upload or delete document
- Create or update task
- Create or update appointment
- Manage users or roles

Each log entry should capture the responsible user, action, entity type, entity identifier, description, timestamp, and IP address when available. Activity logs should be read-only to ordinary users and accessible only to authorized roles.

## 15. Future OCR Module

The OCR Module may be added after the core document and customer workflows are stable.

Possible features:

- Upload an identity document image.
- Extract full name.
- Extract identity number.
- Extract birthday.
- Prefill the customer form.
- Show extraction confidence or validation warnings.
- Require user confirmation before saving extracted data.

This module depends on the Document Management and Customer Management modules. It should not automatically overwrite verified customer information.

## Module Interaction Summary

The primary business flow across modules is:

1. The Public Website Module sends consultation or appointment submissions into the reception workflow.
2. The Consultation Request Module qualifies a lead and can create a record in the Customer Management Module.
3. The Case Profile Management Module links the customer to a service and assigned staff member.
4. Appointment, Task, and Document Management modules support delivery of the consulting case.
5. Case History and Activity Log modules preserve traceability.
6. Dashboard and Report modules aggregate operational data for managers and administrators.
7. Authentication and User Management modules secure every internal interaction.

This separation keeps each module focused while preserving a coherent end-to-end customer and case management process.
