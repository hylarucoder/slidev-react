import { useLayoutEffect, type CSSProperties, type ReactNode } from "react";
import { useReveal } from "../../features/reveal/RevealContext";

type AnnotateType =
  | "underline"
  | "box"
  | "circle"
  | "highlight"
  | "strike-through"
  | "crossed-off";

export type AnnotateProps = {
  children: ReactNode;
  type?: AnnotateType;
  step?: number;
  animate?: boolean;
  color?: string;
};

const DEFAULT_ANIMATION_DURATION_MS = 520;

const defaultColorByType: Record<AnnotateType, string> = {
  underline: "#2563eb",
  box: "#2563eb",
  circle: "#2563eb",
  highlight: "rgba(250, 204, 21, 0.78)",
  "strike-through": "#ef4444",
  "crossed-off": "#ef4444",
};

const defaultPaddingByType: Record<AnnotateType, [number, number, number, number]> = {
  underline: [0, 2, 2, 2],
  box: [2, 5, 2, 5],
  circle: [3, 7, 3, 7],
  highlight: [1, 3, 1, 3],
  "strike-through": [0, 2, 0, 2],
  "crossed-off": [1, 3, 1, 3],
};

const defaultStrokeWidthByType: Record<AnnotateType, number> = {
  underline: 2.4,
  box: 2.2,
  circle: 2.2,
  highlight: 0,
  "strike-through": 2.2,
  "crossed-off": 2.2,
};

const normalizeStep = (step: number | undefined) => {
  if (step === undefined) return undefined;
  if (!Number.isFinite(step)) return 1;

  return Math.max(1, Math.floor(step));
};

const joinClassNames = (...names: Array<string | false>) => {
  return names.filter(Boolean).join(" ");
};

export function Annotate({
  children,
  type = "highlight",
  step,
  animate = step !== undefined,
  color,
}: AnnotateProps) {
  const reveal = useReveal();
  const normalizedStep = normalizeStep(step);
  const registerStep = reveal?.registerStep;
  const slideId = reveal?.slideId;

  useLayoutEffect(() => {
    if (!registerStep || normalizedStep === undefined) return;

    return registerStep(normalizedStep);
  }, [normalizedStep, registerStep, slideId]);

  const [padTop, padRight, padBottom, padLeft] = defaultPaddingByType[type];
  const isVisible = normalizedStep === undefined || !reveal || reveal.clicks >= normalizedStep;
  const shouldRenderMark = isVisible;
  const style = {
    "--mark-color": color ?? defaultColorByType[type],
    "--mark-stroke-width": `${defaultStrokeWidthByType[type]}px`,
    "--mark-pad-top": `${padTop}px`,
    "--mark-pad-right": `${padRight}px`,
    "--mark-pad-bottom": `${padBottom}px`,
    "--mark-pad-left": `${padLeft}px`,
    "--mark-animation-duration": `${DEFAULT_ANIMATION_DURATION_MS}ms`,
    "--mark-animation-iterations": "1",
  } as CSSProperties;

  return (
    <span
      className={joinClassNames(
        "slide-mark",
        `slide-mark--${type}`,
        shouldRenderMark && animate && "slide-mark--animate",
      )}
      style={style}
    >
      <span className="slide-mark-target">{children}</span>
      {shouldRenderMark ? <span aria-hidden className="slide-mark-overlay" /> : null}
    </span>
  );
}
