import { describe, expect, it } from "vite-plus/test";
import { remarkDiagramComponents } from "../remarkDiagramComponents";

function makeCodeNode(lang: string, value: string) {
  return { type: "code", lang, value };
}

function makeTree(...children: any[]) {
  return { type: "root", children };
}

describe("remarkDiagramComponents", () => {
  const transform = remarkDiagramComponents();

  it("rewrites mermaid code fences to MermaidDiagram JSX elements", () => {
    const tree = makeTree(makeCodeNode("mermaid", "graph LR\n  A --> B"));
    transform(tree);

    expect(tree.children[0]).toEqual({
      type: "mdxJsxFlowElement",
      name: "MermaidDiagram",
      attributes: [],
      children: [{ type: "text", value: "graph LR\n  A --> B" }],
    });
  });

  it("leaves plantuml code fences untouched", () => {
    const codeNode = makeCodeNode("plantuml", "@startuml\nAlice -> Bob\n@enduml");
    const tree = makeTree(codeNode);
    transform(tree);

    expect(tree.children[0]).toBe(codeNode);
  });

  it("leaves startuml code fences untouched", () => {
    const codeNode = makeCodeNode("startuml", "Bob -> Alice");
    const tree = makeTree(codeNode);
    transform(tree);

    expect(tree.children[0]).toBe(codeNode);
  });

  it("leaves non-diagram code fences untouched", () => {
    const codeNode = makeCodeNode("typescript", "const x = 1");
    const tree = makeTree(codeNode);
    transform(tree);

    expect(tree.children[0]).toBe(codeNode);
  });

  it("handles case-insensitive language detection", () => {
    const tree = makeTree(makeCodeNode("MERMAID", "graph TD"));
    transform(tree);

    expect(tree.children[0].name).toBe("MermaidDiagram");
  });

  it("walks nested children", () => {
    const tree = makeTree({
      type: "section",
      children: [makeCodeNode("mermaid", "sequenceDiagram")],
    });
    transform(tree);

    expect(tree.children[0].children[0].name).toBe("MermaidDiagram");
  });

  it("handles empty code value gracefully", () => {
    const tree = makeTree(makeCodeNode("mermaid", ""));
    transform(tree);

    expect(tree.children[0].children[0].value).toBe("");
  });
});
