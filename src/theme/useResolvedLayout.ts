import { useMemo } from "react";
import { useSlideAddons } from "../addons/AddonProvider";
import type { LayoutName } from "../deck/model/layout";
import { resolveLayout } from "./layouts/resolveLayout";
import { useSlideTheme } from "./ThemeProvider";

export function useResolvedLayouts() {
  const theme = useSlideTheme();
  const addons = useSlideAddons();

  return useMemo(
    () => ({
      ...theme.layouts,
      ...addons.layouts,
    }),
    [addons.layouts, theme.layouts],
  );
}

export function useResolvedLayout(layout: LayoutName | undefined) {
  const layouts = useResolvedLayouts();

  return resolveLayout(layout, layouts);
}
