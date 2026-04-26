import type { DrawStroke } from "../../draw/DrawProvider";
import type { PresentationCursorState, PresentationSharedState } from "../../types";

export interface LocalPresentationSyncState {
  page: number;
  step: number;
  stepTotal: number;
  timer: number;
  cursor: PresentationCursorState | null;
  drawings: Record<string, DrawStroke[]>;
  drawingsRevision: number;
}

export interface RemotePresentationPatchEffects {
  remoteTimer?: number;
  remoteCursor?: PresentationCursorState | null;
  slideStep?: {
    slideId: string;
    step: number;
  };
  slideStepTotal?: {
    slideId: string;
    stepTotal: number;
  };
  remoteDrawings?: {
    revision: number;
    strokesBySlideId: Record<string, DrawStroke[]>;
  };
}

export function buildPresentationSharedState(
  localState: LocalPresentationSyncState,
): PresentationSharedState {
  return {
    ...localState,
    lastUpdate: 0,
  };
}

export function mapRemotePresentationPatch({
  patch,
  remotePage,
  currentPage,
  resolveSlideId,
}: {
  patch: Partial<PresentationSharedState>;
  remotePage: number;
  currentPage: number;
  resolveSlideId: (index: number) => string | null;
}): RemotePresentationPatchEffects {
  const remoteSlideId = resolveSlideId(remotePage);
  const effects: RemotePresentationPatchEffects = {};

  if (typeof patch.timer === "number") effects.remoteTimer = patch.timer;

  if ("cursor" in patch) {
    effects.remoteCursor = remotePage === currentPage ? (patch.cursor ?? null) : null;
  }

  if (remoteSlideId && typeof patch.stepTotal === "number") {
    effects.slideStepTotal = {
      slideId: remoteSlideId,
      stepTotal: patch.stepTotal,
    };
  }

  if (remoteSlideId && typeof patch.step === "number") {
    effects.slideStep = {
      slideId: remoteSlideId,
      step: patch.step,
    };
  }

  if (patch.drawings) {
    effects.remoteDrawings = {
      revision: typeof patch.drawingsRevision === "number" ? patch.drawingsRevision : Date.now(),
      strokesBySlideId: patch.drawings,
    };
  }

  return effects;
}
