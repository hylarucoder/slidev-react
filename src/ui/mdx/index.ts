import { MermaidDiagram } from "../diagrams/MermaidDiagram";
import { PlantUmlDiagram } from "../diagrams/PlantUmlDiagram";
import { Annotate } from "../primitives/Annotate";
import { Badge } from "../primitives/Badge";
import { Callout } from "../primitives/Callout";
import { CourseCover } from "./CourseCover";
import { MagicMoveDemo } from "./MagicMoveDemo";
import { MinimaxReactVisualizer } from "./MinimaxReactVisualizer";
import { Reveal, RevealGroup } from "../../features/reveal/Reveal";

export const mdxComponents = {
  Badge,
  Callout,
  CourseCover,
  MagicMoveDemo,
  Annotate,
  MermaidDiagram,
  MinimaxReactVisualizer,
  PlantUmlDiagram,
  Reveal,
  RevealGroup,
};
