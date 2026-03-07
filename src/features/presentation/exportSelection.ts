export interface SlideRange {
  start: number;
  end: number;
}

function parsePositiveInt(value: string) {
  if (!/^\d+$/.test(value)) return null;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return null;

  return parsed;
}

function normalizeRanges(ranges: SlideRange[]) {
  const sorted = [...ranges].sort((left, right) => left.start - right.start);
  const merged: SlideRange[] = [];

  for (const range of sorted) {
    const previous = merged[merged.length - 1];
    if (!previous || range.start > previous.end + 1) {
      merged.push({ ...range });
      continue;
    }

    previous.end = Math.max(previous.end, range.end);
  }

  return merged;
}

export function parseSlideSelection(selection: string | null | undefined): SlideRange[] | null {
  const trimmed = selection?.trim() ?? "";
  if (!trimmed) return null;

  const ranges: SlideRange[] = [];
  const parts = trimmed.split(",");

  for (const part of parts) {
    const token = part.trim();
    if (!token) throw new Error("Slide selection contains an empty segment.");

    const [rawStart, rawEnd] = token.split("-", 2);
    const start = parsePositiveInt(rawStart);
    if (!start) throw new Error(`Invalid slide selection segment: "${token}"`);

    if (rawEnd === undefined) {
      ranges.push({ start, end: start });
      continue;
    }

    const end = parsePositiveInt(rawEnd);
    if (!end || end < start) throw new Error(`Invalid slide range: "${token}"`);

    ranges.push({ start, end });
  }

  return normalizeRanges(ranges);
}

export function clampSlideSelection(ranges: SlideRange[] | null, totalSlides: number) {
  if (!ranges) {
    if (totalSlides < 1) return [];

    return [{ start: 1, end: totalSlides }];
  }

  const clamped = ranges
    .map((range) => ({
      start: Math.max(range.start, 1),
      end: Math.min(range.end, totalSlides),
    }))
    .filter((range) => range.start <= range.end);

  return normalizeRanges(clamped);
}

export function expandSlideSelection(ranges: SlideRange[]) {
  const slides: number[] = [];

  for (const range of ranges) {
    for (let slide = range.start; slide <= range.end; slide += 1) {
      slides.push(slide);
    }
  }

  return slides;
}

export function createRangesFromSlides(slides: number[]) {
  const uniqueSlides = [...new Set(slides)].sort((left, right) => left - right);
  if (uniqueSlides.length === 0) return [];

  const ranges: SlideRange[] = [];
  let start = uniqueSlides[0];
  let end = uniqueSlides[0];

  for (let index = 1; index < uniqueSlides.length; index += 1) {
    const slide = uniqueSlides[index];
    if (slide === end + 1) {
      end = slide;
      continue;
    }

    ranges.push({ start, end });
    start = slide;
    end = slide;
  }

  ranges.push({ start, end });
  return ranges;
}

export function toPdfPageRanges(ranges: SlideRange[]) {
  return ranges
    .map((range) => (range.start === range.end ? `${range.start}` : `${range.start}-${range.end}`))
    .join(",");
}

export function createSlideSelectionLabel(ranges: SlideRange[]) {
  if (ranges.length === 0) return "slides";

  return `slides-${toPdfPageRanges(ranges).replaceAll(",", "_")}`;
}
