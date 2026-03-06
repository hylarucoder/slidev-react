import { createContext, useContext, type ReactNode } from "react";

export interface RevealContextValue {
  slideId: string;
  clicks: number;
  clicksTotal: number;
  setClicks: (next: number) => void;
  registerStep: (step: number) => () => void;
  advance: () => void;
  retreat: () => void;
  canAdvance: boolean;
  canRetreat: boolean;
}

const RevealContext = createContext<RevealContextValue | null>(null);

export function RevealProvider({
  value,
  children,
}: {
  value: RevealContextValue;
  children: ReactNode;
}) {
  return <RevealContext.Provider value={value}>{children}</RevealContext.Provider>;
}

export function useReveal() {
  return useContext(RevealContext);
}
