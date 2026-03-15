import type { ReactNode } from "react";

export function PullQuote({
  children,
  by,
  meta,
}: {
  children: ReactNode;
  by?: string;
  meta?: string;
}) {
  return (
    <figure className="absolutely-pull-quote">
      <blockquote className="absolutely-pull-quote-body">{children}</blockquote>
      {by || meta ? (
        <figcaption className="absolutely-pull-quote-meta">
          {by ? <span className="absolutely-pull-quote-by">{by}</span> : null}
          {meta ? <span className="absolutely-pull-quote-extra">{meta}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
