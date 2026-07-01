import { CaseStatus } from "@prisma/client";

const nextWorkflowStatus: Partial<Record<CaseStatus, CaseStatus>> = {
  [CaseStatus.RECEIVED]: CaseStatus.VERIFYING,
  [CaseStatus.VERIFYING]: CaseStatus.PROPOSING_SOLUTION,
  [CaseStatus.PROPOSING_SOLUTION]: CaseStatus.PROCESSING,
  [CaseStatus.PROCESSING]: CaseStatus.COMPLETED,
};

export const isTerminalCaseStatus = (status: CaseStatus): boolean =>
  status === CaseStatus.COMPLETED || status === CaseStatus.CANCELLED;

export const isValidCaseTransition = (
  current: CaseStatus,
  next: CaseStatus,
): boolean => {
  if (current === next || isTerminalCaseStatus(current)) {
    return false;
  }

  if (next === CaseStatus.CANCELLED) {
    return true;
  }

  return nextWorkflowStatus[current] === next;
};
