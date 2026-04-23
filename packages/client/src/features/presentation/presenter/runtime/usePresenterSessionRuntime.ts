import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { DrawStroke } from "../../draw/DrawProvider"
import { usePresentationSyncRuntime } from "../../sync"
import { useRecorderRuntime } from "../../recording/useRecorderRuntime"
import type {
  PresentationCursorState,
  PresentationSharedState,
} from "../../types"
import type { PresentationSession } from "../../session"
import { buildPresentationSharedState, mapRemotePresentationPatch } from "../model/presentationSyncBridge"
import type { CompiledSlide } from "../model/types"
import type { PresenterFlowRuntime } from "./usePresenterFlowRuntime"

export interface PresenterSessionState {
  followPresenter: boolean
  localCursor: PresentationCursorState | null
  remoteCursor: PresentationCursorState | null
  remotePageIndex: number | null
  localTimer: number
  remoteTimer: number
  drawings: Record<string, DrawStroke[]>
  remoteDrawings: {
    revision: number
    strokesBySlideId: Record<string, DrawStroke[]>
  } | null
  sync: ReturnType<typeof usePresentationSyncRuntime>
  recorder: ReturnType<typeof useRecorderRuntime>
  onStrokesChange: (nextStrokes: Record<string, DrawStroke[]>) => void
  setLocalCursor: (cursor: PresentationCursorState | null) => void
  setRemoteCursor: (cursor: PresentationCursorState | null) => void
  detachFromPresenter: () => void
}

export function usePresenterSessionRuntime({
  slides,
  session,
  navigation,
  flow,
  canControl,
  slidesExportFilename,
  slidesTitle,
}: {
  slides: CompiledSlide[]
  session: PresentationSession
  navigation: { currentIndex: number; total: number; goTo: (index: number) => void }
  flow: PresenterFlowRuntime
  canControl: boolean
  slidesExportFilename?: string
  slidesTitle?: string
}): PresenterSessionState {
  const [followPresenter, setFollowPresenter] = useState(session.role === "viewer")
  const [localCursor, setLocalCursor] = useState<PresentationCursorState | null>(null)
  const [remoteCursor, setRemoteCursor] = useState<PresentationCursorState | null>(null)
  const [remotePageIndex, setRemotePageIndex] = useState<number | null>(null)
  const [localTimer, setLocalTimer] = useState(0)
  const [remoteTimer, setRemoteTimer] = useState(0)
  const [drawings, setDrawings] = useState<Record<string, DrawStroke[]>>({})
  const [drawingsRevision, setDrawingsRevision] = useState(0)
  const [remoteDrawings, setRemoteDrawings] = useState<{
    revision: number
    strokesBySlideId: Record<string, DrawStroke[]>
  } | null>(null)
  const drawingsSyncFrameRef = useRef<number | null>(null)
  const currentIndexRef = useRef(navigation.currentIndex)

  useEffect(() => {
    currentIndexRef.current = navigation.currentIndex
  }, [navigation.currentIndex])

  useEffect(() => {
    setFollowPresenter(session.role === "viewer")
  }, [session.role, session.sessionId])

  useEffect(() => {
    setRemotePageIndex(navigation.currentIndex)
  }, [session.role, session.sessionId])

  const scheduleDrawingsSync = useCallback(() => {
    if (drawingsSyncFrameRef.current !== null) return

    drawingsSyncFrameRef.current = window.requestAnimationFrame(() => {
      drawingsSyncFrameRef.current = null
      setDrawingsRevision((revision) => revision + 1)
    })
  }, [])

  const onStrokesChange = useCallback(
    (nextStrokes: Record<string, DrawStroke[]>) => {
      setDrawings(nextStrokes)

      if (!canControl) return

      scheduleDrawingsSync()
    },
    [canControl, scheduleDrawingsSync],
  )

  const localSharedState = useMemo<PresentationSharedState>(
    () =>
      buildPresentationSharedState({
        page: navigation.currentIndex,
        step: flow.currentStep,
        stepTotal: flow.currentStepTotal,
        timer: localTimer,
        cursor: localCursor,
        drawings,
        drawingsRevision,
      }),
    [
      flow.currentStep,
      flow.currentStepTotal,
      drawings,
      drawingsRevision,
      localCursor,
      localTimer,
      navigation.currentIndex,
    ],
  )

  const sync = usePresentationSyncRuntime({
    session,
    currentIndex: navigation.currentIndex,
    total: navigation.total,
    goTo: navigation.goTo,
    followRemotePage: followPresenter,
    localState: localSharedState,
    onRemoteState: (patch, remotePage) => {
      setRemotePageIndex(remotePage)
      const effects = mapRemotePresentationPatch({
        patch,
        remotePage,
        currentPage: currentIndexRef.current,
        resolveSlideId: (index) => slides[index]?.id ?? null,
      })

      if (typeof effects.remoteTimer === "number") setRemoteTimer(effects.remoteTimer)

      if ("remoteCursor" in effects) setRemoteCursor(effects.remoteCursor ?? null)

      if (effects.slideStepTotal)
        flow.setSlideStepTotal(
          effects.slideStepTotal.slideId,
          effects.slideStepTotal.stepTotal,
        )

      if (effects.slideStep)
        flow.setSlideStep(effects.slideStep.slideId, effects.slideStep.step)

      if (effects.remoteDrawings) setRemoteDrawings(effects.remoteDrawings)
    },
  })

  const recorder = useRecorderRuntime({
    enabled: canControl,
    exportFilename: slidesExportFilename,
    slidesTitle,
  })

  const detachFromPresenter = useCallback(() => {
    if (session.role !== "viewer") return

    setFollowPresenter(false)
  }, [session.role])

  // Timer effect
  useEffect(() => {
    if (!canControl) {
      setLocalTimer(0)
      return
    }

    const startedAt = Date.now()
    setLocalTimer(0)
    const intervalId = window.setInterval(() => {
      setLocalTimer(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [canControl, session.sessionId])

  // Reset state on role change
  useEffect(() => {
    if (canControl) {
      setRemoteCursor(null)
      setRemoteTimer(0)
      setRemoteDrawings(null)
    } else {
      setLocalCursor(null)
    }
  }, [canControl])

  // Clear remote cursor when page changes
  useEffect(() => {
    if (remotePageIndex === navigation.currentIndex) return

    setRemoteCursor(null)
  }, [navigation.currentIndex, remotePageIndex])

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      if (drawingsSyncFrameRef.current !== null)
        window.cancelAnimationFrame(drawingsSyncFrameRef.current)
    }
  }, [])

  return {
    followPresenter,
    localCursor,
    remoteCursor,
    remotePageIndex,
    localTimer,
    remoteTimer,
    drawings,
    remoteDrawings,
    sync,
    recorder,
    onStrokesChange,
    setLocalCursor,
    setRemoteCursor,
    detachFromPresenter,
  }
}
