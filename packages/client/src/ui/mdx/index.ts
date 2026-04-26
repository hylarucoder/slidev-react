import { Annotate } from "../primitives/Annotate";
import { Badge } from "../primitives/Badge";
import { Callout } from "../primitives/Callout";
import { CodeMagicMove } from "./CodeMagicMove";
import { MinimaxReactVisualizer } from "./MinimaxReactVisualizer";
import { Step, Steps } from "../../features/presentation/reveal/Reveal";
import { CourseCover } from "../../../../../components/CourseCover";
import { SlideEyebrow } from "../../theme/shared/components/Eyebrow";
import { SlideKeyStat } from "../../theme/shared/components/KeyStat";
import { SlidePullQuote } from "../../theme/shared/components/PullQuote";

export const mdxComponents = {
  Badge,
  Callout,
  CodeMagicMove,
  Annotate,
  Step,
  Steps,
  CourseCover,
  MinimaxReactVisualizer,
  Eyebrow: SlideEyebrow,
  KeyStat: SlideKeyStat,
  PullQuote: SlidePullQuote,
};
