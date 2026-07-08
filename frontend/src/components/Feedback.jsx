import { AlertCircle, CheckCircle2, Loader2, Search } from 'lucide-react'

import Button from './Button'

export function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function Card({ children, className = '' }) {
  return <article className={`card ${className}`.trim()}>{children}</article>
}

export function Spinner({ label = 'Loading' }) {
  return (
    <span className="spinner-wrap" role="status">
      <Loader2 className="spinner" size={22} aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}

export function Skeleton({ lines = 3 }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <span className="skeleton__line" key={index} />
      ))}
    </div>
  )
}

export function EmptyState({ action, message, title }) {
  return (
    <section className="state-box">
      <Search size={28} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{message}</p>
      {action}
    </section>
  )
}

export function ErrorState({ message, onRetry, title = 'Something went wrong' }) {
  return (
    <section className="state-box state-box--error" role="alert">
      <AlertCircle size={28} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry ? <Button onClick={onRetry}>Try again</Button> : null}
    </section>
  )
}

export function ToastRegion({ toasts = [] }) {
  return (
    <div className="toast-region" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <div className={`toast toast--${toast.tone || 'success'}`} key={toast.id}>
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
