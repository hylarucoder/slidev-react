import { CenterLayout } from "./center";
import { CoverLayout } from "./cover";
import { DefaultLayout } from "./default";
import { ImageRightLayout } from "./image-right";
import { SectionLayout } from "./section";
import { StatementLayout } from "./statement";
import { TwoColsLayout } from "./two-cols";
import type { LayoutRegistry } from "./types";

export const defaultLayouts: LayoutRegistry = {
  default: DefaultLayout,
  center: CenterLayout,
  cover: CoverLayout,
  section: SectionLayout,
  "two-cols": TwoColsLayout,
  "image-right": ImageRightLayout,
  statement: StatementLayout,
};
