import type { HighlighterCore } from "shiki";
import { createHighlighter } from "shiki";

const SHIKI_THEME = "vitesse-light";
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

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [SHIKI_THEME],
      langs: preloadedLangs,
    });
  }

  return highlighterPromise;
}

function asArray(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) return value.map((item) => String(item));

  return [String(value)];
}

function isElement(node: any, tagName?: string): boolean {
  return node?.type === "element" && (!tagName || node.tagName === tagName);
}

function extractText(node: any): string {
  if (!node) return "";

  if (node.type === "text") return node.value ?? "";

  if (!Array.isArray(node.children)) return "";

  return node.children.map((child: any) => extractText(child)).join("");
}

function detectLanguage(preNode: any): string {
  const codeNode = Array.isArray(preNode.children)
    ? preNode.children.find((child: any) => isElement(child, "code"))
    : null;

  if (!codeNode) return PLAIN_TEXT_LANG;

  const classNames = asArray(codeNode.properties?.className);
  const languageClass = classNames.find((name) => name.startsWith("language-"));

  if (!languageClass) return PLAIN_TEXT_LANG;

  const lang = languageClass.slice("language-".length).trim();
  return lang || PLAIN_TEXT_LANG;
}

async function highlight(code: string, lang: string) {
  const highlighter = await getHighlighter();

  try {
    return highlighter.codeToHast(code, {
      lang,
      theme: SHIKI_THEME,
    }) as any;
  } catch {
    return highlighter.codeToHast(code, {
      lang: PLAIN_TEXT_LANG,
      theme: SHIKI_THEME,
    }) as any;
  }
}

async function walk(node: any, parent: any | null, index: number | null) {
  if (isElement(node, "pre") && parent && index !== null) {
    const code = extractText(node);
    const language = detectLanguage(node);
    const rendered = await highlight(code, language);

    const replacement = rendered?.type === "root" ? rendered.children?.[0] : rendered;

    if (replacement) parent.children[index] = replacement;

    return;
  }

  if (!Array.isArray(node?.children)) return;

  for (let childIndex = 0; childIndex < node.children.length; childIndex += 1)
    await walk(node.children[childIndex], node, childIndex);
}

export function rehypeShikiVitesse() {
  return async (tree: any) => {
    await walk(tree, null, null);
  };
}
