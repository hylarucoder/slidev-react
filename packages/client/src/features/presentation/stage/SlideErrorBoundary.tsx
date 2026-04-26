import { Component, type ReactNode } from 'react'

function resolveSlideLabel(slideId: string, title?: string) {
  const normalizedTitle = title?.trim()

  return normalizedTitle && normalizedTitle.length > 0 ? normalizedTitle : slideId
}

function resolveErrorMessage(error: Error) {
  const normalizedMessage = error.message.trim()

  return normalizedMessage.length > 0 ? normalizedMessage : error.name
}

function SlideErrorFallback({
  slideId,
  title,
  error,
  compact = false,
}: {
  slideId: string
  title?: string
  error: Error
  compact?: boolean
}) {
  const slideLabel = resolveSlideLabel(slideId, title)

  return (
    <section
      role='alert'
      data-slide-error-boundary='true'
      className={`flex size-full items-center justify-center ${compact ? 'p-3' : 'p-6'}`}
    >
      <div
        className={`w-full rounded-2xl border border-rose-300 bg-rose-50/95 text-rose-950 shadow-[0_12px_30px_rgba(190,24,93,0.12)] ${
          compact ? 'max-w-full p-3' : 'max-w-3xl p-5'
        }`}
      >
        <p className='text-[11px] font-semibold tracking-[0.18em] text-rose-700 uppercase'>
          Slide Render Error
        </p>
        <h2 className={`mt-2 font-semibold ${compact ? 'text-sm' : 'text-lg'}`}>{slideLabel}</h2>
        <p className={`mt-2 text-rose-900/80 ${compact ? 'text-xs' : 'text-sm'}`}>
          This problem is isolated to the current slide.
        </p>
        <pre
          className={`mt-3 overflow-auto rounded-xl bg-rose-950 px-3 py-2 font-mono text-rose-50 ${
            compact ? 'text-[11px] leading-4' : 'text-xs leading-5'
          }`}
        >
          {resolveErrorMessage(error)}
        </pre>
      </div>
    </section>
  )
}

interface SlideErrorBoundaryProps {
  children: ReactNode
  resetKey: string
  slideId: string
  title?: string
  compact?: boolean
}

interface SlideErrorBoundaryState {
  error: Error | null
}

export class SlideErrorBoundary extends Component<
  SlideErrorBoundaryProps,
  SlideErrorBoundaryState
> {
  state: SlideErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: Error): SlideErrorBoundaryState {
    return { error }
  }

  componentDidUpdate(prevProps: SlideErrorBoundaryProps) {
    if (prevProps.resetKey === this.props.resetKey || !this.state.error) return

    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <SlideErrorFallback
          slideId={this.props.slideId}
          title={this.props.title}
          error={this.state.error}
          compact={this.props.compact}
        />
      )
    }

    return this.props.children
  }
}
