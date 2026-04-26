import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { ThemeProvider } from "../ThemeProvider";

test("applies theme root attributes and css vars on mount", async () => {
  await render(
    <ThemeProvider>
      <div>theme</div>
    </ThemeProvider>,
  );

  await expect
    .poll(() => document.documentElement.getAttribute("data-slide-theme"))
    .toBe("default");
  await expect
    .poll(() => document.documentElement.getAttribute("data-slide-color-scheme"))
    .toBe("light");
  await expect
    .poll(() => document.documentElement.style.getPropertyValue("--slide-ui-accent").trim())
    .toBe("#22c55e");
  await expect
    .poll(() => document.documentElement.style.getPropertyValue("--slide-diagram-primary").trim())
    .toBe("#dcfce7");
});
