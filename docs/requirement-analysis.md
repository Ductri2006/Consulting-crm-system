# Requirement Analysis

## 1. Project Overview

Consulting CRM System is a fullstack web application for consulting businesses. It combines two complementary product areas:

1. A public business website
2. An internal CRM and management dashboard

The public website presents the business, its services, projects, and news. It also enables prospective customers to submit consultation requests, contact the business, and request appointments.

The internal dashboard enables staff, managers, and administrators to manage customers, consultation requests, case profiles, appointments, tasks, documents, reports, users, permissions, and activity logs.

The initial implementation is intended to support a single consulting organization. A customer self-service portal and multi-branch capabilities are outside the initial scope and are identified as future extensions.

## 2. Business Context

The system is designed for consulting businesses that provide services in areas such as:

- Real estate consulting
- Legal consulting
- Investment consulting
- Construction consulting

These businesses need to coordinate both external customer communication and internal case processing. A typical end-to-end business process is:

1. A customer visits the public website.
2. The customer submits a consultation request or requests an appointment.
3. Staff reviews and follows up on the submission.
4. Staff creates or updates the customer record.
5. Staff creates a case profile and assigns the appropriate service and owner.
6. The case proceeds through defined processing stages.
7. Relevant documents are uploaded and linked to the customer or case.
8. Staff records progress, notes, tasks, and status changes.
9. Managers monitor deadlines and performance through dashboards and reports.
10. The case is completed and archived, or cancelled with its history retained.

This centralized workflow reduces fragmented customer records, unclear ownership, missed deadlines, and limited management visibility.

## 3. Main System Goals

The system should:

- Present business information professionally.
- Explain the business's consulting services and working process.
- Allow customers to submit consultation requests online.
- Allow customers to request appointments.
- Confirm successful public form submissions.
- Help staff maintain accurate customer records.
- Help staff create and manage consulting case profiles.
- Provide clear ownership, priority, status, and deadline information for each case.
- Preserve case history and supporting documents.
- Help managers monitor workload, deadlines, and staff performance.
- Help administrators manage users and permissions.
- Provide useful reports and dashboard statistics.
- Establish a maintainable foundation for future integrations and customer self-service.

## 4. Public Website Requirements

The public website should be responsive, accessible, easy to navigate, and structured for basic search engine optimization.

### 4.1 Homepage

The homepage should present:

- Hero section
- Business introduction
- Main services
- Working process
- Featured projects
- Latest news
- Consultation call-to-action
- Contact information

### 4.2 About Page

The about page should present:

- Business overview
- Mission
- Vision
- Core values
- Why choose us section

### 4.3 Services Page

The services page should present consulting services such as:

- Real estate consulting
- Legal consulting
- Investment consulting
- Construction consulting

Each service should include:

- Service name
- Short description
- Detailed description
- Benefits
- Call-to-action button

### 4.4 Projects Page

The projects area should include a listing or gallery and sufficient information to understand each project:

- Project images
- Project description
- Project category
- Project location, when available

### 4.5 News Page

The news area should include:

- Article listing
- Article detail page
- Article category
- Article thumbnail
- Published date

### 4.6 Contact Page

The contact page should include:

- Contact form
- Business email
- Phone number
- Address
- Map placeholder
- Working hours

### 4.7 Consultation Request Form

The consultation request form should collect:

- Full name
- Phone number
- Email
- Service type
- Message
- Optional file attachment

The system should validate required fields and contact formats, then display a clear success or error message after submission.

### 4.8 Appointment Request Form

The appointment request form should collect:

- Full name
- Phone number
- Email
- Preferred date
- Preferred time
- Consultation method
- Message

A public appointment submission represents a request. Internal staff may confirm, reschedule, assign, or cancel it through the CRM.

## 5. Customer Reception Requirements

Visitors should be able to:

- Submit online consultation requests.
- Leave contact messages.
- Request appointments.
- Attach documents when needed.
- Receive an on-screen confirmation after a successful submission.

