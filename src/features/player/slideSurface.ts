import type { CSSProperties } from "react";
import type { SlideMeta } from "../../deck/model/slide";

function joinClassNames(...names: Array<string | undefined>) {
  return names.filter(Boolean).join(" ");
}

function looksLikeBareImageSource(value: string) {
  return (
    /^(?:https?:\/\/|data:image\/|\/|\.\.?\/)/.test(value) ||
    /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(value)
  );
}

function resolveBackgroundStyle(background: string | undefined): CSSProperties {
  const style: CSSProperties = {
    backgroundColor: "#ffffff",
  };

  if (!background) return style;

  const trimmed = background.trim();
  if (!trimmed) return style;

  if (looksLikeBareImageSource(trimmed)) {
    style.backgroundImage = `url(${JSON.stringify(trimmed)})`;
    style.backgroundPosition = "center";
    style.backgroundRepeat = "no-repeat";
    style.backgroundSize = "cover";
    return style;
  }

  style.background = trimmed;
  return style;
}

export function resolveSlideSurface({
  meta,
  deckBackground,
  className,
}: {
  meta: SlideMeta;
  deckBackground?: string;
  className?: string;
}) {
  return {
    className: joinClassNames(className, meta.class),
    style: resolveBackgroundStyle(meta.background ?? deckBackground),
  };
}
