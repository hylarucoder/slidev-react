import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, renderHook } from 'vitest-browser-react'
import type { PresentationSession } from '../../../session'
import type { PresentationSharedState } from '../../../types'
import { createEnvelope } from '../../model/replication'
import type { UsePresentationSyncOptions } from '../../types'
import { usePresentationSyncRuntime } from '../usePresentationSyncRuntime'

class FakeBroadcastChannel {
  static channels = new Map<string, Set<FakeBroadcastChannel>>()
  static messages: Array<{ channelName: string; data: unknown }> = []

  readonly channelName: string
  readonly listeners = new Set<(event: MessageEvent<unknown>) => void>()

  constructor(channelName: string) {
    this.channelName = channelName
    const channels =
      FakeBroadcastChannel.channels.get(channelName) ?? new Set<FakeBroadcastChannel>()
    channels.add(this)
    FakeBroadcastChannel.channels.set(channelName, channels)
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    if (type !== 'message' || typeof listener !== 'function') return
    this.listeners.add(listener as (event: MessageEvent<unknown>) => void)
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ) {
    if (type !== 'message' || typeof listener !== 'function') return
    this.listeners.delete(listener as (event: MessageEvent<unknown>) => void)
  }

  postMessage(data: unknown) {
    FakeBroadcastChannel.messages.push({
      channelName: this.channelName,
      data,
    })

    const listeners = FakeBroadcastChannel.channels.get(this.channelName)
    if (!listeners) return

    for (const channel of listeners) {
      for (const listener of channel.listeners) {
        listener({ data } as MessageEvent<unknown>)
      }
    }
  }

  close() {
    const listeners = FakeBroadcastChannel.channels.get(this.channelName)
    if (!listeners) return

    listeners.delete(this)
    if (listeners.size === 0) {
      FakeBroadcastChannel.channels.delete(this.channelName)
    }
  }

  static reset() {
    FakeBroadcastChannel.channels.clear()
    FakeBroadcastChannel.messages = []
  }
}

const originalBroadcastChannel = globalThis.BroadcastChannel

function createLocalState(
  overrides: Partial<PresentationSharedState> = {},
): PresentationSharedState {
  return {
    page: 0,
    cue: 0,
    cueTotal: 0,
    timer: 0,
    cursor: null,
    drawings: {},
    drawingsRevision: 0,
    lastUpdate: 0,
    ...overrides,
  }
}

function createSession(
  overrides: Partial<PresentationSession> = {},
): PresentationSession {
  return {
    enabled: true,
    role: 'presenter',
    syncMode: 'send',
    sessionId: 'deck-default',
    senderId: 'sender-1',
    wsUrl: null,
    presenterUrl: null,
    viewerUrl: null,
    ...overrides,
  }
}

function createOptions(
  overrides: Partial<UsePresentationSyncOptions> = {},
): UsePresentationSyncOptions {
  return {
    session: createSession(),
    currentIndex: 0,
    total: 10,
    goTo: vi.fn(),
    followRemotePage: true,
    localState: createLocalState(),
    onRemoteState: vi.fn(),
    ...overrides,
  }
}

function messagesFor(sessionId: string) {
  return FakeBroadcastChannel.messages
    .filter(
      (entry) =>
        entry.channelName === `slide-react:presentation:session:${sessionId}`,
    )
    .map((entry) => entry.data)
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-03-16T08:00:00.000Z'))
  FakeBroadcastChannel.reset()
  globalThis.BroadcastChannel =
    FakeBroadcastChannel as unknown as typeof BroadcastChannel
})

afterEach(async () => {
  await cleanup()
  FakeBroadcastChannel.reset()
  globalThis.BroadcastChannel = originalBroadcastChannel
  vi.useRealTimers()
})

