import path from "node:path";
import { defineConfig } from "vite-plus";
import { playwright } from "@vitest/browser-playwright";

const sharedAlias = {
  "virtual:slidev-react/active-theme": path.resolve(
    import.meta.dirname,
    "packages/client/src/theme/__mocks__/active-theme.ts",
  ),
  "@": path.resolve(import.meta.dirname, "packages/client/src"),
};

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: [
            "packages/**/__tests__/*.test.{ts,tsx}",
            "components/**/__tests__/*.test.{ts,tsx}",
          ],
          exclude: ["e2e/**", "**/node_modules/**", "**/*.browser.test.{ts,tsx}"],
        },
        resolve: { alias: sharedAlias },
      },
      {
        test: {
          name: "browser",
          include: ["packages/**/__tests__/*.browser.test.{ts,tsx}"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
        resolve: { alias: sharedAlias },
      },
    ],
  },
});
