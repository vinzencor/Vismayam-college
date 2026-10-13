import { useState } from 'react'

// Image with lazy loading and a soft gradient fallback if the source fails.
export function Img({ src, alt = '', className = '', eager = false, ...props }) {
  const [failed, setFailed] = useState(false)

  if (failed || !src) {
    return <div className={`img-fallback ${className}`} role={alt ? 'img' : undefined} aria-label={alt || undefined} />
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      {...props}
    />
  )
}
