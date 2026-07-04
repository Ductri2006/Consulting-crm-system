import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const isHttpOrigin = (value: string): boolean => {
  try {
    const url = new URL(value);

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin === value
    );
  } catch {
    return false;
  }
};

const isClientUrlList = (value: string): boolean =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .every((origin) => origin.length > 0 && isHttpOrigin(origin));

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
  CLIENT_URL: z
    .string({ error: "CLIENT_URL is required." })
    .trim()
    .min(1, "CLIENT_URL is required.")
    .refine(
      isClientUrlList,
      "CLIENT_URL must be one or more comma-separated HTTP or HTTPS origins without paths, queries, hashes, or trailing slashes.",
    ),
  JWT_SECRET: z
    .string({ error: "JWT_SECRET is required." })
    .trim()
    .min(32, "JWT_SECRET must contain at least 32 characters."),
  JWT_EXPIRES_IN: z
    .string({ error: "JWT_EXPIRES_IN is required." })
    .trim()
    .min(1, "JWT_EXPIRES_IN cannot be empty.")
    .default("7d"),
  UPLOAD_DIR: z
    .string()
    .trim()
    .min(1, "UPLOAD_DIR cannot be empty.")
    .default("uploads"),
  MAX_FILE_SIZE_MB: z.coerce
    .number()
    .min(1, "MAX_FILE_SIZE_MB must be between 1 and 50.")
    .max(50, "MAX_FILE_SIZE_MB must be between 1 and 50.")
    .default(10),
  DEFAULT_ORGANIZATION_SLUG: z
    .string()
    .trim()
    .min(1, "DEFAULT_ORGANIZATION_SLUG cannot be empty.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "DEFAULT_ORGANIZATION_SLUG must be a lowercase URL-safe slug.",
    )
    .default("advisora-demo"),
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
