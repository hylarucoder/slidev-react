import type { DeckMeta, DeckModel } from "../model/deck";
import type { SlideMeta, SlideUnit } from "../model/slide";
import { z } from "zod";
import { layoutNames } from "../model/layout";
import { parseFrontmatter } from "./frontmatter";

const layoutSchema = z.enum(layoutNames);

const deckMetaSchema = z.object({
  title: z.string().optional(),
  theme: z.string().optional(),
  layout: layoutSchema.optional(),
});

const slideMetaSchema = z.object({
  title: z.string().optional(),
  layout: layoutSchema.optional(),
  class: z.string().optional(),
});

const codeFenceStartRE = /^(`{3,}|~{3,})/;
const yamlFieldRE = /^(?:[A-Z_][\w-]*|["'][^"']+["'])\s*:/i;

function isLikelyYamlMeta(lines: string[]): boolean {
  let hasField = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (yamlFieldRE.test(trimmed)) {
      hasField = true;
      continue;
    }

    return false;
  }

  return hasField;
}

function findFrontmatterCloseLine(lines: string[], start: number): number {
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index].trim() === "---") return index;
  }

  return -1;
}

function splitSlides(content: string): string[] {
  const lines = content.split("\n");
  const slides: string[] = [];
  let current: string[] = [];
  let atSlideStart = true;
  let inCodeFence = false;
  let codeFenceToken: string | null = null;
  let inSlideFrontmatter = false;

  const flush = () => {
    const source = current.join("\n").trim();
    if (source) slides.push(source);
    current = [];
    atSlideStart = true;
    inCodeFence = false;
    codeFenceToken = null;
    inSlideFrontmatter = false;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (inSlideFrontmatter) {
      current.push(line);
      if (trimmed === "---") inSlideFrontmatter = false;
      continue;
    }

    if (!inCodeFence) {
      const match = trimmed.match(codeFenceStartRE);
      if (match) {
        inCodeFence = true;
        codeFenceToken = match[1];
      }
    } else if (codeFenceToken && trimmed.startsWith(codeFenceToken)) {
      inCodeFence = false;
      codeFenceToken = null;
    }

    if (!inCodeFence) {
      if (atSlideStart && trimmed === "---") {
        inSlideFrontmatter = true;
        current.push(line);
        continue;
      }

      if (trimmed === "---") {
        flush();

        const closeLine = findFrontmatterCloseLine(lines, index);
        if (closeLine > index + 1 && isLikelyYamlMeta(lines.slice(index + 1, closeLine))) {
          inSlideFrontmatter = true;
          current.push(line);
        }

        continue;
      }
    }

    current.push(line);

    if (trimmed !== "") atSlideStart = false;
  }

  flush();
  return slides;
}

function parseDeckMeta(data: unknown): DeckMeta {
  return deckMetaSchema.parse(data);
}

function parseSlideMeta(data: unknown, slideIndex: number): SlideMeta {
  const parsed = slideMetaSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid frontmatter in slide ${slideIndex + 1}: ${parsed.error.message}`);
  }

  return parsed.data;
}

export function parseDeck(source: string): DeckModel {
  const normalized = source.replace(/\r\n/g, "\n").trim();

  const deckMatter = parseFrontmatter(normalized);
  const meta = parseDeckMeta(deckMatter.data);
  const rawSlides = splitSlides(deckMatter.content);
  const slideSources = rawSlides.length > 0 ? rawSlides : ["# Empty deck"];

  const slides = slideSources.map((slide, index): SlideUnit => {
    const slideMatter = parseFrontmatter(slide);
    const slideMeta = parseSlideMeta(slideMatter.data, index);

    return {
      id: `slide-${index + 1}`,
      index,
      meta: slideMeta,
      source: slideMatter.content.trim() || "# Empty slide",
    };
  });

  return {
    meta,
    slides,
  };
}
