import { Wifi, WifiOff } from 'lucide-react'
import { ChromeTag } from '../../../../ui/primitives/ChromeTag'
import type { PresentationSession } from '../../session'
import type { PresentationSyncStatus, UsePresentationSyncResult } from '../../sync'

export interface SessionInfoRowProps {
  session: PresentationSession
  sync: UsePresentationSyncResult
  syncStatus: PresentationSyncStatus
}

export function SessionInfoRow({ session, sync }: SessionInfoRowProps) {
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <ChromeTag tone="muted" size="md" className="py-2 text-xs">
          {sync.broadcastConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {sync.broadcastConnected ? 'Broadcast connected' : 'Broadcast unavailable'}
        </ChromeTag>
        <ChromeTag tone="muted" size="md" className="py-2 text-xs">
          ws: {sync.wsConnected ? 'connected' : 'idle'}
        </ChromeTag>
        <ChromeTag tone="muted" size="md" className="py-2 text-xs tabular-nums">
          peers: {sync.peerCount}
        </ChromeTag>
        <ChromeTag
          tone={sync.remoteActive ? 'success' : 'warning'}
          size="md"
          className="py-2 text-xs"
        >
          remote: {sync.remoteActive ? 'active' : 'stale'}
        </ChromeTag>
        <ChromeTag tone="muted" size="md" className="py-2 text-xs">
          role: {session.role}
        </ChromeTag>
        <ChromeTag tone="muted" size="md" className="py-2 font-mono text-[11px]">
          {session.sessionId}
        </ChromeTag>
      </div>
      {sync.lastSyncedAt && (
        <p className="mt-3 text-right text-[11px] text-slate-500">
          last sync {new Date(sync.lastSyncedAt).toLocaleTimeString()}
        </p>
      )}
    </>
  )
}
