export interface ResolvedThemeExtension {
  id: string
  importPath: string
  styleImportPath?: string
  definitionFilePath?: string
  source: 'builtin' | 'local' | 'package'
}

export interface ResolvedAddonExtension {
  id: string
  importPath: string
  styleImportPath?: string
  definitionFilePath?: string
  source: 'builtin' | 'local' | 'package'
}
