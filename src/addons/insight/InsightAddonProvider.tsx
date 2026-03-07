import { useEffect, type ReactNode } from "react";

export function InsightAddonProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const attributeName = "data-slide-addon-insight";
    const previousValue = root.getAttribute(attributeName);

    root.setAttribute(attributeName, "active");

    return () => {
      if (previousValue === null) root.removeAttribute(attributeName);
      else root.setAttribute(attributeName, previousValue);
    };
  }, []);

  return <>{children}</>;
}
