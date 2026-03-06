import { useMemo, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useDraw, type DrawPoint, type DrawStroke } from "./DrawProvider";

const SLIDE_WIDTH = 1920;
const SLIDE_HEIGHT = 1080;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function polylinePoints(points: DrawPoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function rectFromPoints(start: DrawPoint, end: DrawPoint) {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

function drawHintByTool(tool: ReturnType<typeof useDraw>["tool"]) {
  if (tool === "eraser") return "Eraser ON";
  if (tool === "circle") return "Circle ON";
  if (tool === "rectangle") return "Rectangle ON";

  return "Pen ON";
}

function ShapeStroke({ stroke }: { stroke: DrawStroke }) {
  const kind = stroke.kind ?? "pen";

  if (kind === "circle") {
    const center = stroke.points[0];
    const edge = stroke.points[stroke.points.length - 1] ?? center;
    const radius = Math.hypot(edge.x - center.x, edge.y - center.y);

    return (
      <circle
        cx={center.x}
        cy={center.y}
        r={radius}
        fill="none"
        stroke={stroke.color}
        strokeWidth={stroke.width}
      />
    );
  }

  if (kind === "rectangle") {
    const start = stroke.points[0];
    const end = stroke.points[stroke.points.length - 1] ?? start;
    const rect = rectFromPoints(start, end);

    return (
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        fill="none"
        stroke={stroke.color}
        strokeWidth={stroke.width}
      />
    );
  }

  if (stroke.points.length === 1) {
    return (
      <circle
        cx={stroke.points[0].x}
        cy={stroke.points[0].y}
        r={stroke.width / 2}
        fill={stroke.color}
      />
    );
  }

  return (
    <polyline
      points={polylinePoints(stroke.points)}
      fill="none"
      stroke={stroke.color}
      strokeWidth={stroke.width}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

export function DrawOverlay({ slideId, scale }: { slideId: string; scale: number }) {
  const draw = useDraw();
  const activeStrokeIdRef = useRef<string | null>(null);
  const strokes = draw.strokesBySlideId[slideId] ?? [];

  const className = draw.enabled
    ? `absolute inset-0 z-20 touch-none ${draw.tool === "eraser" ? "cursor-cell" : "cursor-crosshair"}`
    : "pointer-events-none absolute inset-0 z-20";

  const stageHint = useMemo(() => {
    if (!draw.enabled) return null;

    return (
      <div className="pointer-events-none absolute right-5 top-5 rounded-md bg-slate-900/80 px-2 py-1 text-xs font-medium tracking-wide text-slate-100">
        {drawHintByTool(draw.tool)}
      </div>
    );
  }, [draw.enabled, draw.tool]);

  const toPoint = (event: ReactPointerEvent<SVGSVGElement>): DrawPoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / scale, 0, SLIDE_WIDTH),
      y: clamp((event.clientY - rect.top) / scale, 0, SLIDE_HEIGHT),
    };
  };

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!draw.enabled || event.button !== 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activeStrokeIdRef.current = draw.startStroke(slideId, toPoint(event));
  };

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const activeStrokeId = activeStrokeIdRef.current;
    if (!draw.enabled || !activeStrokeId) return;

    event.preventDefault();
    draw.appendStrokePoint(slideId, activeStrokeId, toPoint(event));
  };

  const onPointerEnd = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!activeStrokeIdRef.current) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);

    activeStrokeIdRef.current = null;
  };

  return (
    <div className={className}>
      <svg
        width={SLIDE_WIDTH}
        height={SLIDE_HEIGHT}
        viewBox={`0 0 ${SLIDE_WIDTH} ${SLIDE_HEIGHT}`}
        className="size-full"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        {strokes.map((stroke) => (
          <ShapeStroke key={stroke.id} stroke={stroke} />
        ))}
      </svg>
      {stageHint}
    </div>
  );
}
