---
"@slidev-react/client": minor
"@slidev-react/core": minor
"@slidev-react/node": minor
"@slidev-react/cli": minor
---

Replace the slide themes with Kami, and make it the default

Kami (https://github.com/tw93/Kami) is now the single design language for decks: a
warm parchment canvas, one ink-blue accent, serif carrying every level of hierarchy,
warm grays only, and no gradients or hard shadows. A deck with no `theme:` in its
frontmatter renders as Kami.

- new built-in `kami` theme (`@slidev-react/client/themes/kami`) with cover, section,
  statement, and chapter layouts
- `paper` and `absolutely` are removed; `moonlit` stays as the dark alternative
- shared token derivations no longer emit gradient list bullets, glow shadows, tinted
  number pills, or a filled blockquote — they landed as inline styles on `<html>`, so
  no theme stylesheet could outrank them
- `layouts.css` no longer hardcodes cool slate text colors or a 760 display weight;
  both are token-driven (`--slide-color-muted`, `--slide-display-weight`)
- fixed the export readiness probe, which sent `Accept: */*` and so always 404'd
  against the dev server's navigation-only SPA fallback, timing out every export
- `ResolvedThemeExtension.source` now admits `'builtin'`, which it always returned
