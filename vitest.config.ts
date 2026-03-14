import path from "node:path";
import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    include: ["packages/**/__tests__/*.test.{ts,tsx}", "components/**/__tests__/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "**/node_modules/**"],
  },
  resolve: {
    alias: {
      "virtual:slidev-react/active-theme": path.resolve(
        import.meta.dirname,
        "packages/client/src/theme/__mocks__/active-theme.ts",
      ),
      "@": path.resolve(import.meta.dirname, "packages/client/src"),
    },
  },
});
