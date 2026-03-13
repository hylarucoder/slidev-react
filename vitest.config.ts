import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "**/node_modules/**"],
  },
  resolve: {
    alias: {
      "virtual:slidev-react/active-theme": path.resolve(
        import.meta.dirname,
        "packages/client/src/theme/__mocks__/active-theme.ts",
      ),
    },
  },
});
