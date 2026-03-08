import type { ElementType, ReactNode } from "react";

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

const toneClassNames = {
  default: "border-slate-200/80 bg-white/88 text-slate-500",
  defaultStrong: "border-slate-200/80 bg-white/88 text-slate-800",
  muted: "border-slate-200/80 bg-white/82 text-slate-600",
  active: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
  success: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200/80 bg-amber-50 text-amber-700",
  danger: "border-rose-300/80 bg-rose-50 text-rose-700",
} as const;

const sizeClassNames = {
  xs: "px-2 py-0.5 text-[10px]",
  sm: "px-2.5 py-1 text-[11px]",
  md: "px-3 py-1.5 text-xs",
} as const;

const weightClassNames = {
  medium: "font-medium",
  semibold: "font-semibold",
} as const;

export function chromeTagClassName({
  className,
  tone = "default",
  size = "sm",
  weight = "medium",
}: {
  className?: string;
  tone?: keyof typeof toneClassNames;
  size?: keyof typeof sizeClassNames;
  weight?: keyof typeof weightClassNames;
}) {
  return joinClassNames(
    "inline-flex items-center gap-2 rounded-md border",
    toneClassNames[tone],
    sizeClassNames[size],
    weightClassNames[weight],
    className,
  );
}

export function ChromeTag({
  as,
  children,
  className,
  tone = "default",
  size = "sm",
  weight = "medium",
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  tone?: keyof typeof toneClassNames;
  size?: keyof typeof sizeClassNames;
  weight?: keyof typeof weightClassNames;
}) {
  const Component = as ?? "span";

  return (
    <Component className={chromeTagClassName({ className, tone, size, weight })}>
      {children}
    </Component>
  );
}
