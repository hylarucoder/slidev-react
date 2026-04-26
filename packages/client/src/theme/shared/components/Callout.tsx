import type { ReactNode } from "react";

const toneClassByType = {
  info: "slide-callout--info",
  warn: "slide-callout--warn",
  success: "slide-callout--success",
} as const;

export function SlideCallout({
  type = "info",
  title,
  children,
}: {
  type?: "info" | "warn" | "success";
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className={`slide-callout ${toneClassByType[type]}`}>
      {title ? <strong className="slide-callout-title">{title}</strong> : null}
      <div className="slide-callout-body">{children}</div>
    </aside>
  );
}
