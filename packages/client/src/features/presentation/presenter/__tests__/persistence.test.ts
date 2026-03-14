import { describe, expect, it } from "vite-plus/test";
import {
  parsePersistedPresenterCursorMode,
  parsePersistedPresenterSidebarWidth,
  parsePersistedPresenterStageScale,
} from "../persistence";

describe("presenter persistence", () => {
  it("parses allowed stage scale values", () => {
    expect(parsePersistedPresenterStageScale("1.08")).toBe(1.08);
    expect(parsePersistedPresenterStageScale("1")).toBe(1);
    expect(parsePersistedPresenterStageScale("0.95")).toBeNull();
  });

  it("parses cursor mode values", () => {
    expect(parsePersistedPresenterCursorMode("always")).toBe("always");
    expect(parsePersistedPresenterCursorMode("idle-hide")).toBe("idle-hide");
    expect(parsePersistedPresenterCursorMode("hidden")).toBeNull();
  });

  it("parses finite sidebar widths only", () => {
    expect(parsePersistedPresenterSidebarWidth("320")).toBe(320);
    expect(parsePersistedPresenterSidebarWidth("Infinity")).toBeNull();
    expect(parsePersistedPresenterSidebarWidth("abc")).toBeNull();
  });
});
