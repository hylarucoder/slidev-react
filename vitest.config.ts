import path from "node:path";
import { defineConfig } from "vite-plus";
import { playwright } from "vite-plus/test/browser/providers/playwright";

const sharedAlias = {
  "virtual:slidev-react/active-theme": path.resolve(
    import.meta.dirname,
    "packages/client/src/theme/__mocks__/active-theme.ts",
  ),
  "virtual:slidev-react/active-addons": path.resolve(
    import.meta.dirname,
    "packages/client/src/addons/__mocks__/active-addons.ts",
  ),
  "virtual:slidev-react/presentation-config": path.resolve(
    import.meta.dirname,
    "packages/client/src/features/presentation/__mocks__/presentation-config.ts",
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
          exclude: ["e2e/**", "**/dist/**", "**/node_modules/**", "**/*.browser.test.{ts,tsx}"],
        },
        resolve: { alias: sharedAlias },
      },
      {
        test: {
          name: "browser",
          include: ["packages/**/__tests__/*.browser.test.{ts,tsx}"],
          exclude: ["**/dist/**", "**/node_modules/**"],
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