Internal users should be able to review incoming submissions, update their processing status, and convert qualified consultation requests into customer and case records without losing the original request context.

In future versions, customers may also:

- Create an account.
- Log in to track request status.
- Upload additional documents.
- View appointment history.
- View case progress.

## 6. CRM Requirements

The internal CRM should allow authorized staff to:

- Create customer records.
- Update customer information.
- View customer details.
- Search and filter customers.
- View a customer's case profiles.
- View working history.
- View linked appointments and documents.
- Add internal notes.
- Delete or disable records when permitted by business rules.

Customer data should include:

- Full name
- Phone number
- Email
- Address
- Identity number
- Birthday
- Source
- Notes
- Created date
- Updated date

Sensitive customer information should only be available to authenticated users with appropriate permissions.

## 7. Case Profile Requirements

Case profile management is the core CRM workflow. The system should allow authorized staff to:

- Create case profiles.
- Assign customers to case profiles.
- Assign staff to case profiles.
- Select a service type.
- Set case priority.
- Set a case deadline.
- Update case status.
- Add case notes.
- Upload and link documents.
- View a chronological case history.
- Filter cases by status, staff, priority, or service.
- Search cases by code, customer, or service.
- Identify upcoming and overdue deadlines.

A case profile should include:

- Unique case code
- Title
- Description
- Customer
- Service type
- Assigned staff
- Status
- Priority
- Deadline
- Completed date
- Notes
- Documents
- History logs
- Created date
- Updated date

Case priorities should be:

- Low
- Medium
- High
- Urgent

A case is overdue when its deadline has passed and it is neither completed nor cancelled.

## 8. Case Workflow

The case workflow should include the following statuses:

| Status | Meaning |
| --- | --- |
| Received | The case has been received from the customer and registered in the system. |
| Verifying | Staff is checking customer information and supporting documents. |
| Proposing Solution | Staff is analyzing the case and preparing a consulting solution. |
| Processing | The approved consulting work is actively being performed. |
| Completed | The case has been completed and can be archived. |
| Cancelled | The case has been cancelled and is no longer active. |

Every status change should record the previous status, new status, responsible user, timestamp, and an optional note. Completed cases should record a completion date. Historical records should remain available after completion or cancellation.

## 9. Appointment Requirements

The system should support:

- Appointment creation.
- Appointment confirmation.
- Appointment cancellation.
- Appointment rescheduling.
- Appointment completion.
- Appointment status tracking.
- Appointment filtering by date.
- Appointment filtering by staff.
- Appointment filtering by customer.
- Display of today's appointments.

Appointment statuses should be:

- Pending
- Confirmed
- Completed
- Cancelled

Appointment methods should be:

- Offline
- Online
- Phone

Appointment data should include:

- Customer
- Assigned staff
- Related case profile, when applicable
- Appointment date
- Start time
- End time
- Method
- Status
- Notes

The end time should be later than the start time, and rescheduling should preserve an auditable update record.

## 10. Task Management Requirements

The system should support:

- Creating tasks.
- Assigning tasks to staff.
- Linking tasks to case profiles.
- Setting task priority.
- Setting task deadlines.
- Updating task status.
- Adding task descriptions or notes.
- Tracking overdue tasks.
- Filtering tasks by status, priority, assignee, or case.

Task statuses should be:

- Todo
- In Progress
- Done
- Cancelled

Task priorities should be:

- Low
- Medium
- High
- Urgent

A task is overdue when its deadline has passed and it is neither done nor cancelled.

## 11. Document Management Requirements

The system should support:

- Uploading documents.
- Attaching documents to case profiles.
- Attaching documents to customers.
- Storing file metadata.
- Viewing uploaded documents.
- Listing and filtering documents.
- Deleting documents when permitted.
- Managing document access permissions.
- Validating file type and size before accepting an upload.

Stored metadata should include the original file name, file URL or storage key, document type, MIME type, size, uploader, associated customer or case, and upload timestamp.

