import manifestJson from '../../../manifest.json'
import { describe, expect, it } from 'vite-plus/test'
import { clientRuntimeManifest } from '../manifest'

describe('client runtime manifest', () => {
  it('keeps the published JSON manifest aligned with the typed runtime contract', () => {
    expect(manifestJson).toEqual(clientRuntimeManifest)
  })

  it('publishes the built-in themes in the runtime manifest', () => {
    expect(clientRuntimeManifest.themes).toEqual([
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
    ])
  })
})
