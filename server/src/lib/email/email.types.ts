export type EmailProvider = "disabled" | "console" | "resend";

export type EmailDeliveryStatus =
  | "DISABLED"
  | "MOCK_SENT"
  | "SENT"
  | "FAILED";

export interface EmailDeliveryResult {
  status: EmailDeliveryStatus;
  provider: EmailProvider;
  messageId?: string;
  error?: string;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  auditLabel?: string;
  redactedPreviewUrl?: string;
}

export interface InvitationEmailTemplateInput {
  appName: string;
  workspaceName: string;
  invitedEmail: string;
  role: string;
  invitedBy?: {
    fullName: string;
    email: string;
  } | null;
  inviteUrl: string;
  expiresAt: Date;
}

export interface ConsultationFollowUpEmailTemplateInput {
  appName: string;
  assignedToName: string;
  requesterName: string;
  requesterEmail?: string | null;
  requesterPhone?: string | null;
  serviceName: string;
  messageExcerpt?: string | null;
  dueAt: Date;
  adminUrl: string;
}
