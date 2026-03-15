import type { ReactNode } from "react";

const toneClassByType = {
  info: "absolutely-callout--info",
  warn: "absolutely-callout--warn",
  success: "absolutely-callout--success",
} as const;

export function AbsolutelyCallout({
  type = "info",
  title,
  children,
}: {
  type?: "info" | "warn" | "success";
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className={`absolutely-callout ${toneClassByType[type]}`}>
      {title ? <strong className="absolutely-callout-title">{title}</strong> : null}
      <div className="absolutely-callout-body">{children}</div>
    </aside>
  );
}
