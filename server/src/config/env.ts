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

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (!value) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed || undefined;
  });

const booleanString = (defaultValue: "true" | "false") =>
  z.enum(["true", "false"]).default(defaultValue).transform((value) => value === "true");

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
  DOCUMENT_STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  DOCUMENT_STORAGE_BUCKET: optionalTrimmedString,
  DOCUMENT_STORAGE_REGION: optionalTrimmedString,
  DOCUMENT_STORAGE_ENDPOINT: optionalTrimmedString,
  DOCUMENT_STORAGE_ACCESS_KEY_ID: optionalTrimmedString,
  DOCUMENT_STORAGE_SECRET_ACCESS_KEY: optionalTrimmedString,
  DOCUMENT_STORAGE_FORCE_PATH_STYLE: booleanString("true"),
  DOCUMENT_SIGNED_URL_EXPIRES_SECONDS: z.coerce
    .number()
    .int("DOCUMENT_SIGNED_URL_EXPIRES_SECONDS must be an integer.")
    .min(60, "DOCUMENT_SIGNED_URL_EXPIRES_SECONDS must be at least 60 seconds.")
    .max(3600, "DOCUMENT_SIGNED_URL_EXPIRES_SECONDS must be at most 3600 seconds.")
    .default(300),
  DOCUMENT_MALWARE_SCANNER: z
    .enum(["disabled", "mock", "clamav"])
    .default("disabled"),
  DOCUMENT_ALLOW_DOWNLOAD_WHEN_SCAN_SKIPPED: booleanString("true"),
  DOCUMENT_ALLOW_DOWNLOAD_WHEN_SCAN_FAILED: booleanString("false"),
  CLAMAV_HOST: optionalTrimmedString,
  CLAMAV_PORT: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().min(1).max(65535).optional(),
  ),
  DOCUMENT_OCR_PROVIDER: z
    .enum(["disabled", "mock", "tesseract"])
    .default("disabled"),
  DOCUMENT_OCR_MAX_FILE_SIZE_MB: z.coerce
    .number()
    .min(1, "DOCUMENT_OCR_MAX_FILE_SIZE_MB must be between 1 and 50.")
    .max(50, "DOCUMENT_OCR_MAX_FILE_SIZE_MB must be between 1 and 50.")
    .default(10),
  DOCUMENT_OCR_ENABLED_MIME_TYPES: optionalTrimmedString,
  DEFAULT_ORGANIZATION_SLUG: z
    .string()
    .trim()
    .min(1, "DEFAULT_ORGANIZATION_SLUG cannot be empty.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "DEFAULT_ORGANIZATION_SLUG must be a lowercase URL-safe slug.",
    )
    .default("advisora-demo"),
  WORKSPACE_SIGNUP_ENABLED: z.enum(["true", "false"]).default("false"),
  CONSULTATION_AUTOMATION_ENABLED: booleanString("true"),
  CONSULTATION_AUTO_TASK_ENABLED: booleanString("true"),
  CONSULTATION_AUTO_EMAIL_ENABLED: booleanString("true"),
  CONSULTATION_FOLLOW_UP_DUE_HOURS: z.coerce
    .number()
    .int("CONSULTATION_FOLLOW_UP_DUE_HOURS must be an integer.")
    .min(1, "CONSULTATION_FOLLOW_UP_DUE_HOURS must be at least 1.")
    .max(720, "CONSULTATION_FOLLOW_UP_DUE_HOURS must be at most 720.")
    .default(24),
  APP_NAME: z.string().trim().min(1, "APP_NAME cannot be empty.").default("Advisora CRM"),
  EMAIL_PROVIDER: z.enum(["disabled", "console", "resend"]).default("console"),
  EMAIL_FROM: z
    .string()
    .trim()
    .min(1, "EMAIL_FROM cannot be empty.")
    .default("Advisora CRM <no-reply@advisora.test>"),
  EMAIL_REPLY_TO: optionalTrimmedString,
  RESEND_API_KEY: optionalTrimmedString,
  RATE_LIMIT_ENABLED: booleanString("true"),
  AUTH_RATE_LIMIT_WINDOW_MINUTES: z.coerce
    .number()
    .int("AUTH_RATE_LIMIT_WINDOW_MINUTES must be an integer.")
    .min(1, "AUTH_RATE_LIMIT_WINDOW_MINUTES must be at least 1.")
    .default(15),
  AUTH_RATE_LIMIT_MAX: z.coerce
    .number()
    .int("AUTH_RATE_LIMIT_MAX must be an integer.")
    .min(1, "AUTH_RATE_LIMIT_MAX must be at least 1.")
    .default(10),
  PUBLIC_RATE_LIMIT_WINDOW_MINUTES: z.coerce
    .number()
    .int("PUBLIC_RATE_LIMIT_WINDOW_MINUTES must be an integer.")
    .min(1, "PUBLIC_RATE_LIMIT_WINDOW_MINUTES must be at least 1.")
    .default(15),
  PUBLIC_RATE_LIMIT_MAX: z.coerce
    .number()
    .int("PUBLIC_RATE_LIMIT_MAX must be an integer.")
    .min(1, "PUBLIC_RATE_LIMIT_MAX must be at least 1.")
    .default(50),
  UPLOAD_RATE_LIMIT_WINDOW_MINUTES: z.coerce
    .number()
    .int("UPLOAD_RATE_LIMIT_WINDOW_MINUTES must be an integer.")
    .min(1, "UPLOAD_RATE_LIMIT_WINDOW_MINUTES must be at least 1.")
    .default(15),
  UPLOAD_RATE_LIMIT_MAX: z.coerce
    .number()
    .int("UPLOAD_RATE_LIMIT_MAX must be an integer.")
    .min(1, "UPLOAD_RATE_LIMIT_MAX must be at least 1.")
    .default(20),
  DOWNLOAD_RATE_LIMIT_WINDOW_MINUTES: z.coerce
    .number()
    .int("DOWNLOAD_RATE_LIMIT_WINDOW_MINUTES must be an integer.")
    .min(1, "DOWNLOAD_RATE_LIMIT_WINDOW_MINUTES must be at least 1.")
    .default(15),
  DOWNLOAD_RATE_LIMIT_MAX: z.coerce
    .number()
    .int("DOWNLOAD_RATE_LIMIT_MAX must be an integer.")
    .min(1, "DOWNLOAD_RATE_LIMIT_MAX must be at least 1.")
    .default(100),
}).superRefine((value, context) => {
  if (value.DOCUMENT_STORAGE_PROVIDER !== "s3") {
    return;
  }

  const requiredS3Fields: Array<keyof typeof value> = [
    "DOCUMENT_STORAGE_BUCKET",
    "DOCUMENT_STORAGE_REGION",
    "DOCUMENT_STORAGE_ACCESS_KEY_ID",
    "DOCUMENT_STORAGE_SECRET_ACCESS_KEY",
  ];

  for (const field of requiredS3Fields) {
    if (!value[field]) {
      context.addIssue({
        code: "custom",
        path: [field],
        message: `${field} is required when DOCUMENT_STORAGE_PROVIDER=s3.`,
      });
    }
  }
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
