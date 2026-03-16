import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vite-plus/test'
import { scaffoldProject, toValidPackageName } from '../createApp'

function readJson<T>(filePath: string) {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T
}

const ownPackageJson = readJson<{
  version: string
  slidevReactTemplate: Record<string, string>
}>(path.resolve(process.cwd(), 'packages/create-app/package.json'))

describe('create-slidev-react scaffoldProject', () => {
  it('creates a minimal runnable starter project', () => {
    const tempRoot = mkdtempSync(path.join(tmpdir(), 'slidev-react-create-app-'))
    const result = scaffoldProject({
      cwd: tempRoot,
      targetDir: 'demo deck',
    })

    const packageJson = readJson<{
      name: string
      dependencies: Record<string, string>
      devDependencies?: Record<string, string>
      scripts: Record<string, string>
    }>(path.join(result.projectRoot, 'package.json'))

    expect(packageJson.name).toBe('demo-deck')
    expect(packageJson.dependencies['@slidev-react/cli']).toBe(ownPackageJson.version)
    expect(packageJson.dependencies['@slidev-react/node']).toBe(ownPackageJson.version)
    expect(packageJson.dependencies.react).toBe(ownPackageJson.slidevReactTemplate.react)
    expect(packageJson.dependencies['react-dom']).toBe(ownPackageJson.slidevReactTemplate['react-dom'])
    expect(packageJson.dependencies['@mdx-js/react']).toBe(ownPackageJson.slidevReactTemplate['@mdx-js/react'])
    expect(packageJson.devDependencies?.['vite-plus']).toBe(ownPackageJson.slidevReactTemplate['vite-plus'])
    expect(packageJson.scripts.dev).toBe('vp dev')
    expect(packageJson.scripts.build).toBe('vp build')
    expect(readFileSync(path.join(result.projectRoot, 'slides.mdx'), 'utf8')).toContain('<MermaidDiagram>')
    expect(readFileSync(path.join(result.projectRoot, 'vite.config.mts'), 'utf8')).toContain('createSlidesViteConfig')
    expect(readFileSync(path.join(result.projectRoot, '.gitignore'), 'utf8')).toContain('node_modules')
  })

  it('refuses to overwrite a non-empty directory unless forced', () => {
    const tempRoot = mkdtempSync(path.join(tmpdir(), 'slidev-react-create-app-'))
    scaffoldProject({
      cwd: tempRoot,
      targetDir: 'deck',
    })

    expect(() => {
      scaffoldProject({
        cwd: tempRoot,
        targetDir: 'deck',
      })
    }).toThrow('Target directory "deck" is not empty.')
  })

  it('overwrites a non-empty directory when force is enabled', () => {
    const tempRoot = mkdtempSync(path.join(tmpdir(), 'slidev-react-create-app-'))
    const result = scaffoldProject({
      cwd: tempRoot,
      targetDir: 'deck',
    })

    const packageJsonPath = path.join(result.projectRoot, 'package.json')
    const slidesPath = path.join(result.projectRoot, 'slides.mdx')

    expect(readFileSync(slidesPath, 'utf8')).toContain('Built-in Mermaid')

    scaffoldProject({
      cwd: tempRoot,
      targetDir: 'deck',
      force: true,
    })

    expect(readFileSync(packageJsonPath, 'utf8')).toContain('"@slidev-react/cli"')
    expect(readFileSync(slidesPath, 'utf8')).toContain('Built-in Charts')
  })

  it('normalizes package names from arbitrary paths', () => {
    expect(toValidPackageName('Demo Deck')).toBe('demo-deck')
    expect(toValidPackageName('./_Invalid Project/')).toBe('invalid-project')
  })
})
