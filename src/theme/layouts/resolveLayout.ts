import { CenterLayout } from "./center";
import { CoverLayout } from "./cover";
import { DefaultLayout } from "./default";
import { ImageRightLayout } from "./image-right";
import { SectionLayout } from "./section";
import { StatementLayout } from "./statement";
import { TwoColsLayout } from "./two-cols";
import type { LayoutName } from "../../deck/model/layout";

export function resolveLayout(layout: LayoutName | undefined) {
  switch (layout) {
    case "center":
      return CenterLayout;
    case "cover":
      return CoverLayout;
    case "section":
      return SectionLayout;
    case "two-cols":
      return TwoColsLayout;
    case "image-right":
      return ImageRightLayout;
    case "statement":
      return StatementLayout;
    default:
      return DefaultLayout;
  }
}
