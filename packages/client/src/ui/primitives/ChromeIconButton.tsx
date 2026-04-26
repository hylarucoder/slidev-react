import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ChromeTooltip, type ChromeTooltipSide } from "./ChromeTooltip";

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

const toneClassNames = {
  default:
    "chrome-border chrome-surface chrome-fg hover:chrome-surface-raised disabled:cursor-not-allowed disabled:opacity-45",
  active: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
  danger:
    "border-rose-300/80 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45",
  violet:
    "border-violet-300/80 bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-45",
  success:
    "border-emerald-300/80 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-45",
  info: "border-green-300/80 bg-green-50 text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-45",
} as const;

const sizeClassNames = {
  sm: "size-8",
  md: "size-9",
} as const;

const radiusClassNames = {
  soft: "rounded-md",
  chrome: "rounded-md",
} as const;

export type ChromeIconButtonTooltip =
  | ReactNode
  | { label: ReactNode; shortcut?: ReactNode };

export function ChromeIconButton({
  children,
  className,
  tone = "default",
  size = "md",
  radius = "chrome",
  tooltip,
  tooltipSide,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: keyof typeof toneClassNames;
  size?: keyof typeof sizeClassNames;
  radius?: keyof typeof radiusClassNames;
  tooltip?: ChromeIconButtonTooltip;
  tooltipSide?: ChromeTooltipSide;
}) {
  const button = (
    <button
      {...props}
      type={props.type ?? "button"}
      className={joinClassNames(
        "inline-flex shrink-0 items-center justify-center border transition",
        toneClassNames[tone],
        sizeClassNames[size],
        radiusClassNames[radius],
        className,
      )}
    >
      {children}
    </button>
  );

  if (tooltip === undefined || tooltip === null || tooltip === false) return button;

  const isTooltipObject =
    typeof tooltip === "object" &&
    tooltip !== null &&
    !Array.isArray(tooltip) &&
    "label" in (tooltip as Record<string, unknown>);

  const tooltipContent = isTooltipObject
    ? (tooltip as { label: ReactNode; shortcut?: ReactNode })
    : { label: tooltip as ReactNode };

  return (
    <ChromeTooltip
      label={tooltipContent.label}
      shortcut={tooltipContent.shortcut}
      side={tooltipSide}
    >
      {button}
    </ChromeTooltip>
  );
}
