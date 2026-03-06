import type { CSSProperties, ReactNode } from 'react'

type CoverColor = 'green' | 'purple' | 'blue' | 'orange'

const colorTokenMap: Record<CoverColor, string> = {
  green: '#22C55E',
  purple: '#A855F7',
  blue: '#3B82F6',
  orange: '#F97316',
}

export function CourseCover({
  color = 'blue',
  lesson,
  total = '10',
  series,
  title,
  subtitle,
  author,
  children,
}: {
  color?: CoverColor
  lesson?: string
  total?: string
  series?: string
  title?: string
  subtitle?: string
  author?: string
  children?: ReactNode
}) {
  const accent = colorTokenMap[color]
  const displayLesson = lesson ?? '00'
  const style = { '--cc-accent': accent } as CSSProperties

  return (
    <section className="course-cover" style={style}>
      <div className="noise-layer" />
      <div className="lesson-number">{displayLesson}</div>

      <div className="decor-circle circle-1" />
      <div className="decor-circle circle-2" />
      <div className="decor-circle circle-3" />
      <div className="glow-bottom" />

      <header className="cover-header">
        {lesson
          ? (
              <div className="progress-badge">
                <span className="badge-current">{lesson}</span>
                <span className="badge-divider">/</span>
                <span className="badge-total">{total}</span>
              </div>
            )
          : null}
      </header>

      <div className="cover-content">
        {title ? <h1>{title}</h1> : null}
        {subtitle ? <p className="cover-subtitle">{subtitle}</p> : null}
        {children}
      </div>

      <footer className="cover-footer">
        {series
          ? <div className="series-name">{series}</div>
          : <div className="spacer" />}

        {author
          ? (
              <div className="author-info">
                <span className="author-label">讲师</span>
                <span className="author-name">{author}</span>
              </div>
            )
          : null}
      </footer>
    </section>
  )
}
