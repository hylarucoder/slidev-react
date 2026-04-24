import type { ReactNode } from "react";

export function SlidePullQuote({
  children,
  by,
  meta,
}: {
  children: ReactNode;
  by?: string;
  meta?: string;
}) {
  return (
    <figure className="slide-pull-quote">
      <blockquote className="slide-pull-quote-body">{children}</blockquote>
      {by || meta ? (
        <figcaption className="slide-pull-quote-meta">
          {by ? <span className="slide-pull-quote-by">{by}</span> : null}
          {meta ? <span className="slide-pull-quote-extra">{meta}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