Document types may include:

- Identity Document
- Real Estate Document
- Contract
- Legal Document
- Construction Document
- Other

Future versions may provide OCR for identity documents and use extracted data to prefill customer information. Extracted values should require user review before being saved.

## 12. User and Permission Requirements

The system should use role-based access control.

### Admin

Administrators should have full system access, including:

- Managing users and roles
- Managing customers, services, cases, appointments, tasks, and documents
- Viewing dashboards, reports, and activity logs
- Configuring system settings

### Manager

Managers should be able to:

- View the dashboard and reports
- Monitor case progress and deadlines
- Manage assigned staff
- Assign work
- Track staff performance

### Staff

Staff members should be able to:

- View assigned customers and case profiles
- Update assigned case profiles
- Upload documents and add working notes
- Manage assigned appointments
- Complete assigned tasks

### Customer

The customer role is planned for a future self-service portal. It may allow customers to:

- View their personal profile.
- Track their submitted requests and case progress.
- Upload required documents.
- View their appointment schedule.

All protected operations should require authentication. Authorization checks should be enforced on the server and should account for both a user's role and record assignment where applicable.

## 13. Dashboard Requirements

The dashboard should provide role-appropriate operational visibility, including:

- Total customers
- Total case profiles
- Cases by status
- Overdue cases
- Today's appointments
- Recent consultation requests
- Pending and overdue tasks
- Upcoming deadlines
- Staff performance
- Monthly case statistics
- Recent user activity

Dashboard figures should be based on the same filters and business definitions used by the corresponding CRM modules.

## 14. Search and Filter Requirements

The system should provide:

- Customer search by name, phone number, or email.
- Case search by code, customer, or service.
- Case filtering by status, assigned staff, priority, and service.
- Appointment filtering by date, staff, customer, and status.
- Task filtering by status, priority, assignee, and case.
- Document filtering by type, customer, and case.
- Consultation request filtering by status and service.
- User filtering by role and active status.

List views should support pagination. Search terms and filters should be combinable, and empty result states should be communicated clearly.

## 15. Non-functional Requirements

### 15.1 Usability and Accessibility

- Public and internal interfaces should be responsive on desktop, tablet, and mobile.
- Navigation, forms, validation feedback, loading states, and empty states should be consistent.
- Common workflows should be understandable without specialized technical knowledge.
- Interfaces should use semantic structure, keyboard-accessible controls, and sufficient visual contrast.

### 15.2 Security and Privacy

- Passwords must be hashed using a proven password-hashing algorithm.
- Protected routes must require valid JWT authentication.
- Role- and assignment-based authorization must be enforced on the server.
- File uploads must validate file type and size.
- User input must be validated and safely handled.
- Secrets and environment-specific values must be stored in environment variables.
- Sensitive customer data must not be exposed through public endpoints or logs.
- Important user actions should be auditable.

### 15.3 Performance and Reliability

- List endpoints should use pagination and appropriate database indexes.
- Common dashboard and search operations should return within an acceptable interactive response time under expected portfolio-scale load.
- API errors should use a consistent response format and should not expose implementation details.
- Failed form submissions should preserve user input when practical and provide actionable feedback.

### 15.4 Maintainability and Scalability

- The codebase should use a clean, modular project structure.
- Business rules should be separated from presentation concerns.
- Shared status and role definitions should remain consistent across the database, API, and user interface.
- The architecture should support extension without requiring major rewrites of core workflows.
- Documentation should be updated when requirements or interfaces change.

## 16. Future Scalability

The system should be designed so that it can later support:

- Multiple branches
- Additional user roles and configurable permissions
- Customer self-service portal
- Email notifications
- SMS notifications
- OCR-assisted document processing
- External system integrations
- Advanced analytics
- Cloud file storage
- Multi-language support
- Export to Excel or PDF

These features are not required for the initial MVP. They should be introduced only after the core customer, case, appointment, task, document, authentication, and reporting workflows are stable.
