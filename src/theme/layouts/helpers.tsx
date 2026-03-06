import { Children, isValidElement, type ReactNode } from "react";

export function splitByFirstHr(children: ReactNode): [ReactNode, ReactNode | null] {
  const nodes = Children.toArray(children);
  const index = nodes.findIndex((node) => isValidElement(node) && node.type === "hr");

  if (index < 0) return [children, null];

  const left = nodes.slice(0, index);
  const right = nodes.slice(index + 1);
  return [left, right.length > 0 ? right : null];
}
