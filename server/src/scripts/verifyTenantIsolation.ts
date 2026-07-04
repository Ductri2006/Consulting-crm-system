import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const prisma = new PrismaClient();

const ADVISORA_SLUG = "advisora-demo";
const NORTHSTAR_SLUG = "northstar-legal";

const advisoraDemoEmails = [
  "admin.demo@advisora.test",
  "manager.demo@advisora.test",
  "staff.demo@advisora.test",
] as const;

const northstarDemoEmails = [
  "admin.demo@northstar.test",
  "manager.demo@northstar.test",
  "staff.demo@northstar.test",
] as const;

const northstarCustomerNames = [
  "Aurora Legal Group",
  "Pacific Compliance Studio",
  "Meridian Contract Partners",
] as const;

const northstarCaseCodes = [
  "NORTH-LEG-001",
  "NORTH-LEG-002",
  "NORTH-RE-001",
] as const;

const northstarTaskIds = [
  "00000000-0000-4000-8000-000000001601",
  "00000000-0000-4000-8000-000000001602",
  "00000000-0000-4000-8000-000000001603",
] as const;

const assertCondition = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const verifyTenantIsolation = async (): Promise<void> => {
  await prisma.$connect();

  const [advisoraOrganization, northstarOrganization] = await Promise.all([
    prisma.organization.findUnique({
      where: { slug: ADVISORA_SLUG },
      select: { id: true, isActive: true },
    }),
    prisma.organization.findUnique({
      where: { slug: NORTHSTAR_SLUG },
      select: { id: true, isActive: true },
    }),
  ]);

  if (advisoraOrganization === null || !advisoraOrganization.isActive) {
    throw new Error(
      "Missing active advisora-demo organization. Run migrations and the demo seed first.",
    );
  }
  if (northstarOrganization === null || !northstarOrganization.isActive) {
    throw new Error(
      "Missing active northstar-legal organization. Run seed:second-workspace first.",
    );
  }

  const advisoraId = advisoraOrganization.id;
  const northstarId = northstarOrganization.id;

  const [
    advisoraUsers,
    northstarUsers,
    advisoraCustomers,
    northstarCustomers,
    advisoraCases,
    northstarCases,
    northstarRequests,
    northstarAppointments,
    northstarTasks,
    northstarCaseHistories,
    northstarActivityLogs,
    northstarUsersOutsideNorthstar,
    advisoraUsersInsideNorthstar,
    northstarCustomersOutsideNorthstar,
    northstarCasesOutsideNorthstar,
    northstarTasksOutsideNorthstar,
  ] = await Promise.all([
    prisma.user.count({ where: { organizationId: advisoraId } }),
    prisma.user.count({ where: { organizationId: northstarId } }),
    prisma.customer.count({ where: { organizationId: advisoraId } }),
    prisma.customer.count({ where: { organizationId: northstarId } }),
    prisma.caseProfile.count({ where: { organizationId: advisoraId } }),
    prisma.caseProfile.count({ where: { organizationId: northstarId } }),
    prisma.consultationRequest.count({
      where: { organizationId: northstarId },
    }),
    prisma.appointment.count({ where: { organizationId: northstarId } }),
    prisma.task.count({ where: { organizationId: northstarId } }),
    prisma.caseHistory.count({ where: { organizationId: northstarId } }),
    prisma.activityLog.count({ where: { organizationId: northstarId } }),
    prisma.user.count({
      where: {
        email: { in: [...northstarDemoEmails] },
        organizationId: { not: northstarId },
      },
    }),
    prisma.user.count({
      where: {
        email: { in: [...advisoraDemoEmails] },
        organizationId: northstarId,
      },
    }),
    prisma.customer.count({
      where: {
        fullName: { in: [...northstarCustomerNames] },
        organizationId: { not: northstarId },
      },
    }),
    prisma.caseProfile.count({
      where: {
        caseCode: { in: [...northstarCaseCodes] },
        organizationId: { not: northstarId },
      },
    }),
    prisma.task.count({
      where: {
        id: { in: [...northstarTaskIds] },
        organizationId: { not: northstarId },
      },
    }),
  ]);

  assertCondition(advisoraUsers > 0, "advisora-demo has no users.");
  assertCondition(northstarUsers >= 3, "northstar-legal must have at least 3 users.");
  assertCondition(advisoraCustomers > 0, "advisora-demo has no customers.");
  assertCondition(
    northstarCustomers >= 3,
    "northstar-legal must have at least 3 customers.",
  );
  assertCondition(advisoraCases > 0, "advisora-demo has no cases.");
  assertCondition(northstarCases >= 3, "northstar-legal must have at least 3 cases.");
  assertCondition(
    northstarRequests >= 3,
    "northstar-legal must have at least 3 consultation requests.",
  );
  assertCondition(
    northstarAppointments >= 2,
    "northstar-legal must have at least 2 appointments.",
  );
  assertCondition(northstarTasks >= 3, "northstar-legal must have at least 3 tasks.");
  assertCondition(
    northstarCaseHistories > 0,
    "northstar-legal must have case history records.",
  );
  assertCondition(
    northstarActivityLogs > 0,
    "northstar-legal must have activity log records.",
  );

  const [northstarCasesWithRelations, northstarTasksWithRelations, northstarAppointmentsWithRelations] =
    await Promise.all([
      prisma.caseProfile.findMany({
        where: { organizationId: northstarId },
        select: {
          id: true,
          customer: { select: { organizationId: true } },
          assignedTo: { select: { organizationId: true } },
        },
      }),
      prisma.task.findMany({
        where: { organizationId: northstarId },
        select: {
          id: true,
          caseProfile: { select: { organizationId: true } },
          assignedTo: { select: { organizationId: true } },
          createdBy: { select: { organizationId: true } },
        },
      }),
      prisma.appointment.findMany({
        where: { organizationId: northstarId },
        select: {
          id: true,
          customer: { select: { organizationId: true } },
          caseProfile: { select: { organizationId: true } },
          staff: { select: { organizationId: true } },
        },
      }),
    ]);

  const caseRelationLeaks = northstarCasesWithRelations.filter(
    (caseProfile) =>
      caseProfile.customer.organizationId !== northstarId ||
      (caseProfile.assignedTo !== null &&
        caseProfile.assignedTo.organizationId !== northstarId),
  );
  const taskRelationLeaks = northstarTasksWithRelations.filter(
    (task) =>
      (task.caseProfile !== null &&
        task.caseProfile.organizationId !== northstarId) ||
      (task.assignedTo !== null && task.assignedTo.organizationId !== northstarId) ||
      (task.createdBy !== null && task.createdBy.organizationId !== northstarId),
  );
  const appointmentRelationLeaks = northstarAppointmentsWithRelations.filter(
    (appointment) =>
      appointment.customer.organizationId !== northstarId ||
      (appointment.caseProfile !== null &&
        appointment.caseProfile.organizationId !== northstarId) ||
      (appointment.staff !== null && appointment.staff.organizationId !== northstarId),
  );

  const crossTenantOwnershipChecksPassed =
    northstarUsersOutsideNorthstar === 0 &&
    advisoraUsersInsideNorthstar === 0 &&
    northstarCustomersOutsideNorthstar === 0 &&
    northstarCasesOutsideNorthstar === 0 &&
    northstarTasksOutsideNorthstar === 0 &&
    caseRelationLeaks.length === 0 &&
    taskRelationLeaks.length === 0 &&
    appointmentRelationLeaks.length === 0;

  assertCondition(
    crossTenantOwnershipChecksPassed,
    [
      "Cross-tenant ownership checks failed.",
      `northstarUsersOutsideNorthstar=${northstarUsersOutsideNorthstar}`,
      `advisoraUsersInsideNorthstar=${advisoraUsersInsideNorthstar}`,
      `northstarCustomersOutsideNorthstar=${northstarCustomersOutsideNorthstar}`,
      `northstarCasesOutsideNorthstar=${northstarCasesOutsideNorthstar}`,
      `northstarTasksOutsideNorthstar=${northstarTasksOutsideNorthstar}`,
      `caseRelationLeaks=${caseRelationLeaks.length}`,
      `taskRelationLeaks=${taskRelationLeaks.length}`,
      `appointmentRelationLeaks=${appointmentRelationLeaks.length}`,
    ].join(" "),
  );

  console.log("Tenant isolation verification: PASS");
  console.log(`- advisora-demo users: ${advisoraUsers}`);
  console.log(`- northstar-legal users: ${northstarUsers}`);
  console.log(`- advisora-demo customers: ${advisoraCustomers}`);
  console.log(`- northstar-legal customers: ${northstarCustomers}`);
  console.log(`- advisora-demo cases: ${advisoraCases}`);
  console.log(`- northstar-legal cases: ${northstarCases}`);
  console.log(`- northstar-legal requests: ${northstarRequests}`);
  console.log(`- northstar-legal appointments: ${northstarAppointments}`);
  console.log(`- northstar-legal tasks: ${northstarTasks}`);
  console.log("- cross-tenant ownership checks: PASS");
};

const main = async (): Promise<void> => {
  try {
    await verifyTenantIsolation();
  } catch (error: unknown) {
    console.error("Tenant isolation verification: FAIL");
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

void main();
