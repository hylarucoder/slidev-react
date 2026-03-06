import { describe, expect, it } from 'vitest'
import { parseFrontmatter } from './frontmatter'
import { parseDeck } from './parseDeck'

describe('parseFrontmatter', () => {
  it('parses frontmatter block and content', () => {
    const source = `---\ntitle: Deck\n---\n# Hello`
    const parsed = parseFrontmatter(source)

    expect(parsed.data).toEqual({ title: 'Deck' })
    expect(parsed.content.trim()).toBe('# Hello')
  })

  it('accepts frontmatter closed at file end', () => {
    const source = `---\ntitle: Deck\n---`
    const parsed = parseFrontmatter(source)

    expect(parsed.data).toEqual({ title: 'Deck' })
    expect(parsed.content).toBe('')
  })
})

describe('parseDeck', () => {
  it('parses deck meta and slide meta', () => {
    const source = `---\ntitle: Demo\nlayout: default\n---\n\n---\ntitle: Intro\nlayout: center\nclass: hero\n---\n\n# Hello\n\n---\n\n## Next`

    const parsed = parseDeck(source)

    expect(parsed.meta.title).toBe('Demo')
    expect(parsed.meta.layout).toBe('default')
    expect(parsed.slides).toHaveLength(2)
    expect(parsed.slides[0].meta).toEqual({
      title: 'Intro',
      layout: 'center',
      class: 'hero',
    })
    expect(parsed.slides[1].source.trim()).toBe('## Next')
  })

  it('does not split slide when separator appears in code fence', () => {
    const source = [
      '---',
      'title: Demo',
      '---',
      '',
      '## Sample',
      '',
      '```md',
      '---',
      'not a separator',
      '```',
      '',
      '---',
      '',
      '## Final',
    ].join('\n')

    const parsed = parseDeck(source)

    expect(parsed.slides).toHaveLength(2)
    expect(parsed.slides[0].source).toContain('not a separator')
  })

  it('throws on invalid slide frontmatter', () => {
    const source = `---\ntitle: Demo\n---\n\n---\nlayout: side\n---\n\n# Invalid`

    expect(() => parseDeck(source)).toThrowError('Invalid frontmatter in slide 1')
  })

  it('treats separator and next slide frontmatter as the same page start', () => {
    const source = `---\ntitle: Demo\n---\n\n# First\n\n---\ntitle: Second\nlayout: center\n---\n\n# Second slide`

    const parsed = parseDeck(source)

    expect(parsed.slides).toHaveLength(2)
    expect(parsed.slides[0].source.trim()).toBe('# First')
    expect(parsed.slides[1].meta).toEqual({
      title: 'Second',
      layout: 'center',
    })
    expect(parsed.slides[1].source.trim()).toBe('# Second slide')
  })

  it('accepts extended layout names', () => {
    const source = `---\ntitle: Demo\nlayout: cover\n---\n\n---\ntitle: Chapter 1\nlayout: section\n---\n\n# Section\n\n---\nlayout: two-cols\n---\n\n# Two Cols\n\n---\nlayout: image-right\n---\n\n# Image Right\n\n---\nlayout: statement\n---\n\n# Statement`

    const parsed = parseDeck(source)

    expect(parsed.meta.layout).toBe('cover')
    expect(parsed.slides[0].meta.layout).toBe('section')
    expect(parsed.slides[1].meta.layout).toBe('two-cols')
    expect(parsed.slides[2].meta.layout).toBe('image-right')
    expect(parsed.slides[3].meta.layout).toBe('statement')
  })
})
