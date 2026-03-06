import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import {
  generatedDeckAlias,
  generatedDeckEntry,
  pluginCompileTimeDeck,
} from "./src/deck/build/generateCompiledDeck";

const appRoot = process.cwd();
const deckSourceFile = path.resolve(appRoot, "./slides.mdx");

export default defineConfig({
  plugins: [
    pluginCompileTimeDeck({
      appRoot,
      deckSourceFile,
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(appRoot, "./src"),
      [generatedDeckAlias]: path.resolve(appRoot, generatedDeckEntry),
      react: path.resolve(appRoot, "./node_modules/react"),
      "react-dom": path.resolve(appRoot, "./node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(appRoot, "./node_modules/react/jsx-runtime.js"),
      "react/jsx-dev-runtime": path.resolve(appRoot, "./node_modules/react/jsx-dev-runtime.js"),
    },
  },
});
