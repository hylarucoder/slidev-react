export interface BuiltinThemeRuntimeEntry {
  id: string
  module: string
  style?: string
}

export const builtinThemeRuntimeEntries: BuiltinThemeRuntimeEntry[] = [
  {
    id: 'kami',
    module: '@slidev-react/client/themes/kami',
    style: '@slidev-react/client/themes/kami/style.css',
  },
  {
    id: 'moonlit',
    module: '@slidev-react/client/themes/moonlit',
    style: '@slidev-react/client/themes/moonlit/style.css',
  },
]
