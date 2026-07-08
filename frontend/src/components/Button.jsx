function Button({ children, className = '', isLoading = false, type = 'button', variant = 'primary', ...props }) {
  return (
    <button className={`btn btn--${variant} ${className}`.trim()} disabled={isLoading || props.disabled} type={type} {...props}>
      {isLoading ? <span className="spinner spinner--button" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  )
}

export default Button
