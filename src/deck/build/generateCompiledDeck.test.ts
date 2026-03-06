import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { generateCompiledDeckArtifacts } from './generateCompiledDeck'

async function createTempAppRoot() {
  return mkdtemp(path.join(tmpdir(), 'slide-react-deck-'))
}

async function writeDeckSource(appRoot: string, source: string) {
  const deckSourceFile = path.join(appRoot, 'slides.mdx')
  await writeFile(deckSourceFile, source, 'utf8')
  return deckSourceFile
}

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

describe('generateCompiledDeckArtifacts', () => {
  it('generates a manifest and per-slide modules', async () => {
    const appRoot = await createTempAppRoot()
    tempDirs.push(appRoot)
    const deckSourceFile = await writeDeckSource(appRoot, [
      '---',
      'title: Demo Deck',
      'layout: center',
      '---',
      '',
      '---',
      'title: Intro',
      'layout: cover',
      '---',
      '',
      '# Hello',
      '',
      '---',
      'title: Next',
      '---',
      '',
      '```mermaid',
      'graph TD',
      'A-->B',
      '```',
    ].join('\n'))

    const result = await generateCompiledDeckArtifacts({
      appRoot,
      deckSourceFile,
    })

    const manifest = await readFile(result.manifestFile, 'utf8')
    const firstSlide = await readFile(
      path.join(appRoot, '.generated/deck/slides/slide-1.tsx'),
      'utf8',
    )
    const secondSlide = await readFile(
      path.join(appRoot, '.generated/deck/slides/slide-2.tsx'),
      'utf8',
    )

    expect(result.sourceHash).toHaveLength(12)
    expect(manifest).toContain('const compiledDeck: CompiledDeckManifest = {')
    expect(manifest).toContain('sourceHash:')
    expect(manifest).toContain('"title": "Demo Deck"')
    expect(manifest).toContain('id: "slide-1"')
    expect(manifest).toContain('id: "slide-2"')
    expect(firstSlide).toContain('export default function MDXContent')
    expect(secondSlide).toContain('export default function MDXContent')
    expect(secondSlide).toContain('<MermaidDiagram>{"graph TD\\nA-->B"}</MermaidDiagram>')
  })

  it('removes stale generated slide modules', async () => {
    const appRoot = await createTempAppRoot()
    tempDirs.push(appRoot)
    const deckSourceFile = await writeDeckSource(appRoot, [
      '---',
      'title: Demo Deck',
      '---',
      '',
      '# One',
      '',
      '---',
      '',
      '# Two',
    ].join('\n'))

    await generateCompiledDeckArtifacts({
      appRoot,
      deckSourceFile,
    })

    await writeDeckSource(appRoot, [
      '---',
      'title: Demo Deck',
      '---',
      '',
      '# One',
    ].join('\n'))

    await generateCompiledDeckArtifacts({
      appRoot,
      deckSourceFile,
    })

    await expect(
      access(path.join(appRoot, '.generated/deck/slides/slide-2.tsx')),
    ).rejects.toThrow()
  })

  it('includes the slide title in compile errors', async () => {
    const appRoot = await createTempAppRoot()
    tempDirs.push(appRoot)
    const deckSourceFile = await writeDeckSource(appRoot, [
      '---',
      'title: Demo Deck',
      '---',
      '',
      '---',
      'title: Intro',
      '---',
      '',
      '# Hello',
      '',
      '---',
      'title: Broken',
      '---',
      '',
      '{',
    ].join('\n'))

    await expect(generateCompiledDeckArtifacts({
      appRoot,
      deckSourceFile,
    })).rejects.toThrow('Failed to compile slide 2 (Broken)')
  })
})
