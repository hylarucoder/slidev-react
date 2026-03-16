import type { ReactNode } from "react";

const toneClassByType = {
  info: "moonlit-callout--info",
  warn: "moonlit-callout--warn",
  success: "moonlit-callout--success",
} as const;

export function MoonlitCallout({
  type = "info",
  title,
  children,
}: {
  type?: "info" | "warn" | "success";
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className={`moonlit-callout ${toneClassByType[type]}`}>
      {title ? <strong className="moonlit-callout-title">{title}</strong> : null}
      <div className="moonlit-callout-body">{children}</div>
    </aside>
  );
}
