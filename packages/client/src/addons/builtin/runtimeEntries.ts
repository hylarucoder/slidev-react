export interface BuiltinAddonRuntimeEntry {
  id: string
  module: string
  style?: string
}

export const builtinAddonRuntimeEntries: BuiltinAddonRuntimeEntry[] = [
  {
    id: 'mermaid',
    module: '@slidev-react/client/addons/mermaid',
  },
  {
    id: 'g2',
    module: '@slidev-react/client/addons/g2',
    style: '@slidev-react/client/addons/g2/style.css',
  },
  {
    id: 'insight',
    module: '@slidev-react/client/addons/insight',
    style: '@slidev-react/client/addons/insight/style.css',
  },
  {
    id: 'editorial',
    module: '@slidev-react/client/addons/editorial',
    style: '@slidev-react/client/addons/editorial/style.css',
  },
]
