import type { HighlighterCore } from "shiki";
import { createHighlighter } from "shiki";

const SHIKI_LIGHT_THEME = "vitesse-light";
const SHIKI_DARK_THEME = "vitesse-dark";
const PLAIN_TEXT_LANG = "txt";

const preloadedLangs = [
  "md",
  "markdown",
  "js",
  "jsx",
  "ts",
  "tsx",
  "json",
  "bash",
  "sh",
  "yaml",
  "yml",
  "html",
  "css",
  "vue",
  "txt",
];

let highlighterPromise: Promise<HighlighterCore> | null = null;

interface HastNode {
  type?: string;
  tagName?: string;
  value?: string;
  properties?: {
    className?: unknown;
  };
  children?: HastNode[];
}

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [SHIKI_LIGHT_THEME, SHIKI_DARK_THEME],
      langs: preloadedLangs,
    });
  }

  return highlighterPromise;
}

function asArray(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value))
    return value.map((item) => {
      if (typeof item === "string") return item;

      try {
        return JSON.stringify(item) ?? "";
      } catch {
        return "";
      }
    });

  if (typeof value === "string") return [value];

  try {
    return [JSON.stringify(value) ?? ""];
  } catch {
    return [];
  }
}

function isElement(node: HastNode | undefined, tagName?: string): node is HastNode {
  return node?.type === "element" && (!tagName || node.tagName === tagName);
}

function extractText(node: HastNode | undefined): string {
  if (!node) return "";

  if (node.type === "text") return node.value ?? "";

  if (!node.children) return "";

  return node.children.map((child) => extractText(child)).join("");
}

function detectLanguage(preNode: HastNode): string {
  const codeNode = preNode.children?.find((child) => isElement(child, "code")) ?? null;

  if (!codeNode) return PLAIN_TEXT_LANG;

  const classNames = asArray(codeNode.properties?.className);
  const languageClass = classNames.find((name) => name.startsWith("language-"));

  if (!languageClass) return PLAIN_TEXT_LANG;

  const lang = languageClass.slice("language-".length).trim();
  return lang || PLAIN_TEXT_LANG;
}

async function highlight(code: string, lang: string) {
  const highlighter = await getHighlighter();
  const options = {
    lang,
    themes: {
      light: SHIKI_LIGHT_THEME,
      dark: SHIKI_DARK_THEME,
    },
    defaultColor: "light" as const,
  };

  try {
    return highlighter.codeToHast(code, options) as HastNode;
  } catch {
    return highlighter.codeToHast(code, {
      ...options,
      lang: PLAIN_TEXT_LANG,
    }) as HastNode;
  }
}

async function walk(node: HastNode, parent: HastNode | null, index: number | null) {
  if (isElement(node, "pre") && parent && index !== null) {
    const code = extractText(node);
    const language = detectLanguage(node);
    const rendered = await highlight(code, language);

    const replacement = rendered?.type === "root" ? rendered.children?.[0] : rendered;

    if (replacement && parent.children) parent.children[index] = replacement;

    return;
  }

  if (!node.children) return;

  for (let childIndex = 0; childIndex < node.children.length; childIndex += 1)
    await walk(node.children[childIndex], node, childIndex);
}

export function rehypeShikiVitesse() {
  return async (tree: HastNode) => {
    await walk(tree, null, null);
  };
}
