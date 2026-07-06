import type {
  ConsultationFollowUpEmailTemplateInput,
  InvitationEmailTemplateInput,
} from "./email.types";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatDateTime = (value: Date): string =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
    timeZoneName: "short",
    year: "numeric",
  }).format(value);

export const createInvitationEmailTemplate = (
  input: InvitationEmailTemplateInput,
) => {
  const workspaceName = escapeHtml(input.workspaceName);
  const invitedEmail = escapeHtml(input.invitedEmail);
  const role = escapeHtml(input.role);
  const appName = escapeHtml(input.appName);
  const inviteUrl = escapeHtml(input.inviteUrl);
  const expiresAt = escapeHtml(formatDateTime(input.expiresAt));
  const invitedBy = input.invitedBy
    ? `${escapeHtml(input.invitedBy.fullName)} (${escapeHtml(input.invitedBy.email)})`
    : "A workspace administrator";
  const subject = `You're invited to join ${input.workspaceName}`;

  const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 16px;">
                <p style="margin:0 0 10px;color:#2563eb;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">${appName}</p>
                <h1 style="margin:0;color:#0f172a;font-size:24px;line-height:32px;">You're invited to join ${workspaceName}</h1>
                <p style="margin:16px 0 0;color:#475569;font-size:15px;line-height:24px;">${invitedBy} invited ${invitedEmail} to access the workspace as ${role}.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 24px;">
                <a href="${inviteUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 18px;border-radius:10px;">Accept invitation</a>
                <p style="margin:18px 0 0;color:#64748b;font-size:13px;line-height:21px;">This invitation expires on ${expiresAt}.</p>
                <p style="margin:14px 0 0;color:#64748b;font-size:13px;line-height:21px;">If the button does not work, copy and paste this link into your browser:</p>
                <p style="margin:8px 0 0;word-break:break-all;color:#334155;font-size:13px;line-height:20px;">${inviteUrl}</p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #e2e8f0;padding:18px 28px;background:#f8fafc;">
                <p style="margin:0;color:#64748b;font-size:12px;line-height:20px;">If you were not expecting this invitation, you can ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  const text = [
    `You're invited to join ${input.workspaceName}`,
    "",
    `${input.invitedBy ? `${input.invitedBy.fullName} (${input.invitedBy.email})` : "A workspace administrator"} invited ${input.invitedEmail} to access the workspace as ${input.role}.`,
    `Accept invitation: ${input.inviteUrl}`,
    `Expires: ${formatDateTime(input.expiresAt)}`,
    "",
    "If you were not expecting this invitation, you can ignore this email.",
  ].join("\n");

  return {
    subject,
    html,
    text,
  };
};

export const createConsultationFollowUpEmailTemplate = (
  input: ConsultationFollowUpEmailTemplateInput,
) => {
  const appName = escapeHtml(input.appName);
  const assignedToName = escapeHtml(input.assignedToName);
  const requesterName = escapeHtml(input.requesterName);
  const requesterEmail = escapeHtml(input.requesterEmail ?? "Not provided");
  const requesterPhone = escapeHtml(input.requesterPhone ?? "Not provided");
  const serviceName = escapeHtml(input.serviceName);
  const dueAt = escapeHtml(formatDateTime(input.dueAt));
  const adminUrl = escapeHtml(input.adminUrl);
  const messageExcerpt = input.messageExcerpt
    ? escapeHtml(input.messageExcerpt)
    : null;
  const subject = "New consultation request needs follow-up";

  const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 16px;">
                <p style="margin:0 0 10px;color:#2563eb;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">${appName}</p>
                <h1 style="margin:0;color:#0f172a;font-size:24px;line-height:32px;">New consultation request needs follow-up</h1>
                <p style="margin:16px 0 0;color:#475569;font-size:15px;line-height:24px;">Hi ${assignedToName}, a public consultation request was received and assigned for follow-up.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 24px;color:#334155;font-size:14px;line-height:22px;">
                <p style="margin:0;"><strong>Requester:</strong> ${requesterName}</p>
                <p style="margin:8px 0 0;"><strong>Email:</strong> ${requesterEmail}</p>
                <p style="margin:8px 0 0;"><strong>Phone:</strong> ${requesterPhone}</p>
                <p style="margin:8px 0 0;"><strong>Service:</strong> ${serviceName}</p>
                <p style="margin:8px 0 0;"><strong>Follow-up due:</strong> ${dueAt}</p>
                ${messageExcerpt ? `<p style="margin:16px 0 0;"><strong>Message excerpt:</strong><br />${messageExcerpt}</p>` : ""}
                <p style="margin:20px 0 0;">
                  <a href="${adminUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 18px;border-radius:10px;">Open consultation requests</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #e2e8f0;padding:18px 28px;background:#f8fafc;">
                <p style="margin:0;color:#64748b;font-size:12px;line-height:20px;">This message contains only a safe summary. Review the CRM record before contacting the requester.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  const text = [
    subject,
    "",
    `Hi ${input.assignedToName}, a public consultation request was received and assigned for follow-up.`,
    `Requester: ${input.requesterName}`,
    `Email: ${input.requesterEmail ?? "Not provided"}`,
    `Phone: ${input.requesterPhone ?? "Not provided"}`,
    `Service: ${input.serviceName}`,
    `Follow-up due: ${formatDateTime(input.dueAt)}`,
    ...(input.messageExcerpt
      ? ["", `Message excerpt: ${input.messageExcerpt}`]
      : []),
    "",
    `Open consultation requests: ${input.adminUrl}`,
    "",
    "This message contains only a safe summary. Review the CRM record before contacting the requester.",
  ].join("\n");

  return {
    subject,
    html,
    text,
  };
};
