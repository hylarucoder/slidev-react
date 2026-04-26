import { useEffect, useMemo, useState } from "react";
import type { HighlighterCore } from "shiki";
import { createHighlighter } from "shiki";
import { ShikiMagicMove } from "shiki-magic-move/react";
import { useSlideTheme } from "../../theme/ThemeProvider";

const SHIKI_LIGHT_THEME = "vitesse-light";
const SHIKI_DARK_THEME = "vitesse-dark";

const DEFAULT_STEPS = [
  `const message = 'Hello'
const target = 'world'

console.log(message, target)`,
  `const message = 'Hi'
const target = user.name

console.log(\`${"${message}"}, ${"${target}"}!\`)`,
  `function greet(target: string) {
  const message = 'Hi'

  return \`${"${message}"}, ${"${target}"}!\`
}`,
];

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [SHIKI_LIGHT_THEME, SHIKI_DARK_THEME],
      langs: ["javascript", "typescript"],
    });
  }

  return highlighterPromise;
}

export function resolveMagicMoveTheme(colorScheme?: string) {
  return colorScheme === "dark" ? SHIKI_DARK_THEME : SHIKI_LIGHT_THEME;
}

export function CodeMagicMove({ steps }: { steps?: string[] }) {
  const resolvedSteps = steps && steps.length > 0 ? steps : DEFAULT_STEPS;
  const theme = useSlideTheme();
  const shikiTheme = resolveMagicMoveTheme(theme.definition.colorScheme);
  const [stepIndex, setStepIndex] = useState(0);
  const [highlighter, setHighlighter] = useState<HighlighterCore>();

  useEffect(() => {
    let cancelled = false;

    const initializeHighlighter = async () => {
      const instance = await getHighlighter();
      if (!cancelled) setHighlighter(instance);
    };

    void initializeHighlighter();

    return () => {
      cancelled = true;
    };
  }, []);

  const code = useMemo(() => resolvedSteps[stepIndex], [resolvedSteps, stepIndex]);

  if (!highlighter) {
    return <div className="magic-move-demo-loading">Preparing highlighter...</div>;
  }

  return (
    <div className="magic-move-demo grid gap-4">
      <div className="magic-move-demo-shell">
        <ShikiMagicMove
          lang="ts"
          theme={shikiTheme}
          highlighter={highlighter}
          code={code}
          className="magic-move-demo-pre"
          options={{
            duration: 750,
            stagger: 3,
            delayMove: 0,
            delayEnter: 0,
            delayLeave: 0,
            lineNumbers: false,
            splitTokens: false,
            enhanceMatching: true,
            animateContainer: true,
          }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600"
          onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}
          disabled={stepIndex === 0}
        >
          ← Prev
        </button>
        <button
          type="button"
          className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600"
          onClick={() => setStepIndex((index) => Math.min(index + 1, resolvedSteps.length - 1))}
          disabled={stepIndex >= resolvedSteps.length - 1}
        >
          Next →
        </button>
        <span className="text-xs text-slate-400">
          {stepIndex + 1} / {resolvedSteps.length}
        </span>
        <button
          type="button"
          className="ml-auto rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 active:bg-slate-100"
          onClick={() => setStepIndex(0)}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
