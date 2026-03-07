import type { DeckMeta, DeckModel } from "../model/deck";
import type { SlideMeta, SlideUnit } from "../model/slide";
import { z, type ZodError } from "zod";
import { transitionNames } from "../model/transition";
import { parseFrontmatter } from "./frontmatter";

const layoutSchema = z.string().trim().min(1, "Layout name cannot be empty");
const transitionSchema = z.enum(transitionNames);
const addonsSchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    if (!value) return undefined;

    const list = (Array.isArray(value) ? value : [value])
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    return list.length > 0 ? [...new Set(list)] : undefined;
  });
const notesSchema = z
  .string()
  .transform((value) => value.trim())
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const deckMetaSchema = z.object({
  title: z.string().optional(),
  theme: z.string().optional(),
  addons: addonsSchema,
  layout: layoutSchema.optional(),
  background: z.string().optional(),
  transition: transitionSchema.optional(),
  exportFilename: z.string().optional(),
});

const slideMetaSchema = z.object({
  title: z.string().optional(),
  layout: layoutSchema.optional(),
  class: z.string().optional(),
  background: z.string().optional(),
  transition: transitionSchema.optional(),
  clicks: z.number().int().nonnegative().optional(),
  notes: notesSchema,
  src: z.string().optional(),
});

const codeFenceStartRE = /^(`{3,}|~{3,})/;
function isLikelyYamlMeta(lines: string[]): boolean {
  const candidate = lines.join("\n").trim();
  if (!candidate) return false;

  try {
    const parsed = parseFrontmatter(`---\n${candidate}\n---`).data;
    return parsed != null && typeof parsed === "object" && !Array.isArray(parsed);
  } catch {
    return false;
  }
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
      if (trimmed === "---") {
        inSlideFrontmatter = false;
        atSlideStart = false;
      }
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
  const parsed = deckMetaSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid deck frontmatter: ${formatZodIssues(parsed.error)}`);
  }

  return parsed.data;
}

function formatZodIssues(error: ZodError) {
  return error.issues
    .map((issue) => {
      const pathLabel = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
      return `${pathLabel}${issue.message}`;
    })
    .join("; ");
}

export function parseSlideMeta(data: unknown, slideIndex: number | string): SlideMeta {
  const parsed = slideMetaSchema.safeParse(data);
  if (!parsed.success) {
    const slideLabel =
      typeof slideIndex === "number" ? `slide ${slideIndex + 1}` : String(slideIndex);
    throw new Error(`Invalid frontmatter in ${slideLabel}: ${formatZodIssues(parsed.error)}`);
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
    const trimmedSource = slideMatter.content.trim();

    return {
      id: `slide-${index + 1}`,
      index,
      meta: slideMeta,
      source: trimmedSource || "# Empty slide",
      hasInlineSource: trimmedSource.length > 0,
    };
  });

  return {
    meta,
    slides,
  };
}
