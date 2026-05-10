import type { SlideAddonDefinition } from '../types'
import { addon as editorialAddon } from './editorial'
import { addon as g2Addon } from './g2'
import { addon as insightAddon } from './insight'
import { addon as mermaidAddon } from './mermaid'

export const builtinAddons: SlideAddonDefinition[] = [
  mermaidAddon,
  g2Addon,
  insightAddon,
  editorialAddon,
]
