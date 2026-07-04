import { env } from "../../config/env";
import type {
  EmailDeliveryResult,
  EmailProvider,
  SendEmailInput,
} from "./email.types";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";

const getSafeError = (error: unknown): string =>
  error instanceof Error ? error.message : "Email delivery failed.";

const getProvider = (): EmailProvider => env.EMAIL_PROVIDER;

const maskEmailAddress = (email: string): string => {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return "[masked-email]";
  }

  const visibleLocal = localPart.slice(0, 2);
  return `${visibleLocal}${"*".repeat(Math.max(localPart.length - 2, 3))}@${domain}`;
};

const sendDisabled = (): EmailDeliveryResult => ({
  status: "DISABLED",
  provider: getProvider(),
});

const sendConsole = (input: SendEmailInput): EmailDeliveryResult => {
  console.info("Email preview generated.", {
    provider: "console",
    to: maskEmailAddress(input.to),
    subject: input.subject,
    auditLabel: input.auditLabel,
    acceptUrl: input.redactedPreviewUrl,
  });

  return {
    status: "MOCK_SENT",
    provider: "console",
    messageId: `console-${Date.now()}`,
  };
};

const sendResend = async (
  input: SendEmailInput,
): Promise<EmailDeliveryResult> => {
  if (!env.RESEND_API_KEY) {
    return {
      status: "FAILED",
      provider: "resend",
      error: "RESEND_API_KEY is not configured.",
    };
  }

  try {
    const response = await fetch(RESEND_EMAILS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });
    const payload = await response.json().catch(() => undefined) as
      | { id?: unknown; message?: unknown }
      | undefined;

    if (!response.ok) {
      return {
        status: "FAILED",
        provider: "resend",
        error:
          typeof payload?.message === "string"
            ? payload.message
            : `Resend request failed with status ${response.status}.`,
      };
    }

    return {
      status: "SENT",
      provider: "resend",
      ...(typeof payload?.id === "string" ? { messageId: payload.id } : {}),
    };
  } catch (error) {
    return {
      status: "FAILED",
      provider: "resend",
      error: getSafeError(error),
    };
  }
};

export const sendEmail = async (
  input: SendEmailInput,
): Promise<EmailDeliveryResult> => {
  const provider = getProvider();

  if (provider === "disabled") {
    return sendDisabled();
  }

  if (provider === "console") {
    return sendConsole(input);
  }

  return sendResend(input);
};

export const skippedEmailDelivery = (): EmailDeliveryResult => ({
  status: "DISABLED",
  provider: getProvider(),
});
