import { useLayoutEffect, useRef, useState } from "react";
import type { SlidesViewport } from "@slidev-react/core/slides/viewport";

type SlideScaleAlignment = "center" | "top-left";

interface SlideScaleTransform {
  scale: number;
  offset: { x: number; y: number };
  ready: boolean;
}

const INITIAL_TRANSFORM: SlideScaleTransform = {
  scale: 1,
  offset: { x: 0, y: 0 },
  ready: false,
};

export function useSlideScale(
  scaleMultiplier: number,
  alignment: SlideScaleAlignment = "center",
  viewport: SlidesViewport,
) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState<SlideScaleTransform>(INITIAL_TRANSFORM);

  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;

      const nextScale =
        Math.min(width / viewport.width, height / viewport.height) * scaleMultiplier;
      const scaledWidth = viewport.width * nextScale;
      const scaledHeight = viewport.height * nextScale;

      setTransform({
        scale: nextScale,
        offset: {
          x: alignment === "top-left" ? 0 : (width - scaledWidth) / 2,
          y: alignment === "top-left" ? 0 : (height - scaledHeight) / 2,
        },
        ready: true,
      });
    };

    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [alignment, scaleMultiplier, viewport.height, viewport.width]);

  return {
    viewportRef,
    scale: transform.scale,
    offset: transform.offset,
    ready: transform.ready,
  };
}
