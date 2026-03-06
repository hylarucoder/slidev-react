import type { ReactNode } from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { compileMdx } from "./compileMdx";

describe("compileMdx", () => {
  it("compiles markdown with math blocks", async () => {
    const source = `# $\\LaTeX$\n\nInline: $\\sqrt{3x-1}+(1+x)^2$\n\n$$\n\\begin{aligned}\n\\nabla \\cdot \\vec{E} &= \\frac{\\rho}{\\varepsilon_0} \\\\n\\nabla \\cdot \\vec{B} &= 0\n\\end{aligned}\n$$`;

    const component = await compileMdx(source);
    expect(component).toBeTypeOf("function");
  });

  it("compiles mermaid code fences into MDX components", async () => {
    const source = `# Mermaid\n\n\`\`\`mermaid\ngraph TD\nA-->B\n\`\`\``;

    const component = await compileMdx(source);
    expect(component).toBeTypeOf("function");

    let capturedCode = "";
    renderToStaticMarkup(
      createElement(component, {
        components: {
          MermaidDiagram: ({ children }: { children?: ReactNode }) => {
            capturedCode =
              typeof children === "string"
                ? children
                : Array.isArray(children)
                  ? children.join("")
                  : "";
            return null;
          },
        },
      }),
    );

    expect(capturedCode).toBe("graph TD\nA-->B");
  });

  it("compiles startuml code fences into MDX components", async () => {
    const source = `# PlantUML\n\n\`\`\`startuml\n@startuml\nAlice -> Bob: hi\n@enduml\n\`\`\``;

    const component = await compileMdx(source);
    expect(component).toBeTypeOf("function");

    let capturedCode = "";
    renderToStaticMarkup(
      createElement(component, {
        components: {
          PlantUmlDiagram: ({ children }: { children?: ReactNode }) => {
            capturedCode =
              typeof children === "string"
                ? children
                : Array.isArray(children)
                  ? children.join("")
                  : "";
            return null;
          },
        },
      }),
    );

    expect(capturedCode).toBe("@startuml\nAlice -> Bob: hi\n@enduml");
  });
});
