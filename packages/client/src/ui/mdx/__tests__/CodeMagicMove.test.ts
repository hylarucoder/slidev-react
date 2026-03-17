import { describe, expect, it } from "vite-plus/test";
import { resolveMagicMoveTheme } from "../CodeMagicMove";

describe("resolveMagicMoveTheme", () => {
  it("uses the dark Shiki theme for dark slide themes", () => {
    expect(resolveMagicMoveTheme("dark")).toBe("vitesse-dark");
  });

  it("falls back to the light Shiki theme for non-dark slide themes", () => {
    expect(resolveMagicMoveTheme("light")).toBe("vitesse-light");
    expect(resolveMagicMoveTheme()).toBe("vitesse-light");
  });
});
