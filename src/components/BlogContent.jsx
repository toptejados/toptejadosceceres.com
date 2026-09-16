import { useState, useEffect, useRef, useMemo } from 'react'
import blogPageData from '../data/blogPage.json'
import { initialsAvatar } from './HomeContent.jsx'
import { optimizedImageUrl } from '../lib/site.js'
import { renderBlocks, headingsOf, slugifyHeading } from '../lib/blocks.jsx'

// Tailwind classes matching this page's existing inline-styled article body
// typography (font-size 15.5/#374151/line-height 1.8), used by the Blocks
// renderer so `content` articles look consistent with the legacy `sections`
// path below.
const ARTICLE_CLASSES = {
  paragraph: 'text-[15.5px] text-[#374151] leading-[1.8] mb-3',
  heading: 'text-[20px] font-bold text-[#0f172a] mb-3 leading-[1.3]',
  list: 'mb-3 pl-6 text-[15.5px] text-[#374151] leading-[1.8]',
  quote: 'border-l-4 border-[#e5421d] pl-4 italic text-[#374151] my-4',
  link: 'text-[#e5421d] underline hover:no-underline',
}

// Anchor ids for the sticky TOC must be unique and stable across re-renders —
// build them once from a post's heading text, disambiguating repeats.
function buildHeadingIds(content) {
  const seen = new Map()
  return headingsOf(content).map(text => {
    const base = slugifyHeading(text)
    const n = (seen.get(base) ?? 0) + 1
    seen.set(base, n)
    return n === 1 ? base : `${base}-${n}`
  })
}

