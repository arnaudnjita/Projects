function ResponsiveImage({ alt, className = '', src, ...props }) {
  return <img alt={alt} className={`responsive-image ${className}`.trim()} loading="lazy" src={src} {...props} />
}

export default ResponsiveImage
