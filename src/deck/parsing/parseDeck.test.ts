import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "./frontmatter";
import { parseDeck } from "./parseDeck";

describe("parseFrontmatter", () => {
  it("parses frontmatter block and content", () => {
    const source = `---\ntitle: Deck\n---\n# Hello`;
    const parsed = parseFrontmatter(source);

    expect(parsed.data).toEqual({ title: "Deck" });
    expect(parsed.content.trim()).toBe("# Hello");
  });

  it("accepts frontmatter closed at file end", () => {
    const source = `---\ntitle: Deck\n---`;
    const parsed = parseFrontmatter(source);

    expect(parsed.data).toEqual({ title: "Deck" });
    expect(parsed.content).toBe("");
  });
});

describe("parseDeck", () => {
  it("parses deck meta and slide meta", () => {
    const source = `---\ntitle: Demo\naddons:\n  - insight\nlayout: default\nbackground: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)'\ntransition: fade\nexportFilename: client-demo\n---\n\n---\ntitle: Intro\nlayout: center\nclass: hero\nbackground: '#0f172a'\ntransition: slide-left\nclicks: 2\nsrc: ./partials/intro.mdx\n---\n\n# Hello\n\n---\n\n## Next`;

    const parsed = parseDeck(source);

    expect(parsed.meta.title).toBe("Demo");
    expect(parsed.meta.addons).toEqual(["insight"]);
    expect(parsed.meta.layout).toBe("default");
    expect(parsed.meta.background).toBe("linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)");
    expect(parsed.meta.transition).toBe("fade");
    expect(parsed.meta.exportFilename).toBe("client-demo");
    expect(parsed.slides).toHaveLength(2);
    expect(parsed.slides[0].meta).toEqual({
      title: "Intro",
      layout: "center",
      class: "hero",
      background: "#0f172a",
      transition: "slide-left",
      clicks: 2,
      src: "./partials/intro.mdx",
    });
    expect(parsed.slides[1].source.trim()).toBe("## Next");
  });

  it("does not split slide when separator appears in code fence", () => {
    const source = [
      "---",
      "title: Demo",
      "---",
      "",
      "## Sample",
      "",
      "```md",
      "---",
      "not a separator",
      "```",
      "",
      "---",
      "",
      "## Final",
    ].join("\n");

    const parsed = parseDeck(source);

    expect(parsed.slides).toHaveLength(2);
    expect(parsed.slides[0].source).toContain("not a separator");
  });

  it("throws on invalid slide frontmatter", () => {
    const source = `---\ntitle: Demo\n---\n\n---\nclicks: nope\n---\n\n# Invalid`;

    expect(() => parseDeck(source)).toThrowError("Invalid frontmatter in slide 1: clicks:");
  });

  it("treats separator and next slide frontmatter as the same page start", () => {
    const source = `---\ntitle: Demo\n---\n\n# First\n\n---\ntitle: Second\nlayout: center\n---\n\n# Second slide`;

    const parsed = parseDeck(source);

    expect(parsed.slides).toHaveLength(2);
    expect(parsed.slides[0].source.trim()).toBe("# First");
    expect(parsed.slides[1].meta).toEqual({
      title: "Second",
      layout: "center",
    });
    expect(parsed.slides[1].source.trim()).toBe("# Second slide");
  });

  it("supports metadata-only slides followed by another frontmatter slide", () => {
    const source = [
      "---",
      "title: Demo",
      "---",
      "",
      "---",
      "title: Imported",
      "src: ./slides/imported.mdx",
      "---",
      "",
      "---",
      "title: Second",
      "---",
      "",
      "# Second slide",
    ].join("\n");

    const parsed = parseDeck(source);

    expect(parsed.slides).toHaveLength(2);
    expect(parsed.slides[0].meta.src).toBe("./slides/imported.mdx");
    expect(parsed.slides[0].hasInlineSource).toBe(false);
    expect(parsed.slides[1].meta.title).toBe("Second");
  });

  it("accepts extended layout names", () => {
    const source = `---\ntitle: Demo\nlayout: cover\n---\n\n---\ntitle: Chapter 1\nlayout: section\n---\n\n# Section\n\n---\nlayout: two-cols\n---\n\n# Two Cols\n\n---\nlayout: image-right\n---\n\n# Image Right\n\n---\nlayout: statement\n---\n\n# Statement\n\n---\nlayout: spotlight\n---\n\n# Custom`;

    const parsed = parseDeck(source);

    expect(parsed.meta.layout).toBe("cover");
    expect(parsed.slides[0].meta.layout).toBe("section");
    expect(parsed.slides[1].meta.layout).toBe("two-cols");
    expect(parsed.slides[2].meta.layout).toBe("image-right");
    expect(parsed.slides[3].meta.layout).toBe("statement");
    expect(parsed.slides[4].meta.layout).toBe("spotlight");
  });

  it("parses multiline speaker notes from slide frontmatter", () => {
    const source = [
      "---",
      "title: Demo",
      "---",
      "",
      "---",
      "title: Intro",
      "notes: |",
      "  Start with the customer problem.",
      "  Pause before the architecture diagram.",
      "",
      "  End with the migration hook.",
      "---",
      "",
      "# Hello",
    ].join("\n");

    const parsed = parseDeck(source);

    expect(parsed.slides[0].meta.notes).toBe(
      [
        "Start with the customer problem.",
        "Pause before the architecture diagram.",
        "",
        "End with the migration hook.",
      ].join("\n"),
    );
  });

  it("keeps multiline notes inside later-slide frontmatter instead of splitting the slide", () => {
    const source = [
      "---",
      "title: Demo",
      "---",
      "",
      "# First",
      "",
      "---",
      "title: Welcome",
      "layout: center",
      "notes: |",
      "  Frame the repo in one sentence.",
      "",
      "  Transition into the authoring model.",
      "---",
      "",
      "# Second",
    ].join("\n");

    const parsed = parseDeck(source);

    expect(parsed.slides).toHaveLength(2);
    expect(parsed.slides[1].meta.title).toBe("Welcome");
    expect(parsed.slides[1].meta.layout).toBe("center");
    expect(parsed.slides[1].meta.notes).toBe(
      ["Frame the repo in one sentence.", "", "Transition into the authoring model."].join("\n"),
    );
    expect(parsed.slides[1].source).toBe("# Second");
  });

  it("throws on non-string speaker notes", () => {
    const source = [
      "---",
      "title: Demo",
      "---",
      "",
      "---",
      "title: Intro",
      "notes:",
      "  - first",
      "  - second",
      "---",
      "",
      "# Hello",
    ].join("\n");

    expect(() => parseDeck(source)).toThrowError("Invalid frontmatter in slide 1");
  });

  it("throws on invalid slide clicks values", () => {
    const source = [
      "---",
      "title: Demo",
      "---",
      "",
      "---",
      "title: Intro",
      "clicks: -1",
      "---",
      "",
      "# Hello",
    ].join("\n");

    expect(() => parseDeck(source)).toThrowError("Invalid frontmatter in slide 1");
  });

  it("throws on invalid slide src values", () => {
    const source = [
      "---",
      "title: Demo",
      "---",
      "",
      "---",
      "title: Intro",
      "src:",
      "  path: ./intro.mdx",
      "---",
      "",
      "# Hello",
    ].join("\n");

    expect(() => parseDeck(source)).toThrowError("Invalid frontmatter in slide 1");
  });

  it("throws on invalid transition values", () => {
    const source = ["---", "title: Demo", "transition: swirl", "---", "", "# Hello"].join("\n");

    expect(() => parseDeck(source)).toThrowError(
      "Invalid deck frontmatter: transition: Invalid option",
    );
  });

  it("normalizes addon identifiers from deck frontmatter", () => {
    const source = [
      "---",
      "title: Demo",
      "addons:",
      "  - insight",
      "  - insight",
      "  -  paper-tools  ",
      "---",
      "",
      "# Hello",
    ].join("\n");

    const parsed = parseDeck(source);

    expect(parsed.meta.addons).toEqual(["insight", "paper-tools"]);
  });
});
