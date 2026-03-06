import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { remarkDiagramComponents } from "../mdx/remarkDiagramComponents";
import { rehypeShikiVitesse } from "./rehypeShikiVitesse";

export function getMdxCompileOptions() {
  return {
    remarkPlugins: [remarkGfm, remarkMath, remarkDiagramComponents],
    rehypePlugins: [rehypeKatex, rehypeShikiVitesse],
  };
}
