import { describe, expect, it } from "vite-plus/test";
import { parseFrontmatter } from "../frontmatter";

describe("parseFrontmatter", () => {
  it("extracts YAML data and remaining content", () => {
    const source = "---\ntitle: Hello\nlayout: cover\n---\n# Slide 1";
    const result = parseFrontmatter(source);
    expect(result.data).toEqual({ title: "Hello", layout: "cover" });
    expect(result.content).toBe("# Slide 1");
  });

  it("returns empty data when no frontmatter is present", () => {
    const source = "# Just markdown";
    const result = parseFrontmatter(source);
    expect(result.data).toEqual({});
    expect(result.content).toBe("# Just markdown");
  });

  it("handles frontmatter at the very end of the file", () => {
    const source = "---\ntitle: Only Meta\n---";
    const result = parseFrontmatter(source);
    expect(result.data).toEqual({ title: "Only Meta" });
    expect(result.content).toBe("");
  });

  it("normalizes CRLF line endings to LF", () => {
    const source = "---\r\ntitle: CRLF\r\n---\r\n# Content";
    const result = parseFrontmatter(source);
    expect(result.data).toEqual({ title: "CRLF" });
    expect(result.content).toBe("# Content");
  });

  it("throws when the closing --- is missing", () => {
    const source = "---\ntitle: Broken\n# No closing fence";
    expect(() => parseFrontmatter(source)).toThrow("missing closing ---");
  });

  it("handles empty frontmatter block with a blank line", () => {
    const source = "---\n\n---\n# Content";
    const result = parseFrontmatter(source);
    expect(result.data).toEqual({});
    expect(result.content).toBe("# Content");
  });

  it("throws when there is no gap between opening and closing markers", () => {
    const source = "---\n---\n# Content";
    expect(() => parseFrontmatter(source)).toThrow("missing closing ---");
  });

  it("preserves content after the frontmatter exactly", () => {
    const source = "---\nkey: value\n---\nline1\nline2\nline3";
    const result = parseFrontmatter(source);
    expect(result.content).toBe("line1\nline2\nline3");
  });

  it("treats a file not starting with --- as having no frontmatter", () => {
    const source = "Hello\n---\ntitle: not frontmatter\n---";
    const result = parseFrontmatter(source);
    expect(result.data).toEqual({});
    expect(result.content).toBe(source);
  });
});
