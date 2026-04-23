import "katex/dist/katex.min.css";
import "shiki-magic-move/dist/style.css";

export { default } from "./app/App";
export { default as App } from "./app/App";
export { SlidesNavigationProvider, useSlidesState } from "./app/providers/SlidesNavigationProvider";
export { AddonProvider, useSlideAddons } from "./addons/AddonProvider";
export { ThemeProvider, useSlideTheme, useSlideThemeTokens } from "./theme/ThemeProvider";
export { PrintSlidesView } from "./features/presentation/modes/PrintMode";
export { PresentationRoot } from "./features/presentation/PresentationRoot";
