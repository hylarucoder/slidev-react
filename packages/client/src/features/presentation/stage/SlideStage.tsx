import { useMemo, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { SlideComponent, SlideMeta } from "@slidev-react/core/slides/slide";
import type { SlidesViewport } from "@slidev-react/core/slides/viewport";
import { DrawOverlay } from "../draw/DrawOverlay";
import { useDraw } from "../draw/DrawProvider";
import { resolveSlideTransitionVariants, resolveSceneTransition } from "../motion/scene";
import type { SlidesConfig } from "../presenter/model/types";
import type { PresentationCursorState } from "../types";
import { useResolvedLayout } from "../../../theme/useResolvedLayout";
import { SlideErrorBoundary } from "./SlideErrorBoundary";
import { resolveSlideSurface, resolveSlideSurfaceClassName } from "./slideSurface";
import { useSlideScale } from "./slideViewport";

const DEFAULT_SLIDE_TRANSITION_DURATION = 0.36;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function shouldIgnoreStageAdvance(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return !!target.closest('a, button, input, textarea, select, [contenteditable="true"]');
}

function toSlidePoint(
  event: ReactPointerEvent<HTMLElement>,
  offset: { x: number; y: number },
  scale: number,
  viewport: SlidesViewport,
): PresentationCursorState {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: clamp((event.clientX - rect.left - offset.x) / scale, 0, viewport.width),
    y: clamp((event.clientY - rect.top - offset.y) / scale, 0, viewport.height),
  };
}

function toViewportPoint(
  point: PresentationCursorState,
  offset: { x: number; y: number },
  scale: number,
) {
  return {
    x: offset.x + point.x * scale,
    y: offset.y + point.y * scale,
  };
}

function resolveStageTransitionName(transition: string | undefined) {
  switch (transition) {
    case "fade":
    case "slide-left":
    case "slide-up":
    case "zoom":
      return transition;
    default:
      return "none";
  }
}

function SlideStageFrame({
  Slide,
  slideId,
  meta,
  slidesConfig,
  scale,
}: {
  Slide: SlideComponent;
  slideId: string;
  meta: SlideMeta;
  slidesConfig: SlidesConfig;
  scale: number;
}) {
  const { slidesLayout, slidesBackground, slidesTransition, slidesViewport } = slidesConfig;
  const prefersReducedMotion = useReducedMotion();
  const Layout = useResolvedLayout(meta.layout ?? slidesLayout);
  const surface = resolveSlideSurface({
    meta,
    slidesBackground,
    className: resolveSlideSurfaceClassName({
      layout: meta.layout ?? slidesLayout,
      shadowClass: "shadow-[0_20px_60px_rgba(21,42,82,0.12)]",
    }),
  });
  const transitionName = resolveStageTransitionName(meta.transition ?? slidesTransition);
  const animate = transitionName !== "none" && !prefersReducedMotion;

  // When animations are off, bypass motion entirely — no AnimatePresence hold,
  // no layout FLIP, no duration-0 dance. Swap is a plain React reconciliation.
  if (!animate) {
    return (
      <article
        className={surface.className}
        style={{
          ...surface.style,
          position: "absolute",
          inset: 0,
        }}
        data-slide-transition={transitionName}
      >
        <div className="size-full">
          <Layout>
            <Slide />
          </Layout>
          <DrawOverlay slideId={slideId} scale={scale} viewport={slidesViewport} />
        </div>
      </article>
    );
  }

  const variants = resolveSlideTransitionVariants({
    variant: transitionName,
    reducedMotion: Boolean(prefersReducedMotion),
  });
  const transition = resolveSceneTransition({
    defaultDuration: DEFAULT_SLIDE_TRANSITION_DURATION,
    reducedMotion: Boolean(prefersReducedMotion),
  });

  return (
    <motion.article
      className={surface.className}
      style={{
        ...surface.style,
        position: "absolute",
        inset: 0,
      }}
      initial="enter"
      animate="center"
      exit="exit"
      variants={variants}
      transition={transition}
      data-slide-transition={transitionName}
    >
      <motion.div className="size-full" layout>
        <Layout>
          <Slide />
        </Layout>
        <DrawOverlay slideId={slideId} scale={scale} viewport={slidesViewport} />
      </motion.div>
    </motion.article>
  );
}

export function SlideStage({
  Slide,
  slideId,
  meta,
  slidesConfig,
  remoteCursor,
  onCursorChange,
  onStageAdvance,
  scaleMultiplier = 1,
}: {
  Slide: SlideComponent;
  slideId: string;
  meta: SlideMeta;
  slidesConfig: SlidesConfig;
  remoteCursor?: PresentationCursorState | null;
  onCursorChange?: (cursor: PresentationCursorState | null) => void;
  onStageAdvance?: () => void;
  scaleMultiplier?: number;
}) {
  const { slidesViewport, slidesLayout, slidesBackground, slidesTransition } = slidesConfig;
  const prefersReducedMotion = useReducedMotion();
  const draw = useDraw();
  const { viewportRef, scale, offset } = useSlideScale(scaleMultiplier, "center", slidesViewport);
  const effectiveTransitionName = resolveStageTransitionName(meta.transition ?? slidesTransition);
  const stageShouldAnimate = effectiveTransitionName !== "none" && !prefersReducedMotion;
  const viewportStageStyle = useMemo(
    () => ({
      width: `${slidesViewport.width}px`,
      height: `${slidesViewport.height}px`,
      transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
      transformOrigin: "top left",
    }),
    [slidesViewport.height, slidesViewport.width, offset.x, offset.y, scale],
  );
  const remoteCursorPosition = useMemo(() => {
    if (!remoteCursor) return null;

    return toViewportPoint(remoteCursor, offset, scale);
  }, [offset, remoteCursor, scale]);

  return (
    <main
      ref={viewportRef}
      className="relative size-full min-h-0 min-w-0 overflow-hidden p-0"
      onPointerMove={(event) => {
        if (!onCursorChange) return;

        onCursorChange(toSlidePoint(event, offset, scale, slidesViewport));
      }}
      onPointerLeave={() => {
        onCursorChange?.(null);
      }}
      onClick={(event) => {
        if (!onStageAdvance || draw.enabled) return;

        if (shouldIgnoreStageAdvance(event.target)) return;

        onStageAdvance();
      }}
    >
      <div style={viewportStageStyle} className="relative">
        <SlideErrorBoundary resetKey={slideId} slideId={slideId} title={meta.title}>
          {stageShouldAnimate ? (
            <AnimatePresence initial={false} mode="sync">
              <SlideStageFrame
                key={`${slideId}:${meta.transition ?? slidesTransition ?? "none"}`}
                Slide={Slide}
                slideId={slideId}
                meta={meta}
                slidesConfig={{
                  slidesViewport,
                  slidesLayout,
                  slidesBackground,
                  slidesTransition,
                }}
                scale={scale}
              />
            </AnimatePresence>
          ) : (
            <SlideStageFrame
              Slide={Slide}
              slideId={slideId}
              meta={meta}
              slidesConfig={{
                slidesViewport,
                slidesLayout,
                slidesBackground,
                slidesTransition,
              }}
              scale={scale}
            />
          )}
        </SlideErrorBoundary>
      </div>
      {remoteCursorPosition && (
        <span
          aria-hidden
          className="pointer-events-none absolute z-30 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-rose-500 bg-rose-300/40 shadow-[0_0_0_3px_rgba(244,63,94,0.15)]"
          style={{
            left: `${remoteCursorPosition.x}px`,
            top: `${remoteCursorPosition.y}px`,
          }}
        />
      )}
    </main>
  );
}
