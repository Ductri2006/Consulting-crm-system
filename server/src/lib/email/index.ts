export { sendEmail, skippedEmailDelivery } from "./email.client";
export {
  createConsultationFollowUpEmailTemplate,
  createInvitationEmailTemplate,
} from "./email.templates";
export type {
  ConsultationFollowUpEmailTemplateInput,
  EmailDeliveryResult,
  EmailDeliveryStatus,
  EmailProvider,
  InvitationEmailTemplateInput,
  SendEmailInput,
} from "./email.types";
