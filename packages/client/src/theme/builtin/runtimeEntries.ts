export interface BuiltinThemeRuntimeEntry {
  id: string
  module: string
  style?: string
}

export const builtinThemeRuntimeEntries: BuiltinThemeRuntimeEntry[] = [
  {
    id: 'moonlit',
    module: '@slidev-react/client/themes/moonlit',
    style: '@slidev-react/client/themes/moonlit/style.css',
  },
]
