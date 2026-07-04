import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const prisma = new PrismaClient();

const demoAdminEmail = "admin@advisora.demo";
const demoAdminPassword = "password123";
const defaultOrganizationSlug = "advisora-demo";
const requiredServiceSlugs = [
  "real-estate-consulting",
  "legal-consulting",
  "investment-consulting",
  "construction-consulting",
] as const;

const verifyDatabase = async (): Promise<boolean> => {
  await prisma.$connect();

  const [
    userCount,
    serviceCount,
    defaultOrganization,
    admin,
    seededServices,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.service.count(),
    prisma.organization.findUnique({
      where: { slug: defaultOrganizationSlug },
      select: {
        name: true,
        isActive: true,
      },
    }),
    prisma.user.findUnique({
      where: { email: demoAdminEmail },
      select: {
        passwordHash: true,
        role: true,
        isActive: true,
      },
    }),
    prisma.service.findMany({
      where: {
        slug: { in: [...requiredServiceSlugs] },
        isActive: true,
      },
      select: { slug: true },
    }),
  ]);

  const adminPasswordMatches =
    admin !== null &&
    (await bcrypt.compare(demoAdminPassword, admin.passwordHash));
  const adminIsReady =
    admin !== null &&
    admin.role === UserRole.ADMIN &&
    admin.isActive &&
    adminPasswordMatches;
  const activeServiceSlugs = new Set(
    seededServices.map((service) => service.slug),
  );
  const missingServiceSlugs = requiredServiceSlugs.filter(
    (slug) => !activeServiceSlugs.has(slug),
  );
  const servicesAreReady = missingServiceSlugs.length === 0;
  const organizationIsReady =
    defaultOrganization !== null && defaultOrganization.isActive;

  console.log(`Users found: ${userCount}`);
  console.log(`Services found: ${serviceCount}`);
  console.log(
    `Default workspace: ${organizationIsReady ? "OK" : "FAILED"}`,
  );
  console.log(`Seeded administrator: ${adminIsReady ? "OK" : "FAILED"}`);
  console.log(
    `Required active services: ${servicesAreReady ? "OK" : "FAILED"} (${seededServices.length}/${requiredServiceSlugs.length})`,
  );

  if (!servicesAreReady) {
    console.error(`Missing service slugs: ${missingServiceSlugs.join(", ")}`);
  }

  return organizationIsReady && adminIsReady && servicesAreReady;
};

const main = async (): Promise<void> => {
  try {
    const isReady = await verifyDatabase();

    if (!isReady) {
      console.error(
        "Database verification failed. Run migrations and the seed, then try again.",
      );
      process.exitCode = 1;
      return;
    }

    console.log("Database verification completed successfully.");
  } catch {
    console.error(
      "Database verification could not connect or query the database. Check the database connection, migrations, and seed status.",
    );
    process.exitCode = 1;
  } finally {
    try {
      await prisma.$disconnect();
    } catch {
      console.error("Database verification could not disconnect cleanly.");
      process.exitCode = 1;
    }
  }
};

void main();
