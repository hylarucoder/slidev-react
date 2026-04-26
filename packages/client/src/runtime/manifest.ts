import { builtinAddonRuntimeEntries, type BuiltinAddonRuntimeEntry } from '../addons/builtin/runtimeEntries'
import { builtinThemeRuntimeEntries, type BuiltinThemeRuntimeEntry } from '../theme/builtin/runtimeEntries'

export interface ClientRuntimeManifest {
  runtimeEntry: string
  styleEntry: string
  addons: BuiltinAddonRuntimeEntry[]
  themes: BuiltinThemeRuntimeEntry[]
}

export const clientRuntimeManifest: ClientRuntimeManifest = {
  runtimeEntry: '@slidev-react/client/runtime',
  styleEntry: '@slidev-react/client/style.css',
  addons: builtinAddonRuntimeEntries,
  themes: builtinThemeRuntimeEntries,
}
