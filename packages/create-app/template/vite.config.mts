import { defineConfig } from 'vite-plus'
import { createSlidesViteConfig } from '@slidev-react/node/slides/build/createSlidesViteConfig'

const appRoot = process.cwd()

export default defineConfig(createSlidesViteConfig({ appRoot }))
