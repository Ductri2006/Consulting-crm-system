const REDACTION_PATTERNS: Array<[RegExp, string]> = [
  [/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1[redacted-token]"],
  [/(\/api\/invitations\/public\/)[^/?#\s]+/gi, "$1[redacted-token]"],
  [/(\/invite\/)[^/?#\s]+/gi, "$1[redacted-token]"],
  [/s3:\/\/[^\s"'<>]+/gi, "[redacted-storage-url]"],
  [/(signedUrl|storageKey|objectKey|token|password|secret)=([^&\s]+)/gi, "$1=[redacted]"],
  [/(DATABASE_URL|JWT_SECRET|RESEND_API_KEY|DOCUMENT_STORAGE_ACCESS_KEY_ID|DOCUMENT_STORAGE_SECRET_ACCESS_KEY)=([^\s]+)/gi, "$1=[redacted]"],
  [/[A-Za-z]:\\[^\s"'<>]+/g, "[redacted-local-path]"],
  [/\/uploads\/[^\s"'<>]+/gi, "/uploads/[redacted-file]"],
];

export const redactSensitiveText = (value: string): string =>
  REDACTION_PATTERNS.reduce(
    (current, [pattern, replacement]) =>
      current.replace(pattern, replacement),
    value,
  );

export const redactObject = (value: unknown): unknown => {
  if (typeof value === "string") {
    return redactSensitiveText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactObject(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => {
      if (/authorization|token|password|secret|key|url|path/i.test(key)) {
        return [key, "[redacted]"];
      }

      return [key, redactObject(item)];
    }),
  );
};
