import { createContext, useContext, useMemo, type ReactNode } from "react";
import { resolveSlideAddons } from "./registry";
import type { ResolvedSlideAddons } from "./types";

const AddonContext = createContext<ResolvedSlideAddons | null>(null);

export function AddonProvider({
  addonIds,
  children,
}: {
  addonIds?: string[];
  children: ReactNode;
}) {
  const addonKey = useMemo(() => (addonIds ?? []).join("\0"), [addonIds]);
  const addons = useMemo(() => resolveSlideAddons(addonIds), [addonIds, addonKey]);

  return <AddonContext.Provider value={addons}>{children}</AddonContext.Provider>;
}

export function useSlideAddons() {
  const context = useContext(AddonContext);
  if (!context) throw new Error("useSlideAddons must be used inside AddonProvider");

  return context;
}
