import type { ReactNode } from "react";

export function MoonlitPullQuote({
  children,
  by,
  meta,
}: {
  children: ReactNode;
  by?: string;
  meta?: string;
}) {
  return (
    <figure className="moonlit-pull-quote">
      <blockquote className="moonlit-pull-quote-body">{children}</blockquote>
      {by || meta ? (
        <figcaption className="moonlit-pull-quote-meta">
          {by ? <span className="moonlit-pull-quote-by">{by}</span> : null}
          {meta ? <span className="moonlit-pull-quote-extra">{meta}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
