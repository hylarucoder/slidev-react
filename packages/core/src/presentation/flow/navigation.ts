export interface AdvanceFlowInput {
  currentStepIndex: number;
  currentStepTotal: number;
  currentPageIndex: number;
  totalPages: number;
}

export interface RetreatFlowInput {
  currentStepIndex: number;
  currentPageIndex: number;
  previousStepIndex?: number;
  previousStepTotal?: number;
}

export interface FlowNavigationResult {
  pageIndex: number;
  stepIndex: number;
}

export function clampStepIndex(next: number, total?: number) {
  if (total === undefined) return Math.max(next, 0);

  return Math.min(Math.max(next, 0), Math.max(total, 0));
}

export function canAdvanceFlow({
  currentStepIndex,
  currentStepTotal,
  currentPageIndex,
  totalPages,
}: AdvanceFlowInput) {
  return currentStepIndex < currentStepTotal || currentPageIndex < totalPages - 1;
}

export function canRetreatFlow({
  currentStepIndex,
  currentPageIndex,
}: Pick<RetreatFlowInput, "currentStepIndex" | "currentPageIndex">) {
  return currentStepIndex > 0 || currentPageIndex > 0;
}

export function resolveAdvanceFlow({
  currentStepIndex,
  currentStepTotal,
  currentPageIndex,
  totalPages,
}: AdvanceFlowInput): FlowNavigationResult | null {
  if (currentStepIndex < currentStepTotal) {
    return {
      pageIndex: currentPageIndex,
      stepIndex: currentStepIndex + 1,
    };
  }

  if (currentPageIndex >= totalPages - 1) return null;

  return {
    pageIndex: currentPageIndex + 1,
    stepIndex: 0,
  };
}

export function resolveRetreatFlow({
  currentStepIndex,
  currentPageIndex,
  previousStepIndex,
  previousStepTotal,
}: RetreatFlowInput): FlowNavigationResult | null {
  if (currentStepIndex > 0) {
    return {
      pageIndex: currentPageIndex,
      stepIndex: currentStepIndex - 1,
    };
  }

  if (currentPageIndex <= 0) return null;

  return {
    pageIndex: currentPageIndex - 1,
    stepIndex: previousStepIndex ?? previousStepTotal ?? 0,
  };
}