describe('usePresentationSyncRuntime', () => {
  it('does not create transports for disabled standalone sessions', async () => {
    const sync = await renderHook(
      (props: UsePresentationSyncOptions) => usePresentationSyncRuntime(props),
      {
        initialProps: createOptions({
          session: createSession({
            enabled: false,
            role: 'standalone',
            syncMode: 'off',
            sessionId: null,
          }),
        }),
      },
    )

    expect(sync.result.current).toMatchObject({
      status: 'disabled',
      broadcastConnected: false,
      wsConnected: false,
      peerCount: 0,
      remoteActive: true,
    })
    expect(FakeBroadcastChannel.channels.size).toBe(0)
    expect(FakeBroadcastChannel.messages).toHaveLength(0)
  })

  it('sends join and snapshot envelopes in presenter send mode', async () => {
    await renderHook((props: UsePresentationSyncOptions) => usePresentationSyncRuntime(props), {
      initialProps: createOptions({
        session: createSession({
          sessionId: 'sync-room',
          senderId: 'presenter-1',
        }),
      }),
    })

    const messageTypes = messagesFor('sync-room').map((message) => {
      return (message as { type: string }).type
    })

    expect(messageTypes).toContain('session/join')
    expect(messageTypes).toContain('state/snapshot')
  })

  it('updates viewer state, sync metadata, and remote navigation on incoming patches', async () => {
    const goTo = vi.fn()
    const onRemoteState = vi.fn()

    const viewer = await renderHook(
      (props: UsePresentationSyncOptions) => usePresentationSyncRuntime(props),
      {
        initialProps: createOptions({
          session: createSession({
            role: 'viewer',
            syncMode: 'receive',
            sessionId: 'shared-room',
            senderId: 'viewer-1',
          }),
          goTo,
          onRemoteState,
        }),
      },
    )

    const presenter = await renderHook(
      (props: UsePresentationSyncOptions) => usePresentationSyncRuntime(props),
      {
        initialProps: createOptions({
          session: createSession({
            role: 'presenter',
            syncMode: 'send',
            sessionId: 'shared-room',
            senderId: 'presenter-1',
          }),
          localState: createLocalState({
            page: 2,
            cue: 1,
            cueTotal: 3,
            timer: 9,
          }),
        }),
      },
    )

    expect(viewer.result.current).toMatchObject({
      peerCount: 1,
      remoteActive: true,
    })
    expect(viewer.result.current.lastSyncedAt).not.toBeNull()
    expect(onRemoteState).toHaveBeenCalled()
    expect(goTo).toHaveBeenCalledWith(2)

    await presenter.act(() => {
      vi.advanceTimersByTime(1)
    })

    await presenter.rerender(
      createOptions({
        session: createSession({
          role: 'presenter',
          syncMode: 'send',
          sessionId: 'shared-room',
          senderId: 'presenter-1',
        }),
        localState: createLocalState({
          page: 4,
          cue: 2,
          cueTotal: 3,
          timer: 12,
        }),
      }),
    )

    expect(viewer.result.current.lastSyncedAt).not.toBeNull()
    expect(onRemoteState).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 4,
      }),
      4,
    )
    expect(goTo).toHaveBeenCalledWith(4)
  })

  it('does not follow remote pages when followRemotePage is disabled', async () => {
    const goTo = vi.fn()

    await renderHook((props: UsePresentationSyncOptions) => usePresentationSyncRuntime(props), {
      initialProps: createOptions({
        session: createSession({
          role: 'viewer',
          syncMode: 'receive',
          sessionId: 'no-follow-room',
          senderId: 'viewer-1',
        }),
        goTo,
        followRemotePage: false,
      }),
    })

    await renderHook((props: UsePresentationSyncOptions) => usePresentationSyncRuntime(props), {
      initialProps: createOptions({
        session: createSession({
          role: 'presenter',
          syncMode: 'send',
          sessionId: 'no-follow-room',
          senderId: 'presenter-1',
        }),
        localState: createLocalState({
          page: 3,
        }),
      }),
    })

    expect(goTo).not.toHaveBeenCalled()
  })

  it('batches cursor patches and only sends the latest cursor position', async () => {
    const onRemoteState = vi.fn()

    await renderHook(
      (props: UsePresentationSyncOptions) => usePresentationSyncRuntime(props),
      {
        initialProps: createOptions({
          session: createSession({
            role: 'viewer',
            syncMode: 'receive',
            sessionId: 'cursor-room',
            senderId: 'viewer-1',
          }),
          onRemoteState,
        }),
      },
    )

    const session = createSession({
      role: 'presenter',
      syncMode: 'send',
      sessionId: 'cursor-room',
      senderId: 'presenter-1',
    })

    const presenter = await renderHook(
      (props: UsePresentationSyncOptions) => usePresentationSyncRuntime(props),
      {
        initialProps: createOptions({
          session,
          localState: createLocalState(),
        }),
      },
    )

    onRemoteState.mockClear()

    await presenter.rerender(
      createOptions({
        session,
        localState: createLocalState({
          cursor: { x: 10, y: 20 },
        }),
      }),
    )
    await presenter.rerender(
      createOptions({
        session,
        localState: createLocalState({
          cursor: { x: 30, y: 40 },
        }),
      }),
    )

    await presenter.act(() => {
      vi.advanceTimersByTime(79)
    })

    expect(onRemoteState).not.toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { x: 30, y: 40 },
      }),
      expect.any(Number),
    )

    await presenter.act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(onRemoteState).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { x: 30, y: 40 },
      }),
      0,
    )
  })

  it('removes stale peers during presence sweeps', async () => {
    const viewer = await renderHook(
      (props: UsePresentationSyncOptions) => usePresentationSyncRuntime(props),
      {
        initialProps: createOptions({
          session: createSession({
            role: 'viewer',
            syncMode: 'receive',
            sessionId: 'stale-room',
            senderId: 'viewer-1',
          }),
        }),
      },
    )

    const ghostPeer = new FakeBroadcastChannel(
      'slide-react:presentation:session:stale-room',
    )

    await viewer.act(() => {
      ghostPeer.postMessage(
        createEnvelope({
          sessionId: 'stale-room',
          senderId: 'ghost-1',
          seq: 1,
          timestamp: Date.now(),
          message: {
            type: 'session/join',
            payload: {
              role: 'presenter',
            },
          },
        }),
      )
    })

    expect(viewer.result.current.peerCount).toBe(1)

    await viewer.act(() => {
      vi.advanceTimersByTime(16000)
    })

    expect(viewer.result.current.peerCount).toBe(0)
    ghostPeer.close()
  })
})
