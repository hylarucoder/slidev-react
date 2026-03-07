import { useLayoutEffect, type CSSProperties, type ReactNode } from "react";
import { useReveal } from "../../features/reveal/RevealContext";

type AnnotateType =
  | "underline"
  | "box"
  | "circle"
  | "highlight"
  | "strike-through"
  | "crossed-off"
  | "bracket";
type BracketSide = "left" | "right" | "top" | "bottom";
type Padding = number | [number, number] | [number, number, number, number];

export type AnnotateProps = {
  children: ReactNode;
  type?: AnnotateType;
  color?: string;
  show?: boolean;
  revealStep?: number;
  animate?: boolean;
  animationDuration?: number;
  strokeWidth?: number;
  padding?: Padding;
  iterations?: number;
  multiline?: boolean;
  rtl?: boolean;
  brackets?: BracketSide | BracketSide[];
  className?: string;
  style?: CSSProperties;
};

const defaultColorByType: Record<AnnotateType, string> = {
  underline: "#2563eb",
  box: "#2563eb",
  circle: "#2563eb",
  highlight: "rgba(250, 204, 21, 0.78)",
  "strike-through": "#ef4444",
  "crossed-off": "#ef4444",
  bracket: "#2563eb",
};

const defaultPaddingByType: Record<AnnotateType, [number, number, number, number]> = {
  underline: [0, 2, 2, 2],
  box: [2, 5, 2, 5],
  circle: [3, 7, 3, 7],
  highlight: [1, 3, 1, 3],
  "strike-through": [0, 2, 0, 2],
  "crossed-off": [1, 3, 1, 3],
  bracket: [3, 7, 3, 7],
};

const defaultStrokeWidthByType: Record<AnnotateType, number> = {
  underline: 2.4,
  box: 2.2,
  circle: 2.2,
  highlight: 0,
  "strike-through": 2.2,
  "crossed-off": 2.2,
  bracket: 2.2,
};

const toSides = (brackets: BracketSide | BracketSide[]) => {
  return Array.isArray(brackets) ? brackets : [brackets];
};

const normalizePadding = (padding: Padding | undefined, type: AnnotateType) => {
  if (typeof padding === "number") {
    return [padding, padding, padding, padding] as const;
  }

  if (Array.isArray(padding)) {
    if (padding.length === 2) {
      return [padding[0], padding[1], padding[0], padding[1]] as const;
    }

    if (padding.length === 4) {
      return padding as [number, number, number, number];
    }
  }

  return defaultPaddingByType[type];
};

const normalizeRevealStep = (step: number | undefined) => {
  if (step === undefined) return undefined;
  if (!Number.isFinite(step)) return 1;

  return Math.max(1, Math.floor(step));
};

const joinClassNames = (...names: Array<string | undefined | false>) => {
  return names.filter(Boolean).join(" ");
};

export function Annotate(props: AnnotateProps) {
  const {
    children,
    type = "highlight",
    color,
    show = true,
    revealStep,
    animate = revealStep !== undefined,
    animationDuration,
    strokeWidth,
    padding,
    iterations = 1,
    brackets = "right",
    className,
    style,
  } = props;
  const reveal = useReveal();
  const normalizedRevealStep = normalizeRevealStep(revealStep);
  const registerStep = reveal?.registerStep;
  const slideId = reveal?.slideId;

  useLayoutEffect(() => {
    if (!registerStep || normalizedRevealStep === undefined) return;

    return registerStep(normalizedRevealStep);
  }, [normalizedRevealStep, registerStep, slideId]);

  if (!show) {
    return <>{children}</>;
  }

  const [padTop, padRight, padBottom, padLeft] = normalizePadding(padding, type);
  const sides = toSides(brackets);
  const isVisible =
    normalizedRevealStep === undefined || !reveal || reveal.clicks >= normalizedRevealStep;
  const shouldRenderMark = show && isVisible;
  const mergedStyle = {
    ...style,
    "--mark-color": color ?? defaultColorByType[type],
    "--mark-stroke-width": `${strokeWidth ?? defaultStrokeWidthByType[type]}px`,
    "--mark-pad-top": `${padTop}px`,
    "--mark-pad-right": `${padRight}px`,
    "--mark-pad-bottom": `${padBottom}px`,
    "--mark-pad-left": `${padLeft}px`,
    "--mark-animation-duration": `${animationDuration ?? 520}ms`,
    "--mark-animation-iterations": `${Math.max(1, Math.floor(iterations))}`,
  } as CSSProperties;

  return (
    <span
      className={joinClassNames(
        "slide-mark",
        `slide-mark--${type}`,
        shouldRenderMark && animate && "slide-mark--animate",
        className,
      )}
      style={mergedStyle}
    >
      <span className="slide-mark-target">{children}</span>
      {!shouldRenderMark ? null : type === "bracket" ? (
        sides.map((side) => (
          <span
            key={side}
            aria-hidden
            className={`slide-mark-bracket slide-mark-bracket--${side}`}
          />
        ))
      ) : (
        <span aria-hidden className="slide-mark-overlay" />
      )}
    </span>
  );
}
