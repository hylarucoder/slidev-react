import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

interface PackageJson {
  name?: string
  version?: string
  private?: boolean
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T
}

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function isSemver(value: string) {
  return /^\d+\.\d+\.\d+$/.test(value)
}

function bumpVersion(current: string, bump: string) {
  if (isSemver(bump)) return bump

  const [major, minor, patch] = current.split('.').map(Number)

  switch (bump) {
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'major':
      return `${major + 1}.0.0`
    default:
      throw new Error('Usage: pnpm exec tsx ./scripts/bump-version.ts [patch|minor|major|<explicit-version>]')
  }
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, '..')
const packagesDir = path.join(rootDir, 'packages')
const args = process.argv.slice(2).filter((arg) => arg !== '--')
const bump = args[0] ?? 'patch'

if (!existsSync(packagesDir)) {
  throw new Error('No packages directory found.')
}

const packageFiles = readdirSync(packagesDir)
  .map((entry) => path.join(packagesDir, entry, 'package.json'))
  .filter((filePath) => existsSync(filePath))
  .filter((filePath) => readJson<PackageJson>(filePath).private !== true)

if (packageFiles.length === 0) {
  throw new Error('No publishable sub-packages were found under packages/*.')
}

const versions = [...new Set(
  packageFiles.map((filePath) => {
    const version = readJson<PackageJson>(filePath).version
    if (!version) {
      throw new Error(`Missing version in ${path.relative(rootDir, filePath)}.`)
    }
    return version
  }),
)]

if (!isSemver(bump) && versions.length !== 1) {
  console.error('Publishable sub-packages do not share a single current version:')
  for (const filePath of packageFiles) {
    const pkg = readJson<PackageJson>(filePath)
    console.error(`  - ${path.relative(rootDir, filePath)}: ${pkg.version}`)
  }
  console.error('')
  console.error('Use an explicit target version, for example:')
  console.error('  pnpm exec tsx ./scripts/bump-version.ts 0.4.0')
  process.exit(1)
}

const currentDisplay = versions.length === 1 ? versions[0] : 'mixed'
const nextVersion = bumpVersion(versions[0]!, bump)

console.log(`Current publishable package version: ${currentDisplay}`)
console.log(`Bumping publishable sub-packages -> ${nextVersion}`)
console.log('')

for (const filePath of packageFiles) {
  const pkg = readJson<PackageJson>(filePath)
  pkg.version = nextVersion
  writeJson(filePath, pkg)
  console.log(`  ✓ ${path.relative(rootDir, filePath)} -> ${nextVersion}`)
}

console.log('')
console.log(`Done! Publishable sub-packages are now at ${nextVersion}.`)
console.log('')
console.log('Next steps:')
console.log('  1. git add packages/*/package.json')
console.log(`  2. git commit -m "chore: bump v${nextVersion}"`)
console.log('  3. pnpm run release:publish')
