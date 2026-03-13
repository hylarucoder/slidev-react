import type { SlideAddonDefinition } from "../types";
import { MermaidDiagram } from "./MermaidDiagram";

export const addon: SlideAddonDefinition = {
  id: "mermaid",
  label: "Mermaid Diagrams",
  mdxComponents: {
    MermaidDiagram,
  },
};
