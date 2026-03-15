import { createContext, useContext, useMemo, type ReactNode } from "react";
import { resolveSlideAddons } from "./registry";
import type { ResolvedSlideAddons } from "./types";

const AddonContext = createContext<ResolvedSlideAddons | null>(null);

export function AddonProvider({
  children,
}: {
  children: ReactNode;
}) {
  const addons = useMemo(() => resolveSlideAddons(), []);

  return <AddonContext.Provider value={addons}>{children}</AddonContext.Provider>;
}

export function useSlideAddons() {
  const context = useContext(AddonContext);
  if (!context) throw new Error("useSlideAddons must be used inside AddonProvider");

  return context;
}
