import { useMemo, type PointerEvent as ReactPointerEvent } from "react";
import type { SlidesViewport } from "@slidev-react/core/slides/viewport";
import type { SlideComponent, SlideMeta } from "@slidev-react/core/slides/slide";
import { DrawOverlay } from "../draw/DrawOverlay";
import { useDraw } from "../draw/DrawProvider";
import type { PresentationCursorState } from "../types";
import type { SlidesConfig } from "../presenter/model/types";
import { resolveSlideSurface, resolveSlideSurfaceClassName } from "./slideSurface";
import { useSlideScale } from "./slideViewport";
import { useResolvedLayout } from "../../../theme/useResolvedLayout";
import { SlideErrorBoundary } from "./SlideErrorBoundary";

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

function toTransitionClassName(transition: string | undefined) {
  switch (transition) {
    case "slide-left":
      return "slide-transition slide-transition--slide-left";
    case "slide-up":
      return "slide-transition slide-transition--slide-up";
    case "zoom":
      return "slide-transition slide-transition--zoom";
    case "fade":
      return "slide-transition slide-transition--fade";
    default:
      return undefined;
  }
}

function resolveStageContentClassName(transitionClassName: string | undefined) {
  return transitionClassName ? `size-full ${transitionClassName}` : "size-full";
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
  const Layout = useResolvedLayout(meta.layout ?? slidesLayout);
  const surface = resolveSlideSurface({
    meta,
    slidesBackground,
    className: resolveSlideSurfaceClassName({
      layout: meta.layout ?? slidesLayout,
      shadowClass: "shadow-[0_20px_60px_rgba(21,42,82,0.12)]",
    }),
  });
  const transitionClassName = toTransitionClassName(meta.transition ?? slidesTransition);
  const stageContentClassName = resolveStageContentClassName(transitionClassName);

  return (
    <article
      className={surface.className}
      style={surface.style}
    >
      <div className={stageContentClassName}>
        <Layout>
          <Slide />
        </Layout>
        <DrawOverlay slideId={slideId} scale={scale} viewport={slidesViewport} />
      </div>
    </article>
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
  const draw = useDraw();
  const { viewportRef, scale, offset } = useSlideScale(scaleMultiplier, "center", slidesViewport);
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
      <div style={viewportStageStyle}>
        <SlideErrorBoundary
          resetKey={slideId}
          slideId={slideId}
          title={meta.title}
        >
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
