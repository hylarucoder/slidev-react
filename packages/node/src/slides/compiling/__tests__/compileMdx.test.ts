import type { ReactNode } from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { compileMdx } from "../compileMdx.ts";

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

  it("keeps startuml code fences as regular code blocks", async () => {
    const source = `# Unsupported Diagram\n\n\`\`\`startuml\n@startuml\nAlice -> Bob: hi\n@enduml\n\`\`\``;

    const component = await compileMdx(source);
    expect(component).toBeTypeOf("function");

    const html = renderToStaticMarkup(createElement(component));

    expect(html).toContain("startuml");
    expect(html).toContain("Alice -&gt; Bob: hi");
    expect(html).not.toContain("PlantUmlDiagram");
  });

  it("emits dual-theme Shiki variables for fenced code blocks", async () => {
    const source = `\`\`\`ts\nconst theme = 'moonlit'\n\`\`\``;

    const component = await compileMdx(source);
    const html = renderToStaticMarkup(createElement(component));

    expect(html).toContain("shiki-themes");
    expect(html).toContain("--shiki-dark:");
  });
});
