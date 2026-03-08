import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

const toneClassNames = {
  glass:
    "border-slate-200/80 bg-white/88 text-slate-900",
  solid:
    "border-slate-200/80 bg-white/92 text-slate-900",
  inset: "border-slate-200/80 bg-slate-50/78 text-slate-600",
  frame: "border-slate-200/80 bg-white",
  dashed: "border-slate-200/80 bg-slate-50/75 text-slate-500",
} as const;

const radiusClassNames = {
  panel: "rounded-md",
  section: "rounded-lg",
  inset: "rounded-md",
  frame: "rounded-md",
} as const;

const paddingClassNames = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
} as const;

export function chromePanelClassName({
  className,
  tone = "glass",
  radius = "panel",
  padding = "md",
}: {
  className?: string;
  tone?: keyof typeof toneClassNames;
  radius?: keyof typeof radiusClassNames;
  padding?: keyof typeof paddingClassNames;
}) {
  return joinClassNames(
    "min-h-0 min-w-0",
    toneClassNames[tone],
    radiusClassNames[radius],
    paddingClassNames[padding],
    className,
  );
}

type ChromePanelProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  tone?: keyof typeof toneClassNames;
  radius?: keyof typeof radiusClassNames;
  padding?: keyof typeof paddingClassNames;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function ChromePanel<T extends ElementType = "section">({
  as,
  children,
  className,
  tone = "glass",
  radius = "panel",
  padding = "md",
  ...props
}: ChromePanelProps<T>) {
  const Component = as ?? "section";

  return (
    <Component
      {...props}
      className={chromePanelClassName({ className, tone, radius, padding })}
    >
      {children}
    </Component>
  );
}
