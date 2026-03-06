import YAML from "yaml";

export interface FrontmatterResult {
  data: Record<string, unknown>;
  content: string;
}

const OPEN = "---";

export function parseFrontmatter(source: string): FrontmatterResult {
  const normalized = source.replace(/\r\n/g, "\n");

  if (!normalized.startsWith(`${OPEN}\n`)) {
    return {
      data: {},
      content: normalized,
    };
  }

  const closeMarkerWithNewline = `\n${OPEN}\n`;
  const closeMarkerAtEnd = `\n${OPEN}`;
  const withNewlineIndex = normalized.indexOf(closeMarkerWithNewline, OPEN.length + 1);
  const atEndIndex =
    withNewlineIndex < 0 && normalized.endsWith(closeMarkerAtEnd)
      ? normalized.length - closeMarkerAtEnd.length
      : -1;
  const endIndex = withNewlineIndex >= 0 ? withNewlineIndex : atEndIndex;

  if (endIndex < 0) {
    throw new Error("Invalid frontmatter: missing closing ---");
  }

  const yamlSource = normalized.slice(OPEN.length + 1, endIndex);
  const raw = YAML.parse(yamlSource);

  if (raw != null && typeof raw !== "object") {
    throw new Error("Invalid frontmatter: expected an object");
  }

  const contentStart =
    endIndex + (withNewlineIndex >= 0 ? closeMarkerWithNewline.length : closeMarkerAtEnd.length);

  return {
    data: (raw ?? {}) as Record<string, unknown>,
    content: normalized.slice(contentStart),
  };
}
