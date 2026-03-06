export interface AdvanceRevealInput {
  currentClicks: number;
  currentClicksTotal: number;
  currentIndex: number;
  totalSlides: number;
}

export interface RetreatRevealInput {
  currentClicks: number;
  currentIndex: number;
  previousClicks?: number;
  previousClicksTotal?: number;
}

export interface RevealNavigationResult {
  page: number;
  clicks: number;
}

export function clampRevealCount(next: number, total?: number) {
  if (total === undefined) return Math.max(next, 0);

  return Math.min(Math.max(next, 0), Math.max(total, 0));
}

export function canAdvanceReveal({
  currentClicks,
  currentClicksTotal,
  currentIndex,
  totalSlides,
}: AdvanceRevealInput) {
  return currentClicks < currentClicksTotal || currentIndex < totalSlides - 1;
}

export function canRetreatReveal({
  currentClicks,
  currentIndex,
}: Pick<RetreatRevealInput, "currentClicks" | "currentIndex">) {
  return currentClicks > 0 || currentIndex > 0;
}

export function resolveAdvanceReveal({
  currentClicks,
  currentClicksTotal,
  currentIndex,
  totalSlides,
}: AdvanceRevealInput): RevealNavigationResult | null {
  if (currentClicks < currentClicksTotal) {
    return {
      page: currentIndex,
      clicks: currentClicks + 1,
    };
  }

  if (currentIndex >= totalSlides - 1) return null;

  return {
    page: currentIndex + 1,
    clicks: 0,
  };
}

export function resolveRetreatReveal({
  currentClicks,
  currentIndex,
  previousClicks,
  previousClicksTotal,
}: RetreatRevealInput): RevealNavigationResult | null {
  if (currentClicks > 0) {
    return {
      page: currentIndex,
      clicks: currentClicks - 1,
    };
  }

  if (currentIndex <= 0) return null;

  return {
    page: currentIndex - 1,
    clicks: previousClicks ?? previousClicksTotal ?? 0,
  };
}
