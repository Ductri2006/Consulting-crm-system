import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const services = [
  {
    name: "Real Estate Consulting",
    slug: "real-estate-consulting",
    description:
      "Guidance for real estate transactions, due diligence, and property-related decisions.",
  },
  {
    name: "Legal Consulting",
    slug: "legal-consulting",
    description:
      "Practical legal guidance for individuals, organizations, and business operations.",
  },
  {
    name: "Investment Consulting",
    slug: "investment-consulting",
    description:
      "Support for evaluating opportunities, risks, and sustainable investment strategies.",
  },
  {
    name: "Construction Consulting",
    slug: "construction-consulting",
    description:
      "Professional advice for construction planning, compliance, and project delivery.",
  },
] as const;

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("password123", 12);

  await prisma.user.upsert({
    where: { email: "admin@advisora.demo" },
    update: {
      fullName: "Advisora Administrator",
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      fullName: "Advisora Administrator",
      email: "admin@advisora.demo",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  await Promise.all(
    services.map((service) =>
      prisma.service.upsert({
        where: { slug: service.slug },
        update: {
          name: service.name,
          description: service.description,
          isActive: true,
        },
        create: service,
      }),
    ),
  );

  console.log("Seed completed: demo administrator and consulting services are ready.");
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
