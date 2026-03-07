import type { LayoutName } from "../../deck/model/layout";
import { defaultLayouts } from "./defaultLayouts";
import type { LayoutRegistry } from "./types";

export function resolveLayout(layout: LayoutName | undefined, layouts?: LayoutRegistry) {
  const registry = layouts ?? defaultLayouts;

  return registry[layout ?? "default"] ?? registry.default ?? defaultLayouts.default!;
}
