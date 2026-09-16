import { useState, useEffect, useRef } from 'react'

// Google's map embed pulls a few hundred KiB of JS plus a stream of tile
// requests, and lays out its own DOM — Lighthouse reports it as forced reflows
// from maps.googleapis.com. Native `loading="lazy"` is not enough: Chrome's
// lazy-iframe distance threshold is generous, so a map far down the page still
// loads during the initial page load and competes with the LCP.
//
// Mount the iframe only once its placeholder approaches the viewport (200px
// margin, so the map is ready by the time it is scrolled to). A <noscript>
// copy keeps the map working for JS-less clients.
//
// NOTE: this only works inside a component that actually hydrates. The footer
// deliberately uses a plain link instead, because it ships no client JS.
export default function LazyMap({ src, title, className = '', style, allowFullScreen = false }) {
  const [show, setShow] = useState(false)
  const holderRef = useRef(null)

  useEffect(() => {
    if (show || !src) return
    const el = holderRef.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setShow(true)
      return
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setShow(true)
        io.disconnect()
      }
    }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [show, src])

  if (!src) return null

  const iframeProps = {
    src,
    title,
    className,
    style: { width: '100%', height: '100%', border: 0, ...style },
    loading: 'lazy',
    referrerPolicy: 'no-referrer-when-downgrade',
    ...(allowFullScreen ? { allowFullScreen: true } : {}),
  }

  return (
    <>
      {show
        ? <iframe {...iframeProps} />
        : (
          <div
            ref={holderRef}
            aria-hidden="true"
            className={className}
            style={{ width: '100%', height: '100%', minHeight: '1px', background: '#e2e8f0', ...style }}
          />
        )}
      <noscript>
        <iframe {...iframeProps} />
      </noscript>
    </>
  )
}
