import {
  Priority,
  TaskStatus,
  UserRole,
} from "@prisma/client";

import { env } from "../../config/env";
import {
  createConsultationFollowUpEmailTemplate,
  sendEmail,
  skippedEmailDelivery,
  type EmailDeliveryResult,
} from "../../lib/email";
import { prisma } from "../../lib/prisma";
import { redactSensitiveText } from "../../utils/redact";
import type {
  ConsultationAutomationRequest,
  ConsultationAutomationTaskResult,
} from "./automation.types";

const MESSAGE_EXCERPT_LENGTH = 240;
const TASK_DESCRIPTION_EXCERPT_LENGTH = 360;
const ACTIVITY_DESCRIPTION_LENGTH = 500;
const HOUR_IN_MS = 60 * 60 * 1_000;

const managerAdminAssignmentOrder = [
  UserRole.MANAGER,
  UserRole.ADMIN,
] as const;

type FollowUpAssignee = {
  id: string;
  fullName: string;
  email: string;
};

const truncate = (value: string, maxLength: number): string =>
  value.length > maxLength
    ? `${value.slice(0, Math.max(maxLength - 1, 0)).trim()}...`
    : value;

const safeText = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const redacted = redactSensitiveText(value).replace(/\s+/g, " ").trim();

  return redacted || null;
};

const getSafeErrorMessage = (error: unknown): string =>
  redactSensitiveText(
    error instanceof Error ? error.message : "Unknown automation error.",
  );

const getPrimaryClientOrigin = (): string =>
  env.CLIENT_URL.split(",")[0]?.trim() ?? env.CLIENT_URL;

const buildAdminConsultationRequestsUrl = (): string =>
  `${getPrimaryClientOrigin()}/admin/consultation-requests`;

const formatIso = (date: Date): string => date.toISOString();

const getRequesterLabel = (
  request: ConsultationAutomationRequest,
): string => safeText(request.fullName) ?? "Unknown requester";

const getServiceLabel = (
  request: ConsultationAutomationRequest,
): string => safeText(request.service?.name) ?? "Not selected";

const getMessageExcerpt = (
  request: ConsultationAutomationRequest,
  length: number,
): string | null => {
  const message = safeText(request.message);

  return message ? truncate(message, length) : null;
};

const getFollowUpDueAt = (): Date =>
  new Date(Date.now() + env.CONSULTATION_FOLLOW_UP_DUE_HOURS * HOUR_IN_MS);

