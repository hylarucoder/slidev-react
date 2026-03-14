import { describe, expect, it } from "vite-plus/test";
import { readOptionValue } from "../readOptionValue";

describe("readOptionValue", () => {
  it("reads value from --option=value syntax", () => {
    const result = readOptionValue(["--format=pdf"], 0, "--format");
    expect(result.value).toBe("pdf");
    expect(result.nextIndex).toBe(0);
  });

  it("reads value from --option value syntax", () => {
    const result = readOptionValue(["--format", "pdf"], 0, "--format");
    expect(result.value).toBe("pdf");
    expect(result.nextIndex).toBe(1);
  });

  it("throws when the next argv entry is missing", () => {
    expect(() => readOptionValue(["--format"], 0, "--format")).toThrow("Missing value");
  });

  it("throws when the next argv entry is another option", () => {
    expect(() => readOptionValue(["--format", "--output"], 0, "--format")).toThrow(
      "Missing value",
    );
  });

  it("handles = syntax with an empty value", () => {
    const result = readOptionValue(["--format="], 0, "--format");
    expect(result.value).toBe("");
  });
});
