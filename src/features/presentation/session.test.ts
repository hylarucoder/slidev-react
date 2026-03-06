import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildPresentationEntryUrl,
  resolvePresentationSession,
  updateSyncModeInUrl,
} from "./session";

const originalWindow = globalThis.window;

function installWindow(url: string) {
  const parsed = new URL(url);
  const location = {
    origin: parsed.origin,
    pathname: parsed.pathname,
    search: parsed.search,
    hash: parsed.hash,
    hostname: parsed.hostname,
    protocol: parsed.protocol,
  };

  const history = {
    replaceState: vi.fn((_state: unknown, _title: string, nextUrl: string) => {
      const resolved = new URL(nextUrl, location.origin);
      location.origin = resolved.origin;
      location.pathname = resolved.pathname;
      location.search = resolved.search;
      location.hash = resolved.hash;
      location.hostname = resolved.hostname;
      location.protocol = resolved.protocol;
    }),
  };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      location,
      history,
    },
  });

  return {
    history,
    location,
  };
}

afterEach(() => {
  if (typeof originalWindow === "undefined") {
    delete (globalThis as { window?: Window }).window;
  } else {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
  vi.restoreAllMocks();
});

describe("resolvePresentationSession", () => {
  it("keeps non-slide routes in standalone mode", () => {
    const { location, history } = installWindow("http://localhost:3000/");

    const session = resolvePresentationSession("deckhash");

    expect(session.enabled).toBe(false);
    expect(session.role).toBe("standalone");
    expect(session.sessionId).toBeNull();
    expect(location.pathname).toBe("/");
    expect(location.search).toBe("");
    expect(history.replaceState).not.toHaveBeenCalled();
  });

  it("treats numbered routes as viewer mode without query params", () => {
    const { location } = installWindow("http://localhost:3000/4?foo=bar");

    const session = resolvePresentationSession("deckhash");

    expect(session.enabled).toBe(true);
    expect(session.role).toBe("viewer");
    expect(session.syncMode).toBe("receive");
    expect(session.sessionId).toBe("deckhash-default");
    expect(location.pathname).toBe("/4");
    expect(location.search).toBe("");
    expect(session.viewerUrl).toBe("http://localhost:3000/4");
    expect(session.presenterUrl).toBe("http://localhost:3000/presenter/4");
  });

  it("normalizes presenter routes without adding query params", () => {
    const { location } = installWindow("http://localhost:3000/presenter/2?sync=both");

    const session = resolvePresentationSession("deckhash");

    expect(session.enabled).toBe(true);
    expect(session.role).toBe("presenter");
    expect(session.syncMode).toBe("send");
    expect(location.pathname).toBe("/presenter/2");
    expect(location.search).toBe("");
    expect(session.viewerUrl).toBe("http://localhost:3000/2");
  });
});

describe("presentation entry urls", () => {
  it("uses path-only presenter urls", () => {
    installWindow("http://localhost:3000/5");

    expect(buildPresentationEntryUrl("presenter", "deckhash")).toBe(
      "http://localhost:3000/presenter/5",
    );
  });

  it("keeps sync mode changes out of the url", () => {
    const { location } = installWindow("http://localhost:3000/presenter/3");

    updateSyncModeInUrl("both");
    expect(location.pathname).toBe("/presenter/3");
    expect(location.search).toBe("");
  });
});