const findFollowUpAssignee = async (
  organizationId: string,
): Promise<FollowUpAssignee | null> => {
  for (const role of managerAdminAssignmentOrder) {
    const user = await prisma.user.findFirst({
      where: {
        organizationId,
        isActive: true,
        role,
      },
      orderBy: [
        { createdAt: "asc" },
        { fullName: "asc" },
        { id: "asc" },
      ],
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    if (user) {
      return user;
    }
  }

  return null;
};

const recordAutomationActivity = async ({
  action,
  description,
  entityId,
  entityType,
  organizationId,
}: {
  action: string;
  description: string;
  entityId: string | null;
  entityType: string;
  organizationId: string;
}): Promise<void> => {
  try {
    await prisma.activityLog.create({
      data: {
        organizationId,
        action,
        entityType,
        entityId,
        description: truncate(
          redactSensitiveText(description).trim(),
          ACTIVITY_DESCRIPTION_LENGTH,
        ),
      },
    });
  } catch (error) {
    console.warn("Consultation automation activity log failed.", {
      action,
      entityId,
      entityType,
      organizationId,
      error: getSafeErrorMessage(error),
    });
  }
};

const getTaskTitle = (request: ConsultationAutomationRequest): string => {
  const requester = getRequesterLabel(request);
  const service = getServiceLabel(request);

  return `Follow up consultation request: ${requester || service}`;
};

const getTaskDescription = (
  request: ConsultationAutomationRequest,
  dueAt: Date,
): string => {
  const messageExcerpt = getMessageExcerpt(
    request,
    TASK_DESCRIPTION_EXCERPT_LENGTH,
  );
  const lines = [
    "Auto-created follow-up for a public consultation request.",
    `Requester: ${getRequesterLabel(request)}`,
    `Email: ${safeText(request.email) ?? "Not provided"}`,
    `Phone: ${safeText(request.phone) ?? "Not provided"}`,
    `Service: ${getServiceLabel(request)}`,
    `Submitted: ${formatIso(request.createdAt)}`,
    `Follow-up due: ${formatIso(dueAt)}`,
    `Consultation request ID: ${request.id}`,
  ];

  if (messageExcerpt) {
    lines.push(`Message excerpt: ${messageExcerpt}`);
  }

  return lines.join("\n");
};

const createFollowUpTask = async (
  request: ConsultationAutomationRequest,
): Promise<ConsultationAutomationTaskResult> => {
  const assignedTo = await findFollowUpAssignee(request.organizationId);
  const deadline = getFollowUpDueAt();
  const task = await prisma.task.create({
    data: {
      organizationId: request.organizationId,
      title: getTaskTitle(request),
      description: getTaskDescription(request, deadline),
      assignedToId: assignedTo?.id,
      createdById: null,
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      deadline,
    },
    select: {
      id: true,
    },
  });

  return {
    id: task.id,
    assignedTo,
    deadline,
  };
};

const getEmailActivityAction = (
  emailDelivery: EmailDeliveryResult,
): string => {
  if (emailDelivery.status === "FAILED") {
    return "CONSULTATION_AUTOMATION_EMAIL_FAILED";
  }

  if (emailDelivery.status === "DISABLED") {
    return "CONSULTATION_AUTOMATION_EMAIL_SKIPPED";
  }

  return "CONSULTATION_AUTOMATION_EMAIL_SENT";
};

const getEmailActivityDescription = (
  emailDelivery: EmailDeliveryResult,
  assignedTo: FollowUpAssignee | null,
): string => {
  if (!assignedTo) {
    return "Consultation automation email skipped because no manager or admin assignee was available.";
  }

  if (emailDelivery.status === "FAILED") {
    return `Consultation automation email delivery failed via ${emailDelivery.provider}.`;
  }

  if (emailDelivery.status === "DISABLED") {
    return `Consultation automation email delivery skipped for provider ${emailDelivery.provider}.`;
  }

  return `Consultation automation email delivery completed via ${emailDelivery.provider}.`;
};

const deliverFollowUpEmail = async ({
  request,
  task,
}: {
  request: ConsultationAutomationRequest;
  task: ConsultationAutomationTaskResult;
}): Promise<EmailDeliveryResult> => {
  if (!env.CONSULTATION_AUTO_EMAIL_ENABLED || !task.assignedTo) {
    return skippedEmailDelivery();
  }

  try {
    const template = createConsultationFollowUpEmailTemplate({
      appName: env.APP_NAME,
      adminUrl: buildAdminConsultationRequestsUrl(),
      assignedToName: task.assignedTo.fullName,
      dueAt: task.deadline,
      messageExcerpt: getMessageExcerpt(request, MESSAGE_EXCERPT_LENGTH),
      requesterEmail: safeText(request.email),
      requesterName: getRequesterLabel(request),
      requesterPhone: safeText(request.phone),
      serviceName: getServiceLabel(request),
    });

    return await sendEmail({
      to: task.assignedTo.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo: env.EMAIL_REPLY_TO,
      auditLabel: `ConsultationRequest:${request.id}`,
      redactedPreviewUrl: buildAdminConsultationRequestsUrl(),
    });
  } catch (error) {
    return {
      status: "FAILED",
      provider: env.EMAIL_PROVIDER,
      error: getSafeErrorMessage(error),
    };
  }
};

const recordEmailActivity = async ({
  emailDelivery,
  request,
  task,
}: {
  emailDelivery: EmailDeliveryResult;
  request: ConsultationAutomationRequest;
  task: ConsultationAutomationTaskResult;
}): Promise<void> => {
  await recordAutomationActivity({
    organizationId: request.organizationId,
    action: getEmailActivityAction(emailDelivery),
    entityType: "ConsultationRequest",
    entityId: request.id,
    description: getEmailActivityDescription(emailDelivery, task.assignedTo),
  });
};

const recordTaskCreatedActivity = async ({
  request,
  task,
}: {
  request: ConsultationAutomationRequest;
  task: ConsultationAutomationTaskResult;
}): Promise<void> => {
  await recordAutomationActivity({
    organizationId: request.organizationId,
    action: "CONSULTATION_FOLLOW_UP_TASK_CREATED",
    entityType: "Task",
    entityId: task.id,
    description: task.assignedTo
      ? `Follow-up task created for consultation request and assigned to ${task.assignedTo.fullName}.`
      : "Follow-up task created for consultation request without an assignee.",
  });
};

const recordTaskFailedActivity = async (
  request: ConsultationAutomationRequest,
): Promise<void> => {
  await recordAutomationActivity({
    organizationId: request.organizationId,
    action: "CONSULTATION_FOLLOW_UP_TASK_FAILED",
    entityType: "ConsultationRequest",
    entityId: request.id,
    description:
      "Follow-up task creation failed after the consultation request was saved.",
  });
};

const recordRequestCreatedActivity = async (
  request: ConsultationAutomationRequest,
): Promise<void> => {
  await recordAutomationActivity({
    organizationId: request.organizationId,
    action: "CONSULTATION_REQUEST_CREATED",
    entityType: "ConsultationRequest",
    entityId: request.id,
    description: `Public consultation request received from ${getRequesterLabel(request)}.`,
  });
};

const recordTaskDisabledEmailSkipped = async (
  request: ConsultationAutomationRequest,
): Promise<void> => {
  await recordAutomationActivity({
    organizationId: request.organizationId,
    action: "CONSULTATION_AUTOMATION_EMAIL_SKIPPED",
    entityType: "ConsultationRequest",
    entityId: request.id,
    description:
      "Consultation automation email skipped because automatic follow-up tasks are disabled.",
  });
};

export const handleConsultationRequestAutomation = async (
  request: ConsultationAutomationRequest,
): Promise<void> => {
  await recordRequestCreatedActivity(request);

  if (!env.CONSULTATION_AUTOMATION_ENABLED) {
    return;
  }

  if (!env.CONSULTATION_AUTO_TASK_ENABLED) {
    await recordTaskDisabledEmailSkipped(request);
    return;
  }

  let task: ConsultationAutomationTaskResult;

  try {
    task = await createFollowUpTask(request);
  } catch (error) {
    console.warn("Consultation automation task creation failed.", {
      requestId: request.id,
      organizationId: request.organizationId,
      error: getSafeErrorMessage(error),
    });
    await recordTaskFailedActivity(request);
    return;
  }

  await recordTaskCreatedActivity({ request, task });
  const emailDelivery = await deliverFollowUpEmail({ request, task });
  await recordEmailActivity({ emailDelivery, request, task });
};
