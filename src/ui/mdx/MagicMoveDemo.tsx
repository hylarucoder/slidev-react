import type { HighlighterCore } from "shiki";
import { useEffect, useMemo, useState } from "react";
import { createHighlighter } from "shiki";
import { ShikiMagicMove } from "shiki-magic-move/react";

const STEPS = [
  `const hello = 'world'`,
  `let hi = 'hello'`,
  `function greet(name: string) {\n  return \`Hi, ${"${name}"}!\`\n}`,
];

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["vitesse-light"],
      langs: ["javascript", "typescript"],
    });
  }

  return highlighterPromise;
}

export function MagicMoveDemo() {
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

  const code = useMemo(() => STEPS[stepIndex], [stepIndex]);

  if (!highlighter) {
    return (
      <div className="rounded-xl border border-slate-300/70 bg-white/70 p-3 text-sm text-slate-700">
        Preparing highlighter...
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <ShikiMagicMove
        lang="ts"
        theme="vitesse-light"
        highlighter={highlighter}
        code={code}
        options={{ duration: 800, stagger: 0.3, lineNumbers: true }}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-45"
          onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}
          disabled={stepIndex === 0}
        >
          Prev Step
        </button>
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-45"
          onClick={() => setStepIndex((index) => Math.min(index + 1, STEPS.length - 1))}
          disabled={stepIndex >= STEPS.length - 1}
        >
          Next Step
        </button>
        <button
          type="button"
          className="rounded-lg bg-slate-600 px-3 py-1.5 text-sm text-white"
          onClick={() => setStepIndex(0)}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
