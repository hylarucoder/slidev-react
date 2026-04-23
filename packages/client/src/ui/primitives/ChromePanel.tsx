import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

const toneClassNames = {
  glass: "border chrome-border chrome-surface chrome-fg",
  solid: "border chrome-border chrome-surface-raised chrome-fg",
  inset: "border chrome-border chrome-surface-sunken chrome-fg-muted",
  frame: "border chrome-border chrome-surface-raised",
  dashed: "border chrome-border chrome-surface-sunken chrome-fg-subtle",
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
