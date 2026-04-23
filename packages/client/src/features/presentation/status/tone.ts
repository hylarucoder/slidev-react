import type { PresentationSyncStatus } from '../sync'

export function statusBadgeClassName(status: PresentationSyncStatus) {
  switch (status) {
    case 'connected':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'degraded':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'connecting':
      return 'border-green-200 bg-green-50 text-green-700'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700'
  }
}

export function statusDotClassName(status: PresentationSyncStatus) {
  switch (status) {
    case 'connected':
      return 'bg-emerald-400'
    case 'degraded':
      return 'bg-amber-400'
    case 'connecting':
      return 'bg-green-400'
    default:
      return 'bg-slate-400'
  }
}

export function statusLabelOf(status: PresentationSyncStatus): string {
  switch (status) {
    case 'connected':
      return 'Connected'
    case 'connecting':
      return 'Connecting'
    case 'degraded':
      return 'Degraded'
    default:
      return 'Disabled'
  }
}

export function formatSessionTimer(seconds: number) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  const restSeconds = String(seconds % 60).padStart(2, '0')
  return `${minutes}:${restSeconds}`
}
