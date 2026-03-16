import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

interface OwnPackageJson {
  version: string
  slidevReactTemplate?: Record<string, string>
}

interface TemplatePackageJson {
  name: string
  private: true
  scripts: Record<string, string>
  dependencies: Record<string, string>
  devDependencies?: Record<string, string>
  engines: {
    node: string
  }
}

export interface ScaffoldProjectOptions {
  cwd: string
  targetDir: string
  force?: boolean
}

export interface ScaffoldProjectResult {
  projectRoot: string
  packageName: string
  packageManagerHint: string
}

function resolveLocalPath(...candidates: string[]) {
  for (const candidate of candidates) {
    const resolved = fileURLToPath(new URL(candidate, import.meta.url))
    if (existsSync(resolved)) {
      return resolved
    }
  }

  throw new Error(`Unable to resolve local create-app asset from ${import.meta.url}.`)
}

const ownPackageJsonPath = resolveLocalPath('../package.json', '../../package.json')
const templateDir = resolveLocalPath('../template', '../../template')

function readOwnPackageJson() {
  return JSON.parse(readFileSync(ownPackageJsonPath, 'utf8')) as OwnPackageJson
}

function isDirectoryEmpty(dir: string) {
  return readdirSync(dir).length === 0
}

function emptyDir(dir: string) {
  for (const entry of readdirSync(dir)) {
    rmSync(path.join(dir, entry), { recursive: true, force: true })
  }
}

function copyTemplateDir(sourceDir: string, targetDir: string) {
  mkdirSync(targetDir, { recursive: true })

  for (const entry of readdirSync(sourceDir)) {
    const sourcePath = path.join(sourceDir, entry)
    const targetPath = path.join(targetDir, entry)
    const sourceStat = statSync(sourcePath)

    if (sourceStat.isDirectory()) {
      copyTemplateDir(sourcePath, targetPath)
      continue
    }

    copyFileSync(sourcePath, targetPath)
  }
}

function detectPackageManagerHint() {
  const npmExecPath = process.env.npm_execpath ?? ''
  const npmUserAgent = process.env.npm_config_user_agent ?? ''
  const joined = `${npmExecPath} ${npmUserAgent}`.toLowerCase()

  if (joined.includes('pnpm')) return 'pnpm'
  if (joined.includes('yarn')) return 'yarn'
  if (joined.includes('bun')) return 'bun'

  return 'npm'
}

export function toValidPackageName(input: string) {
  const normalized = path.basename(input)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._-]+/, '')
    .replace(/[^a-z0-9-~.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/[.-]+$/, '')

  return normalized || 'slidev-react-deck'
}

function createTemplatePackageJson(packageName: string) {
  const ownPackageJson = readOwnPackageJson()
  const templateVersions = ownPackageJson.slidevReactTemplate

  if (!templateVersions) {
    throw new Error('Missing slidevReactTemplate versions in create-slidev-react package.json.')
  }

  const pkg: TemplatePackageJson = {
    name: packageName,
    private: true,
    scripts: {
      dev: 'vp dev',
      build: 'vp build',
      export: 'slidev-react export slides.mdx',
      lint: 'slidev-react lint slides.mdx --strict',
    },
    dependencies: {
      '@mdx-js/react': templateVersions['@mdx-js/react'] ?? '3.1.1',
      '@slidev-react/cli': ownPackageJson.version,
      '@slidev-react/node': ownPackageJson.version,
      react: templateVersions.react ?? '19.2.3',
      'react-dom': templateVersions['react-dom'] ?? '19.2.3',
    },
    devDependencies: {
      'vite-plus': templateVersions['vite-plus'] ?? '0.1.11',
    },
    engines: {
      node: '>=22',
    },
  }

  return pkg
}

export function scaffoldProject(options: ScaffoldProjectOptions): ScaffoldProjectResult {
  const projectRoot = path.resolve(options.cwd, options.targetDir)

  if (!existsSync(projectRoot)) {
    mkdirSync(projectRoot, { recursive: true })
  } else if (!statSync(projectRoot).isDirectory()) {
    throw new Error(`Target path "${options.targetDir}" already exists and is not a directory.`)
  } else if (!options.force && !isDirectoryEmpty(projectRoot)) {
    throw new Error(`Target directory "${options.targetDir}" is not empty.`)
  } else if (options.force) {
    emptyDir(projectRoot)
  }

  copyTemplateDir(templateDir, projectRoot)

  const packageName = toValidPackageName(options.targetDir)
  const packageJson = createTemplatePackageJson(packageName)
  const packageJsonPath = path.join(projectRoot, 'package.json')
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8')

  return {
    projectRoot,
    packageName,
    packageManagerHint: detectPackageManagerHint(),
  }
}
