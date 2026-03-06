import path from 'node:path'
import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { generatedDeckAlias, generatedDeckEntry, pluginCompileTimeDeck } from './src/deck/build/generateCompiledDeck'

const appRoot = process.cwd()
const deckSourceFile = path.resolve(appRoot, './slides.mdx')

export default defineConfig({
  plugins: [
    pluginCompileTimeDeck({
      appRoot,
      deckSourceFile,
    }),
    pluginReact(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
      [generatedDeckAlias]: path.resolve(appRoot, generatedDeckEntry),
      react: path.resolve(process.cwd(), './node_modules/react'),
      'react-dom': path.resolve(process.cwd(), './node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(process.cwd(), './node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(process.cwd(), './node_modules/react/jsx-dev-runtime.js'),
    },
  },
  source: {
    entry: {
      index: './src/main.tsx',
    },
  },
})
