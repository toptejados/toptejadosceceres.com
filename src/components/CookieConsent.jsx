import { useState, useEffect } from 'react'

const CONSENT_KEY = 'cookie-consent-v1'
const CONSENT_EXPIRY_DAYS = 365

function inlineScript(html) {
  const s = document.createElement('script')
  s.textContent = html
  document.head.appendChild(s)
}

function loadTracking(prefs, tracking) {
  if (!tracking) return

  const analytics = prefs === 'all' || prefs?.analytics
  const marketing = prefs === 'all' || prefs?.marketing

  // GA4/GTM load unconditionally in BaseLayout <head> (Consent Mode v2,
  // default 'denied') so tag-checker tools detect the install on first
  // page load. Accept/decline here only flips consent state via gtag(),
  // it does not (re)inject the container scripts.
  if (window.gtag) {
    if (analytics) window.gtag('consent', 'update', { analytics_storage: 'granted' })
    if (marketing) window.gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' })
  }

  if (analytics) {
    // Microsoft Clarity
    if (tracking.microsoftClarity) {
      inlineScript(`
        (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window,document,"clarity","script","${tracking.microsoftClarity}");
      `)
    }
  }

  if (marketing) {
    // Facebook Pixel
    if (tracking.facebookPixel) {
      inlineScript(`
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
        document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init','${tracking.facebookPixel}');fbq('track','PageView');
      `)
    }
  }
}

function saveConsent(value) {
  const expires = new Date()
  expires.setDate(expires.getDate() + CONSENT_EXPIRY_DAYS)
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ value, expires: expires.toISOString() }))
}

function loadConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const { value, expires } = JSON.parse(raw)
    if (new Date(expires) < new Date()) { localStorage.removeItem(CONSENT_KEY); return null }
    return value
  } catch { return null }
}

export default function CookieConsent({ tracking }) {
  const [status, setStatus] = useState(null) // null=init, 'pending', 'done'

  useEffect(() => {
    const saved = loadConsent()
    if (saved) {
      loadTracking(saved, tracking)
      setStatus('done')
    } else {
      setStatus('pending')
    }
  }, [])

  function accept() {
    saveConsent('all')
    loadTracking('all', tracking)
    setStatus('done')
  }

  function decline() {
    saveConsent('none')
    setStatus('done')
  }

  // ✕ just hides for this visit — no choice stored, banner returns next load
  function dismiss() {
    setStatus('done')
  }

  if (status !== 'pending') return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        right: 20,
        zIndex: 9999,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 430,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          padding: '22px 24px 20px',
          pointerEvents: 'all',
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontWeight: 700, fontSize: 18, color: '#11181C', margin: 0 }}>
            Política de Cookies
          </p>
          <button
            onClick={dismiss}
            aria-label="Cerrar"
            style={{
              width: 26, height: 26, borderRadius: '50%',
              border: '1.5px solid #11181C', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#11181C', flexShrink: 0, padding: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Text */}
        <p style={{ fontSize: 13.5, color: '#475569', margin: '0 0 18px', lineHeight: 1.55 }}>
          Nuestro sitio web utiliza cookies para mejorar tu experiencia de navegación. Al usar nuestro sitio, aceptas el uso de cookies.{' '}
          <a href="/politica-de-cookies" aria-label="Leer la política de cookies" title="Leer la política de cookies" style={{ color: '#24274D', fontWeight: 600, textDecoration: 'underline' }}>
            Leer la política de cookies
          </a>
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button
            onClick={decline}
            style={{
              padding: '11px 18px', borderRadius: 8,
              fontSize: 12.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
              border: 'none', background: 'transparent', color: '#24274D',
              cursor: 'pointer', lineHeight: 1,
            }}
          >
            Rechazar
          </button>
          <button
            onClick={accept}
            style={{
              padding: '12px 22px', borderRadius: 8,
              fontSize: 12.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
              border: 'none', background: '#24274D', color: '#fff',
              cursor: 'pointer', lineHeight: 1,
            }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
