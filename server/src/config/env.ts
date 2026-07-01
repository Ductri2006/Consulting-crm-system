import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const envSchema = z.object({
  PORT: z.coerce
    .number()
    .int("PORT must be an integer.")
    .min(1, "PORT must be between 1 and 65535.")
    .max(65535, "PORT must be between 1 and 65535.")
    .default(5000),
  NODE_ENV: z
    .enum(["development", "test", "production"], {
      error: "NODE_ENV must be development, test, or production.",
    })
    .default("development"),
  DATABASE_URL: z
    .string({ error: "DATABASE_URL is required." })
    .trim()
    .min(1, "DATABASE_URL is required.")
    .refine(
      (value) =>
        value.startsWith("postgresql://") || value.startsWith("postgres://"),
      "DATABASE_URL must be a PostgreSQL connection URL.",
    ),
  CLIENT_URL: z.url({
    protocol: /^https?$/,
    error: "CLIENT_URL must be a valid HTTP or HTTPS URL.",
  }),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => {
      const field = issue.path.join(".") || "environment";
      return `${field}: ${issue.message}`;
    })
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${details}`);
}

export type Environment = z.infer<typeof envSchema>;

export const env: Readonly<Environment> = Object.freeze(parsedEnv.data);
