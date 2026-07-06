import { z } from "zod";

import { redactSensitiveText } from "../../utils/redact";
import type { AiCaseSummaryDraft } from "./ai.types";

const MAX_LIST_ITEMS = 8;
const MAX_ITEM_CHARS = 500;
const MAX_SUMMARY_CHARS = 1_200;

const summaryListSchema = z.array(z.string()).default([]);

export const aiSummaryDraftSchema = z.object({
  summary: z.string().default(""),
  keyFacts: summaryListSchema,
  timeline: summaryListSchema,
  documentHighlights: summaryListSchema,
  risks: summaryListSchema,
  missingInformation: summaryListSchema,
  recommendedNextActions: summaryListSchema,
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]).default("LOW"),
}).passthrough();

const truncate = (value: string, maxLength: number): string => {
  const sanitized = redactSensitiveText(value).replace(/\s+/g, " ").trim();

  if (sanitized.length <= maxLength) {
    return sanitized;
  }

  return `${sanitized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

const sanitizeList = (items: string[]): string[] =>
  items
    .map((item) => truncate(item, MAX_ITEM_CHARS))
    .filter((item) => item.length > 0)
    .slice(0, MAX_LIST_ITEMS);

const getLongestListKey = (
  draft: AiCaseSummaryDraft,
): keyof Omit<AiCaseSummaryDraft, "summary" | "confidence"> | null => {
  const keys = [
    "keyFacts",
    "timeline",
    "documentHighlights",
    "risks",
    "missingInformation",
    "recommendedNextActions",
  ] as const;
  let longestKey: (typeof keys)[number] | null = null;
  let longestLength = 0;

  for (const key of keys) {
    if (draft[key].length > longestLength) {
      longestKey = key;
      longestLength = draft[key].length;
    }
  }

  return longestKey;
};

const fitOutputBudget = (
  draft: AiCaseSummaryDraft,
  maxOutputChars: number,
): AiCaseSummaryDraft => {
  const output = {
    ...draft,
    keyFacts: [...draft.keyFacts],
    timeline: [...draft.timeline],
    documentHighlights: [...draft.documentHighlights],
    risks: [...draft.risks],
    missingInformation: [...draft.missingInformation],
    recommendedNextActions: [...draft.recommendedNextActions],
  };
  const budget = Math.max(500, maxOutputChars);

  while (JSON.stringify(output).length > budget) {
    const longestKey = getLongestListKey(output);

    if (!longestKey || output[longestKey].length <= 1) {
      break;
    }

    output[longestKey].pop();
  }

  if (JSON.stringify(output).length <= budget) {
    return output;
  }

  return {
    ...output,
    summary: truncate(output.summary, Math.min(MAX_SUMMARY_CHARS, 600)),
    keyFacts: output.keyFacts.map((item) => truncate(item, 240)),
    timeline: output.timeline.map((item) => truncate(item, 240)),
    documentHighlights: output.documentHighlights.map((item) =>
      truncate(item, 240),
    ),
    risks: output.risks.map((item) => truncate(item, 240)),
    missingInformation: output.missingInformation.map((item) =>
      truncate(item, 240),
    ),
    recommendedNextActions: output.recommendedNextActions.map((item) =>
      truncate(item, 240),
    ),
  };
};

export const sanitizeAiSummaryDraft = (
  value: unknown,
  maxOutputChars: number,
): AiCaseSummaryDraft | null => {
  const parsed = aiSummaryDraftSchema.safeParse(value);

  if (!parsed.success) {
    return null;
  }

  const draft: AiCaseSummaryDraft = {
    summary: truncate(parsed.data.summary, MAX_SUMMARY_CHARS),
    keyFacts: sanitizeList(parsed.data.keyFacts),
    timeline: sanitizeList(parsed.data.timeline),
    documentHighlights: sanitizeList(parsed.data.documentHighlights),
    risks: sanitizeList(parsed.data.risks),
    missingInformation: sanitizeList(parsed.data.missingInformation),
    recommendedNextActions: sanitizeList(parsed.data.recommendedNextActions),
    confidence: parsed.data.confidence,
  };

  if (!draft.summary) {
    return null;
  }

  return fitOutputBudget(draft, maxOutputChars);
};