// ─────────────────────────────────────────────────────────────
// RICH BLOG DATA (passed dynamically via props, falls back to JSON)
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// INLINE QUOTE FORM (light version for article bottom)
// ─────────────────────────────────────────────────────────────
function InlineQuoteForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState('idle')

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setStatus('loading')
    await new Promise(r => setTimeout(r, 1200))
    setStatus('success')
  }

  return (
    <div style={{
      background: '#f4f7f9',
      border: '1px solid #e2e8f0',
      borderRadius: 16,
      padding: '40px',
      display: 'grid',
      gridTemplateColumns: 'minmax(250px, 1fr) 1.5fr',
      gap: 40,
      alignItems: 'start',
      fontFamily: "'Inter', sans-serif"
    }} className="quote-form-grid">

      {/* Left Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Overlapping circular images — one composite webp, not 3 separate imgs */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/assets/blog-cta-circles.webp" width="279" height="105" alt="Trabajos de tejados, canalones y cubiertas" style={{ width: 210, height: 'auto' }} loading="lazy" />
        </div>

        {/* Heading */}
        <h3 style={{
          color: '#000',
          fontSize: 'clamp(24px, 3vw, 28px)',
          fontWeight: 600,
          margin: 0,
          lineHeight: 1.2,
          maxWidth: 280
        }}>
          {blogPageData.cta.title}
        </h3>
      </div>

      {/* Right Column: Form */}
      {status === 'success' ? (
        <div style={{ textAlign: 'center', padding: '40px 0', alignSelf: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
          <p style={{ color: '#16a34a', fontWeight: 600 }}>{blogPageData.cta.form.successMessage}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Row 1: Nombre & Correo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="quote-form-row">
            <label style={labelWrapperStyle}>
              <span style={labelTextItemStyle}>{blogPageData.cta.form.nameLabel} <span style={asteriskStyle}>*</span></span>
              <input required name="name" value={form.name} onChange={handleChange} placeholder="Tu Nombre" style={lightInputStyle} />
            </label>
            <label style={labelWrapperStyle}>
              <span style={labelTextItemStyle}>{blogPageData.cta.form.emailLabel} <span style={asteriskStyle}>*</span></span>
              <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="ejemplo@correo.com" style={lightInputStyle} />
            </label>
          </div>

          {/* Row 2: Teléfono */}
          <label style={labelWrapperStyle}>
            <span style={labelTextItemStyle}>{blogPageData.cta.form.phoneLabel} <span style={asteriskStyle}>*</span></span>
            <input required type="number" name="phone" value={form.phone} onChange={handleChange} placeholder="949 123 456" style={lightInputStyle} />
          </label>

          {/* Row 3: Mensaje */}
          <label style={labelWrapperStyle}>
            <span style={labelTextItemStyle}>{blogPageData.cta.form.messageLabel} <span style={asteriskStyle}>*</span></span>
            <textarea required name="message" value={form.message} onChange={handleChange} placeholder="Escribe tu mensaje aquí..." rows="4" style={{ ...lightInputStyle, resize: 'vertical' }} />
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              padding: '14px 0',
              background: '#0b1940',
              color: '#fff',
              fontWeight: 500,
              fontSize: 16,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              opacity: status === 'loading' ? 0.7 : 1,
              marginTop: 4
            }}
          >
            {status === 'loading' ? blogPageData.cta.form.sendingButton : blogPageData.cta.form.submitButton}
          </button>
        </form>
      )}

      {/* Mobile grid fix */}
      <style>{`
        @media (max-width: 640px) {
          .quote-form-grid {
            grid-template-columns: 1fr !important;
            padding: 24px !important;
          }
          .quote-form-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

const labelWrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8
}

const labelTextItemStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: '#333'
}

const asteriskStyle = {
  color: '#ef4444'
}

const lightInputStyle = {
  background: '#fff',
  border: '1px solid #cbd5e1',
  borderRadius: 4,
  padding: '12px 14px',
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 400,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: "'Inter', sans-serif"
}

// ─────────────────────────────────────────────────────────────
// TABLE OF CONTENTS (sticky sidebar)
// ─────────────────────────────────────────────────────────────
function TableOfContents({ sections, activeId }) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div style={{ position: 'sticky', top: 100 }}>
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', background: 'none', border: 'none', padding: '0 0 16px',
          color: '#1e293b', fontSize: 16, fontWeight: 500, cursor: 'pointer',
          fontFamily: "'Inter', sans-serif"
        }}
      >
        <span>{blogPageData.ui.tocLabel}</span>
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0 0 16px' }} />

      {isOpen && (
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sections.map((s, idx) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={e => {
                e.preventDefault()
                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              style={{
                display: 'flex',
                fontSize: 14,
                lineHeight: 1.4,
                color: activeId === s.id ? '#0f172a' : '#475569',
                fontWeight: activeId === s.id ? 600 : 400,
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              title={s.heading}
            >
              <span style={{ marginRight: 8, whiteSpace: 'nowrap' }}>{idx + 1}.</span>
              <span style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block'
              }}>
                {s.heading}
              </span>
            </a>
          ))}
        </nav>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// BLOG DETAIL VIEW
// ─────────────────────────────────────────────────────────────
function BlogDetail({ post, onBack }) {
  // New posts write `content` (Strapi Blocks, WordPress-like editor); old
  // un-migrated posts have no content and fall back to the legacy `sections`
  // rendering below — nothing published under the old flow breaks.
  const usingContent = Array.isArray(post.content) && post.content.length > 0
  const headingIds = useMemo(() => (usingContent ? buildHeadingIds(post.content) : []), [post, usingContent])
  const tocSections = useMemo(() => (
    usingContent
      ? headingsOf(post.content).map((heading, i) => ({ id: headingIds[i], heading }))
      : post.sections
  ), [post, usingContent, headingIds])

  const [activeId, setActiveId] = useState(tocSections[0]?.id || '')
  const [shareHover, setShareHover] = useState(null)
  const sectionRefs = useRef({})

  useEffect(() => {
    const observers = tocSections.map(s => {
      const el = document.getElementById(s.id)
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(s.id) },
        { rootMargin: '-20% 0px -70% 0px' }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [post])

  const shareLinks = [
    {
      id: 'fb', label: 'Facebook', url: 'https://www.facebook.com/toptejados/',
      color: '#1877F2',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
    },
    {
      id: 'ig', label: 'Instagram', url: 'https://www.instagram.com/toptejados/',
      color: '#E4405F',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
    },
    {
      id: 'tw', label: 'Twitter/X', url: 'https://x.com/toptejados',
      color: '#000',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
    },
    {
      id: 'yt', label: 'YouTube', url: 'https://www.youtube.com/@TopTejados',
      color: '#FF0000',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
    },
    {
      id: 'tk', label: 'TikTok', url: 'https://www.tiktok.com/@toptejados',
      color: '#000000',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
    }
  ]

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif", overflowX: 'hidden' }}>
      {/* Hero area */}
      <div style={{ paddingTop: 80 }}>

        {/* Back button + breadcrumb */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 0' }}>
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: '1px solid #e2e8f0',
              borderRadius: 20, padding: '6px 14px',
              color: '#64748b', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', marginBottom: 28
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {blogPageData.ui.backButton}
          </button>

          {/* Category tag */}
          {post.category && (
            <span style={{
              display: 'inline-block',
              background: 'var(--primary-color, #e5421d)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: 4,
              marginBottom: 16
            }}>
              {post.category}
            </span>
          )}

          {/* Tags */}
          {post.tags && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {post.tags.split(',').map(t => t.trim()).filter(Boolean).map((tag, i) => (
                <span key={i} style={{
                  display: 'inline-block',
                  background: '#f1f5f9',
                  color: '#475569',
                  fontSize: 11,
                  fontWeight: 500,
                  padding: '3px 9px',
                  borderRadius: 999
                }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(26px, 3.5vw, 40px)',
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.2,
            maxWidth: 820,
            marginBottom: 20
          }}>
            {post.title}
          </h1>

          {/* Author row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            <img width="100" height="100"
              src={optimizedImageUrl(post.authorAvatar) || initialsAvatar(post.authorName)}
              alt={post.authorName}
              style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} loading="lazy" />
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{post.authorName}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{post.authorRole}</p>
            </div>
            <span style={{ color: '#cbd5e1', margin: '0 4px' }}>·</span>
            <span style={{ fontSize: 13, color: '#64748b' }}>{post.date}</span>
            {post.readTime && (
              <>
                <span style={{ color: '#cbd5e1' }}>·</span>
                <span style={{ fontSize: 13, color: '#64748b' }}>{post.readTime} {blogPageData.ui.readTimeLabel}</span>
              </>
            )}
          </div>
        </div>

        {/* Hero image */}
        {post.coverImg && (
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 20px' }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '21/8', background: '#f1f5f9' }}>
              <img width="1200" height="675"
                src={optimizedImageUrl(post.coverImg, 1200)}
                alt={post.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
            </div>
          </div>
        )}

        {/* Share bar */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Síguenos</span>
            {shareLinks.map(s => (
              <a
                key={s.id}
                title={s.label}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => setShareHover(s.id)}
                onMouseLeave={() => setShareHover(null)}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 34, height: 34, borderRadius: '50%',
                  border: '1px solid #e2e8f0',
                  background: shareHover === s.id ? s.color : '#fff',
                  color: shareHover === s.id ? '#fff' : s.color,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: shareHover === s.id ? `0 4px 12px ${s.color}40` : 'none',
                  textDecoration: 'none'
                }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Content area: 2-column layout (Left Sidebar, Right Content) */}
      <div className="blog-detail-grid" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 40px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 60, alignItems: 'start' }}>

        {/* LEFT: Sidebar (sticky TOC) */}
        <aside className="blog-sidebar">
          <TableOfContents sections={tocSections} activeId={activeId} />
        </aside>

        {/* RIGHT: Article body */}
        <article style={{ minWidth: 0 }}>
          {usingContent ? (
            renderBlocks(post.content, {
              classNames: ARTICLE_CLASSES,
              headingId: (_text, i) => headingIds[i],
            })
          ) : post.sections.map((section, i) => (
            <div key={section.id}>
              <div
                id={section.id}
                style={{
                  scrollMarginTop: 110,
                  marginBottom: 36
                }}
              >
                <h2 style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: 14,
                  lineHeight: 1.3
                }}>
                  {section.heading}
                </h2>
                <div style={{ fontSize: 15.5, color: '#374151', lineHeight: 1.8 }}>
                  {section.body.trim().split('\n').map((line, li) => {
                    const trimmed = line.trim()
                    if (!trimmed) return null
                    const isListItem = /^\d+\./.test(trimmed)
                    if (isListItem) {
                      return (
                        <div key={li} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                          <span style={{
                            minWidth: 22, height: 22, borderRadius: '50%',
                            background: 'var(--primary-color, #e5421d)',
                            color: '#fff', fontSize: 11, fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            marginTop: 2, flexShrink: 0
                          }}>
                            {trimmed.match(/^(\d+)\./)?.[1]}
                          </span>
                          <span>{trimmed.replace(/^\d+\.\s*/, '')}</span>
                        </div>
                      )
                    }
                    return <p key={li} style={{ margin: '0 0 12px 0' }}>{trimmed}</p>
                  })}
                </div>
              </div>

              {/* Inline image after specific section */}
              {post.inlineImage?.afterSection === section.id && (
                <div style={{ marginBottom: 36, borderRadius: 12, overflow: 'hidden' }}>
                  <img width="1200" height="675"
                    src={post.inlineImage.src}
                    alt={post.inlineImage.alt}
                    style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }} loading="lazy" />
                </div>
              )}

              {/* Divider between sections */}
              {i < post.sections.length - 1 && (
                <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', marginBottom: 36 }} />
              )}
            </div>
          ))}
        </article>
      </div>

      {/* Full Width Quote Form */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 16px 80px' }}>
        <InlineQuoteForm />
      </div>

      {/* Mobile Styles */}
      <style>{`
        @media (max-width: 768px) {
          .blog-detail-grid {
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
          }
          .blog-sidebar {
            position: static !important;
            margin-bottom: 40px;
            max-width: 100% !important;
            overflow: hidden !important;
          }
          .blog-detail-grid article {
            max-width: 100% !important;
            overflow: hidden !important;
            word-break: break-word !important;
          }
        }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// BLOG LISTING VIEW
// ─────────────────────────────────────────────────────────────
const POSTS_PER_PAGE = 7

function BlogListing({ posts, onSelectPost }) {
  const [hoveredId, setHoveredId] = useState(null)
  const [page, setPage] = useState(1)

  // Get current site from environment
  const currentSite = String(import.meta.env.PUBLIC_SITE_SLUG || 'madrid').toLowerCase()

  // Filter posts to show only the ones belonging to the current site (or prefixed with site slug)
  const filteredPosts = posts.filter(p => p.site === currentSite || p.slug.startsWith(`${currentSite}-`))
  const allPosts = filteredPosts.length > 0 ? filteredPosts : posts

  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE)
  const postsToShow = allPosts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)

  const goToPage = (p) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div style={{
      background: '#f8fafc',
      minHeight: '100vh',
      padding: '120px 24px 80px',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <span style={{
            display: 'inline-block',
            background: 'var(--primary-color, #e5421d)',
            color: '#fff', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '4px 10px', borderRadius: 4, marginBottom: 14
          }}>{blogPageData.pageTag}</span>
          <h1 style={{
            fontSize: 'clamp(30px, 4vw, 42px)',
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.2,
            margin: 0
          }}>
            {blogPageData.pageTitle}
          </h1>
          <p style={{ color: '#64748b', fontSize: 16, marginTop: 12 }}>
            {blogPageData.pageSubtitle}
          </p>
        </div>

        {/* Nothing published yet. The Blog nav link is hidden in this case
            (see getMenu in lib/strapi.js), so this is only reached by a direct
            visit or a stale link — say so plainly rather than showing chrome
            around an empty grid. */}
        {postsToShow.length === 0 && (
          <div style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '56px 24px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#0f172a', fontSize: 18, fontWeight: 600, margin: 0 }}>
              {blogPageData.ui.emptyTitle}
            </p>
            <p style={{ color: '#64748b', fontSize: 15, marginTop: 8, marginBottom: 0 }}>
              {blogPageData.ui.emptyText}
            </p>
          </div>
        )}

        {/* Featured first post */}
        {postsToShow.length > 0 && (() => {
          const featured = postsToShow[0]
          return (
            <div
              onClick={() => onSelectPost(featured)}
              onMouseEnter={() => setHoveredId(`f-${featured.id}`)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: '#fff',
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                marginBottom: 28,
                boxShadow: hoveredId === `f-${featured.id}` ? '0 8px 30px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                transform: hoveredId === `f-${featured.id}` ? 'translateY(-2px)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              {featured.coverImg ? (
                <div style={{ height: 260, overflow: 'hidden', position: 'relative' }}>
                  <img width="1200" height="675"
                    src={optimizedImageUrl(featured.coverImg, 1200)}
                    alt={featured.title}
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      transform: hoveredId === `f-${featured.id}` ? 'scale(1.03)' : 'scale(1)',
                      transition: 'transform 0.6s ease'
                    }} loading="lazy" />
                  <div style={{
                    position: 'absolute', top: 14, left: 14,
                    background: 'var(--primary-color, #e5421d)',
                    color: '#fff', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '4px 10px', borderRadius: 4
                  }}>
                    {featured.category || blogPageData.ui.featuredLabel}
                  </div>
                </div>
              ) : null}
              <div style={{ padding: '28px 28px 24px' }}>
                {!featured.coverImg && (
                  <span style={{
                    display: 'inline-block',
                    background: 'var(--primary-color, #e5421d)',
                    color: '#fff', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '4px 10px', borderRadius: 4, marginBottom: 14
                  }}>
                    {featured.category || blogPageData.ui.featuredLabel}
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{featured.date}</span>
                  {featured.readTime && (
                    <>
                      <span style={{ color: '#cbd5e1' }}>·</span>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{featured.readTime} {blogPageData.ui.readTimeLabel}</span>
                    </>
                  )}
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 10px', lineHeight: 1.3 }}>
                  {featured.title}
                </h2>
                <p style={{ fontSize: 15, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                  {featured.excerpt}
                </p>
                <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img width="100" height="100" src={optimizedImageUrl(featured.authorAvatar) || initialsAvatar(featured.authorName)} alt={featured.authorName || 'Autor'} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} loading="lazy" />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>{featured.authorName}</span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Rest of posts in a grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {postsToShow.slice(1).map(post => (
            <div
              key={post.id}
              onClick={() => onSelectPost(post)}
              onMouseEnter={() => setHoveredId(post.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: hoveredId === post.id ? '0 8px 24px rgba(0,0,0,0.08)' : '0 2px 6px rgba(0,0,0,0.03)',
                transform: hoveredId === post.id ? 'translateY(-2px)' : 'none',
                transition: 'all 0.25s ease'
              }}
            >
              {post.coverImg ? (
                <div style={{ height: 160, overflow: 'hidden' }}>
                  <img width="1200" height="675"
                    src={optimizedImageUrl(post.coverImg, 1200)}
                    alt={post.title}
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                      transform: hoveredId === post.id ? 'scale(1.04)' : 'scale(1)',
                      transition: 'transform 0.5s ease'
                    }} loading="lazy" />
                </div>
              ) : null}
              <div style={{ padding: '18px 18px 16px' }}>
                {post.category && (
                  <span style={{
                    display: 'inline-block', fontSize: 10, fontWeight: 700,
                    color: 'var(--primary-color, #e5421d)', letterSpacing: '0.06em',
                    textTransform: 'uppercase', marginBottom: 8
                  }}>
                    {post.category}
                  </span>
                )}
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.35 }}>
                  {post.title}
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.excerpt}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{post.date}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: 'var(--primary-color, #e5421d)',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    {blogPageData.ui.readLabel}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination — only when more than POSTS_PER_PAGE posts */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 48, flexWrap: 'wrap' }}>
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              aria-label="Página anterior"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, borderRadius: 10,
                border: '1px solid #e2e8f0', background: '#fff',
                color: page === 1 ? '#cbd5e1' : '#0f172a',
                cursor: page === 1 ? 'default' : 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                aria-label={`Página ${p}`}
                aria-current={p === page ? 'page' : undefined}
                style={{
                  minWidth: 38, height: 38, borderRadius: 10, padding: '0 8px',
                  border: p === page ? '1px solid #0b1940' : '1px solid #e2e8f0',
                  background: p === page ? '#0b1940' : '#fff',
                  color: p === page ? '#fff' : '#334155',
                  fontSize: 14, fontWeight: p === page ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              aria-label="Página siguiente"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, borderRadius: 10,
                border: '1px solid #e2e8f0', background: '#fff',
                color: page === totalPages ? '#cbd5e1' : '#0f172a',
                cursor: page === totalPages ? 'default' : 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────
export default function BlogContent({ posts, initialSlug }) {
  // Never fall back to seeded articles. This used to read
  //   (posts && posts.length > 0) ? posts : blogPageData.posts
  // so a site whose last post was deleted in Strapi — or whose Strapi was simply
  // unreachable — silently published six demo articles, identical across every
  // site cloned from this template, each on a real indexable URL.
  const blogPosts = posts ?? [];

  // Resolve the initial post synchronously so SSR + first paint show the
  // right article (no listing flash with another post's image).
  const findBySlug = (slug) => {
    if (!slug) return null
    const currentSite = String(import.meta.env.PUBLIC_SITE_SLUG || 'madrid').toLowerCase()
    return blogPosts.find(p =>
      p.slug === slug ||
      p.slug === `${currentSite}-${slug}` ||
      (p.slug || '').replace(`${currentSite}-`, '') === slug
    ) || null
  }

  const [selectedPost, setSelectedPost] = useState(() => findBySlug(initialSlug))

  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search)
      const slug = params.get('post') || initialSlug
      const currentSite = String(import.meta.env.PUBLIC_SITE_SLUG || 'madrid').toLowerCase()

      if (slug) {
        // Resolve prefixed slugs or plain slugs dynamically
        const found = blogPosts.find(p =>
          p.slug === slug ||
          p.slug === `${currentSite}-${slug}` ||
          p.slug.replace(`${currentSite}-`, '') === slug
        )
        setSelectedPost(found || null)
      } else {
        setSelectedPost(null)
      }
    }
    window.addEventListener('popstate', onPop)
    onPop()
    return () => window.removeEventListener('popstate', onPop)
  }, [blogPosts, initialSlug])

  const handleSelectPost = (post) => {
    const currentSite = String(import.meta.env.PUBLIC_SITE_SLUG || 'madrid').toLowerCase()
    const cleanSlug = post.slug.replace(`${currentSite}-`, '')
    window.location.href = `/blog/${cleanSlug}`
  }

  const handleBack = () => {
    window.location.href = '/blog'
  }

  if (selectedPost) {
    return <BlogDetail post={selectedPost} onBack={handleBack} />
  }

  return <BlogListing posts={blogPosts} onSelectPost={handleSelectPost} />
}
