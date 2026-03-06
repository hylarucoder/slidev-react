function createDiagramNode(name: string, code: string) {
  return {
    type: "mdxJsxFlowElement",
    name,
    attributes: [],
    children: [
      {
        type: "text",
        value: code,
      },
    ],
  };
}

function walk(parent: any) {
  const children = parent?.children;
  if (!Array.isArray(children)) return;

  for (let index = 0; index < children.length; index += 1) {
    const node = children[index];

    if (node?.type === "code") {
      const lang = String(node.lang || "")
        .trim()
        .toLowerCase();

      if (lang === "mermaid") {
        children[index] = createDiagramNode("MermaidDiagram", node.value || "");
        continue;
      }

      if (lang === "plantuml" || lang === "startuml") {
        children[index] = createDiagramNode("PlantUmlDiagram", node.value || "");
        continue;
      }
    }

    walk(node);
  }
}

export function remarkDiagramComponents() {
  return (tree: any) => {
    walk(tree);
  };
}
