function Button({ as: Component = 'button', children, className = '', isLoading = false, type = 'button', variant = 'primary', ...props }) {
  const buttonProps = Component === 'button' ? { disabled: isLoading || props.disabled, type } : {}

  return (
    <Component className={`btn btn--${variant} ${className}`.trim()} {...buttonProps} {...props}>
      {isLoading ? <span className="spinner spinner--button" aria-hidden="true" /> : null}
      <span>{children}</span>
    </Component>
  )
}

export default Button
