import type { PropsWithChildren, ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <header className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  )
}

export function Panel({
  title,
  children,
  className = '',
}: PropsWithChildren<{ title?: string; className?: string }>) {
  return (
    <section className={`panel ${className}`}>
      {title && <h2 className="panel-title">{title}</h2>}
      {children}
    </section>
  )
}

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.replaceAll('_', '-')
  return <span className={`status status--${normalized}`}>{value.replaceAll('_', ' ')}</span>
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  )
}

export function InlineError({ message }: { message: string }) {
  return (
    <div className="inline-error" role="alert">
      {message}
    </div>
  )
}

