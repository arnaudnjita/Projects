import { Eye, EyeOff } from 'lucide-react'
import { cloneElement, useId, useState } from 'react'

export function FormField({ children, error, helperText, label, required }) {
  const id = useId()

  return (
    <label className="form-field" htmlFor={children.props.id || id}>
      <span className="form-field__label">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      {children.props.id ? children : cloneElement(children, { id })}
      {helperText && !error ? <span className="form-field__helper">{helperText}</span> : null}
      {error ? <span className="form-field__error">{error}</span> : null}
    </label>
  )
}

export function TextInput({ className = '', ...props }) {
  return <input className={`control ${className}`.trim()} type="text" {...props} />
}

export function PasswordInput({ className = '', ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <span className="password-control">
      <input className={`control password-control__input ${className}`.trim()} type={visible ? 'text' : 'password'} {...props} />
      <button
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="password-control__toggle"
        onClick={() => setVisible((value) => !value)}
        type="button"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </span>
  )
}

export function Select({ children, className = '', ...props }) {
  return (
    <select className={`control control--select ${className}`.trim()} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className = '', rows = 4, ...props }) {
  return <textarea className={`control control--textarea ${className}`.trim()} rows={rows} {...props} />
}
