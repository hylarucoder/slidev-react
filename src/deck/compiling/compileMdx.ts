import type { SlideComponent } from "../model/slide";
import { evaluate } from "@mdx-js/mdx";
import { useMDXComponents } from "@mdx-js/react";
import * as jsxRuntime from "react/jsx-runtime";
import { getMdxCompileOptions } from "./mdx-options";

export async function compileMdx(source: string): Promise<SlideComponent> {
  const evaluated = await evaluate(source, {
    ...jsxRuntime,
    useMDXComponents,
    development: false,
    ...getMdxCompileOptions(),
  });

  return evaluated.default as SlideComponent;
}
