export type AiProviderMode = "disabled" | "mock" | "external";
export type AiSummaryProvider = "mock" | "external";
export type AiConfidence = "LOW" | "MEDIUM" | "HIGH";

export interface AiCaseSummarySourceCounts {
  caseHistories: number;
  appointments: number;
  tasks: number;
  documents: number;
}

export interface AiCaseSummaryDraft {
  summary: string;
  keyFacts: string[];
  timeline: string[];
  documentHighlights: string[];
  risks: string[];
  missingInformation: string[];
  recommendedNextActions: string[];
  confidence: AiConfidence;
}

export interface AiCaseSummary extends AiCaseSummaryDraft {
  provider: AiSummaryProvider;
  model: string;
  generatedAt: string;
  sourceCounts: AiCaseSummarySourceCounts;
}

export interface SafeAiCaseContext {
  case: {
    id: string;
    caseCode: string;
    title: string;
    description: string | null;
    note: string | null;
    status: string;
    priority: string;
    deadline: string | null;
    createdAt: string;
    updatedAt: string;
  };
  customer: {
    fullName: string;
    email: string | null;
    phone: string;
  };
  service: {
    name: string;
    slug: string;
  };
  assignedStaff: {
    fullName: string;
    role: string;
  } | null;
  histories: Array<{
    action: string;
    oldStatus: string | null;
    newStatus: string | null;
    note: string | null;
    createdAt: string;
    actorName: string | null;
  }>;
  appointments: Array<{
    appointmentDate: string;
    startTime: string;
    endTime: string | null;
    method: string;
    status: string;
    note: string | null;
    staffName: string | null;
  }>;
  tasks: Array<{
    title: string;
    description: string | null;
    status: string;
    priority: string;
    deadline: string | null;
    assignedStaffName: string | null;
  }>;
  documents: Array<{
    fileName: string;
    fileType: string;
    mimeType: string | null;
    source: string;
    visibility: string;
    scanStatus: string;
    ocrStatus: string;
    ocrTextPreview: string | null;
    createdAt: string;
    uploadedBy: {
      type: "internal" | "customer_portal" | "unknown";
      name: string | null;
      role: string | null;
    };
  }>;
  sourceCounts: AiCaseSummarySourceCounts;
}

export interface AiProviderRequest {
  context: SafeAiCaseContext;
  contextText: string;
  sourceCounts: AiCaseSummarySourceCounts;
}
