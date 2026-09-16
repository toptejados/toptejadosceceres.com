import { useState, useRef, useEffect, Fragment } from 'react'
import { marked } from 'marked'
import { optimizedImageUrl, autoAlt, withSite, titleCasePlace } from '../lib/site.js'
import LazyMap from './LazyMap.jsx'

// Phosphor Icons (regular weight, outline) — sourced from /public/assets/icons/*.svg
const ICON_ELEMENTS = {
  shield: <path d="M216,112V56a8,8,0,0,0-8-8H48a8,8,0,0,0-8,8v56c0,96,88,120,88,120S216,208,216,112Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />,
  leaf: <>
    <path d="M63.81,192.19c-47.89-79.81,16-159.62,151.64-151.64C223.43,176.23,143.62,240.08,63.81,192.19Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="160" y1="96" x2="40" y2="216" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
  </>,
  wrench: <path d="M104,126.94a64,64,0,0,1,80-90.29L144,80l5.66,26.34L176,112l43.35-40a64,64,0,0,1-90.29,80L73,217A24,24,0,0,1,39,183Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />,
  umbrella: <>
    <path d="M176,200a24,24,0,0,1-48,0V136" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <path d="M32,136a8,8,0,0,1-8-8.71,104.37,104.37,0,0,1,207.94,0,8,8,0,0,1-8,8.71Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <path d="M88,136c0-72,40-104,40-104s40,32,40,104" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
  </>,
  check: <polyline points="40 144 96 200 224 72" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />,
  clock: <>
    <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <polyline points="128 72 128 128 184 128" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
  </>,
  star: <path d="M128,189.09l54.72,33.65a8.4,8.4,0,0,0,12.52-9.17l-14.88-62.79,48.7-42A8.46,8.46,0,0,0,224.27,94L160.36,88.8,135.74,29.2a8.36,8.36,0,0,0-15.48,0L95.64,88.8,31.73,94a8.46,8.46,0,0,0-4.79,14.83l48.7,42L60.76,213.57a8.4,8.4,0,0,0,12.52,9.17Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />,
  gear: <>
    <circle cx="128" cy="128" r="40" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <path d="M41.43,178.09A99.14,99.14,0,0,1,31.36,153.8l16.78-21a81.59,81.59,0,0,1,0-9.64l-16.77-21a99.43,99.43,0,0,1,10.05-24.3l26.71-3a81,81,0,0,1,6.81-6.81l3-26.7A99.14,99.14,0,0,1,102.2,31.36l21,16.78a81.59,81.59,0,0,1,9.64,0l21-16.77a99.43,99.43,0,0,1,24.3,10.05l3,26.71a81,81,0,0,1,6.81,6.81l26.7,3a99.14,99.14,0,0,1,10.07,24.29l-16.78,21a81.59,81.59,0,0,1,0,9.64l16.77,21a99.43,99.43,0,0,1-10,24.3l-26.71,3a81,81,0,0,1-6.81,6.81l-3,26.7a99.14,99.14,0,0,1-24.29,10.07l-21-16.78a81.59,81.59,0,0,1-9.64,0l-21,16.77a99.43,99.43,0,0,1-24.3-10l-3-26.71a81,81,0,0,1-6.81-6.81Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
  </>,
  palette: <>
    <path d="M128,192a24,24,0,0,1,24-24h46.21a24,24,0,0,0,23.4-18.65A96.48,96.48,0,0,0,224,127.17c-.45-52.82-44.16-95.7-97-95.17a96,96,0,0,0-95,96c0,41.81,26.73,73.44,64,86.61A24,24,0,0,0,128,192Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <circle cx="128" cy="76" r="12" />
    <circle cx="84" cy="100" r="12" />
    <circle cx="84" cy="156" r="12" />
    <circle cx="172" cy="100" r="12" />
  </>,
  wallet: <>
    <path d="M40,56V184a16,16,0,0,0,16,16H216a8,8,0,0,0,8-8V80a8,8,0,0,0-8-8H56A16,16,0,0,1,40,56h0A16,16,0,0,1,56,40H192" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <circle cx="180" cy="132" r="12" />
  </>,
  house: <path d="M104,216V152h48v64h64V120a8,8,0,0,0-2.34-5.66l-80-80a8,8,0,0,0-11.32,0l-80,80A8,8,0,0,0,40,120v96Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />,
  'house-simple': <path d="M40,216H216V120a8,8,0,0,0-2.34-5.66l-80-80a8,8,0,0,0-11.32,0l-80,80A8,8,0,0,0,40,120Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />,
  'check-circle': <>
    <polyline points="88 136 112 160 168 104" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
  </>,
  'shield-check': <>
    <path d="M216,112V56a8,8,0,0,0-8-8H48a8,8,0,0,0-8,8v56c0,96,88,120,88,120S216,208,216,112Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <polyline points="88 136 112 160 168 104" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
  </>,
  sparkle: <>
    <path d="M84.27,171.73l-55.09-20.3a7.92,7.92,0,0,1,0-14.86l55.09-20.3,20.3-55.09a7.92,7.92,0,0,1,14.86,0l20.3,55.09,55.09,20.3a7.92,7.92,0,0,1,0,14.86l-55.09,20.3-20.3,55.09a7.92,7.92,0,0,1-14.86,0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="176" y1="16" x2="176" y2="64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="224" y1="72" x2="224" y2="104" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="152" y1="40" x2="200" y2="40" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="208" y1="88" x2="240" y2="88" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
  </>,
  triangle: <path d="M142.41,40.22l87.46,151.87C236,202.79,228.08,216,215.46,216H40.54C27.92,216,20,202.79,26.13,192.09L113.59,40.22C119.89,29.26,136.11,29.26,142.41,40.22Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />,
  tag: <>
    <path d="M42.34,138.34A8,8,0,0,1,40,132.69V40h92.69a8,8,0,0,1,5.65,2.34l99.32,99.32a8,8,0,0,1,0,11.31L153,237.66a8,8,0,0,1-11.31,0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <circle cx="84" cy="84" r="12" />
  </>,
  hammer: <>
    <line x1="108" y1="116" x2="140" y2="148" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="228.06" y1="99.94" x2="188" y2="140" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <path d="M40,64,53.77,49.77a88,88,0,0,1,124.46,0l67.43,67.89a8,8,0,0,1,0,11.31L217,157.66a8,8,0,0,1-11.31,0L168,120,66.34,221.66a8,8,0,0,1-11.31,0L34.34,201a8,8,0,0,1,0-11.31L136,88,79.78,31.78" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
  </>,
  'credit-card': <>
    <rect x="24" y="56" width="208" height="144" rx="8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="168" y1="168" x2="200" y2="168" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="120" y1="168" x2="136" y2="168" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="24" y1="96" x2="232" y2="96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
  </>,
  drop: <>
    <path d="M208,144c0-72-80-128-80-128S48,72,48,144a80,80,0,0,0,160,0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <path d="M136,192c20-3.37,36.61-20,40-40" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
  </>,
  'drop-simple': <path d="M208,144c0-72-80-128-80-128S48,72,48,144a80,80,0,0,0,160,0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />,
  thermometer: <>
    <circle cx="212" cy="84" r="20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="120" y1="160" x2="120" y2="88" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <circle cx="120" cy="184" r="24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <path d="M88,48a32,32,0,0,1,64,0v90a56,56,0,1,1-64,0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
  </>,
  scales: <>
    <line x1="128" y1="40" x2="128" y2="216" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="104" y1="216" x2="152" y2="216" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="56" y1="88" x2="200" y2="56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <path d="M24,168c0,17.67,20,24,32,24s32-6.33,32-24L56,88Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <path d="M168,136c0,17.67,20,24,32,24s32-6.33,32-24L200,56Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
  </>,
  lightbulb: <>
    <line x1="88" y1="232" x2="168" y2="232" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <path d="M78.7,167A79.87,79.87,0,0,1,48,104.45C47.76,61.09,82.72,25,126.07,24a80,80,0,0,1,51.34,142.9A24.3,24.3,0,0,0,168,186v6a8,8,0,0,1-8,8H96a8,8,0,0,1-8-8v-6A24.11,24.11,0,0,0,78.7,167Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <path d="M136,56c20,3.37,36.61,20,40,40" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
  </>,
  wind: <>
    <path d="M128,192c3.39,9.15,13.67,16,24,16a24,24,0,0,0,0-48H40" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <path d="M96,64c3.39-9.15,13.67-16,24-16a24,24,0,0,1,0,48H24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <path d="M184,96c3.39-9.15,13.67-16,24-16a24,24,0,0,1,0,48H32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
  </>,
  sun: <>
    <line x1="128" y1="40" x2="128" y2="16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <circle cx="128" cy="128" r="56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="64" y1="64" x2="48" y2="48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="64" y1="192" x2="48" y2="208" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="192" y1="64" x2="208" y2="48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="192" y1="192" x2="208" y2="208" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="40" y1="128" x2="16" y2="128" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="128" y1="216" x2="128" y2="240" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="216" y1="128" x2="240" y2="128" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
  </>,
  image: <>
    <rect x="32" y="48" width="192" height="160" rx="8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <circle cx="156" cy="100" r="12" />
    <path d="M147.31,164,173,138.34a8,8,0,0,1,11.31,0L224,178.06" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <path d="M32,168.69l54.34-54.35a8,8,0,0,1,11.32,0L191.31,208" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
  </>,
  lightning: <path d="M96,240a8,8,0,0,1-7.85-9.57L106.84,136H48a8,8,0,0,1-6-13.33l112-128a8,8,0,0,1,13.85,5.33l-18.69,94.43H208a8,8,0,0,1,6,13.33l-112,128A8,8,0,0,1,96,240Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />,
  'hard-hat': <>
    <rect x="24" y="160" width="208" height="40" rx="8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <path d="M104,160V40a8,8,0,0,1,8-8h32a8,8,0,0,1,8,8V160" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <path d="M216,160V136a88,88,0,0,0-64-84.69" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <path d="M40,160V136a88,88,0,0,1,64-84.69" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
  </>,
}

function Icon({ icon, className }) {
  const el = ICON_ELEMENTS[icon] || ICON_ELEMENTS.check
  return (
    <svg className={className} viewBox="0 0 256 256">
      {el}
    </svg>
  )
}

function renderBlocks(blocks) {
  return blocks.map((block, i) => {
    if (block.type === 'paragraph') {
      return (
        <p key={i} className="text-[15px] text-slate-600 leading-relaxed mb-5">
          {(block.children ?? []).map((c, j) => renderInline(c, j))}
        </p>
      )
    }
    if (block.type === 'heading') {
      const Tag = `h${block.level ?? 2}`
      return (
        <Tag key={i} className="text-[24px] font-semibold text-[#0E0C29] mt-10 mb-4">
          {(block.children ?? []).map((c, j) => renderInline(c, j))}
        </Tag>
      )
    }
    if (block.type === 'list') {
      const Tag = block.format === 'ordered' ? 'ol' : 'ul'
      return (
        <Tag key={i} className={`mb-5 pl-6 text-[15px] text-slate-600 leading-relaxed ${block.format === 'ordered' ? 'list-decimal' : 'list-disc'}`}>
          {(block.children ?? []).map((item, j) => (
            <li key={j} className="mb-2">
              {(item.children ?? []).map((c, k) => renderInline(c, k))}
            </li>
          ))}
        </Tag>
      )
    }
    if (block.type === 'quote') {
      return (
        <blockquote key={i} className="border-l-4 border-blue-500 pl-4 italic text-slate-600 my-5">
          {(block.children ?? []).map((c, j) => renderInline(c, j))}
        </blockquote>
      )
    }
    return null
  })
}

function renderInline(node, key) {
  if (node.type === 'link') {
    return (
      <a key={key} href={node.url} className="text-blue-600 underline hover:no-underline">
        {(node.children ?? []).map((c, j) => renderInline(c, j))}
      </a>
    )
  }
  let text = node.text ?? ''
  if (node.bold) text = <strong>{text}</strong>
  if (node.italic) text = <em>{text}</em>
  if (node.underline) text = <u>{text}</u>
  return <span key={key}>{text}</span>
}

// ── Scroll reveal hook ────────────────────────────────────────
function useReveal(threshold = 0.1) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

// ── Animated Number ───────────────────────────────────────────
// Server-renders the real figure, then animates up to it on the client.
//
// This used to initialise its state to 0, which meant the server-rendered HTML
// said "0" for every stat on the page — so the copy a crawler reads (and anyone
// with JS blocked, and the moment before hydration) claimed 0 years of
// experience and 0 completed projects. The animation is a decoration; the number
// is the content, so the number is what ships in the markup.
//
// The animation now only runs for counters that are below the fold at mount:
// resetting a visible, already-correct number back to 0 in front of the reader
// is worse than not animating it. prefers-reduced-motion skips it entirely.
function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1500 }) {
  const [count, setCount] = useState(value)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (prefersReducedMotion) return

    // Already on screen when we hydrated — leave the rendered value alone.
    if (el.getBoundingClientRect().top < window.innerHeight) return

    let raf
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        obs.disconnect()
        const start = performance.now()
        const step = (now) => {
          const t = Math.min((now - start) / duration, 1)
          // Ease-out: fast at first, settling into the final figure.
          setCount(Math.round((1 - Math.pow(1 - t, 3)) * value))
          if (t < 1) raf = window.requestAnimationFrame(step)
          else setCount(value)
        }
        setCount(0)
        raf = window.requestAnimationFrame(step)
      },
      { threshold: 0.5 },
    )
    obs.observe(el)
    return () => {
      obs.disconnect()
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [value, duration])

  // tabular-nums keeps every digit the same width, so counting up cannot reflow
  // the text beside it.
  return <span ref={ref} className="tabular-nums">{prefix}{count}{suffix}</span>
}

export default function ServicePageContent({ site, strapiUrl, data, serviceCities = [], zonas = [], contact = null }) {
  const slug = data?.slug
  const city = data?.city
  // Explore items are cloned from the tarragona entry, so their hrefs still point
  // at /{service}/tarragona — retarget the city segment to this entry's city.
  const localizeServiceHref = (href) => {
    if (!href) return href
    // Strapi data sometimes stores hrefs without the leading slash — a
    // relative link resolves under the current page path and 404s.
    const normalized = /^(https?:|mailto:|tel:|#|\/)/.test(href) ? href : `/${href}`
    if (!city) return normalized
    const m = normalized.match(/^\/([^/]+)\/([^/]+)\/?$/)
    return m ? `/${m[1]}/${city}` : normalized
  }
  const [activeTab, setActiveTab] = useState(0)
  const [activeType, setActiveType] = useState(0)
  const [activeFaq, setActiveFaq] = useState(null)
  const [zonasExpanded, setZonasExpanded] = useState(false)
  const [activeServiceItem, setActiveServiceItem] = useState(0)
  const [activeProcess, setActiveProcess] = useState(0)
  const [activeApplication, setActiveApplication] = useState(0)
  const [activeAppAccordion, setActiveAppAccordion] = useState(0)
  const [seoExpanded, setSeoExpanded] = useState(false)
  const exploreSliderRef = useRef(null)
  const scrollExplore = (dir) => {
    const el = exploreSliderRef.current
    if (!el) return
    const card = el.querySelector('a')
    const step = card ? card.offsetWidth + 20 : 320
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }
  // Mouse drag-to-scroll for the explore slider (touch already scrolls natively)
  const exploreDrag = useRef({ down: false, startX: 0, startScroll: 0, moved: false })
  const onExploreMouseDown = (e) => {
    const el = exploreSliderRef.current
    if (!el) return
    exploreDrag.current = { down: true, startX: e.pageX, startScroll: el.scrollLeft, moved: false }
    el.style.scrollBehavior = 'auto'
    el.style.scrollSnapType = 'none'
    el.style.cursor = 'grabbing'
  }
  const onExploreMouseMove = (e) => {
    const d = exploreDrag.current
    const el = exploreSliderRef.current
    if (!d.down || !el) return
    const dx = e.pageX - d.startX
    if (Math.abs(dx) > 5) d.moved = true
    el.scrollLeft = d.startScroll - dx
  }
  const endExploreDrag = () => {
    const d = exploreDrag.current
    const el = exploreSliderRef.current
    d.down = false
    if (!el) return
    el.style.cursor = ''
    el.style.scrollBehavior = ''
    el.style.scrollSnapType = ''
  }
  const onExploreClickCapture = (e) => {
    // Swallow the click that ends a drag so cards don't navigate accidentally
    if (exploreDrag.current.moved) {
      e.preventDefault()
      e.stopPropagation()
      exploreDrag.current.moved = false
    }
  }

  // Extract sections from JSON data
  const {
    hero, stats, tabsSection: _tabsSection, tiposSection: _tiposSection, tableSection: _tableSection,
    compareSection: _compareSection, featuresSection: _featuresSection, comparisonSection: _comparisonSection, bannerSection, faqSection: _faqSection,
    brandsSection, processSection: _processSection, benefitsSection: _benefitsSection,
    exploreSection: _exploreSection, applicationsSection: _applicationsSection,
    typesSection: _typesSection, benefitsWindowSection: _benefitsWindowSection, whyChooseSection,
    benefitsIntroSection: _benefitsIntroSection,
    serviceList,
  } = data ?? {}
  if (!hero) return null
  // Brands are always rendered as ONE composite strip image — individual logo
  // uploads in Strapi entries are ignored so every site/section stays uniform.
  const BRANDS_STRIP = {
    url: '/uploads/Frame_2147223484_1_1024x116_70b52fa8bf.webp',
    alternativeText: 'Marcas de confianza',
  }
  const effectiveBrandsSection = (brandsSection || slug === 'mantenimiento-y-limpieza-de-tejados-y-canalones' || slug === 'impermeabilizaciones')
    ? {
      title: brandsSection?.title || `Marcas de confianza en ${slug.replace(/-/g, ' ')} en {site}`,
      image: BRANDS_STRIP,
    }
    : null;

  const brandsSectionEl = effectiveBrandsSection && (effectiveBrandsSection.logos?.length > 0 || effectiveBrandsSection.image) && (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-10">
        {effectiveBrandsSection.title && (
          <h2 className="text-center text-[22px] md:text-[24px] font-medium text-black">
            {withSite(effectiveBrandsSection.title, site)}
          </h2>
        )}
        {effectiveBrandsSection.logos?.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
            {effectiveBrandsSection.logos.map((logo, i) => {
              const src = logo.url ? (optimizedImageUrl(logo.url.startsWith('http') ? logo.url : `${strapiUrl}${logo.url}`)) : null
              if (!src) return null
              // A single very wide "logo" is a composite brand strip — render it full width
              const isStrip = effectiveBrandsSection.logos.length === 1 && (logo.width || 0) > 3 * (logo.height || 1)
              return <img key={i} src={src} alt={autoAlt(effectiveBrandsSection.altImage, logo, [effectiveBrandsSection.title], site)} width={logo.width || 800} height={logo.height || 600} className={isStrip ? 'w-full max-w-4xl h-auto px-4' : 'h-14 md:h-20 w-auto object-contain'} loading="lazy" />
            })}
          </div>
        ) : effectiveBrandsSection.image ? (() => {
          const img = effectiveBrandsSection.image
          const src = img.url ? (optimizedImageUrl(img.url.startsWith('http') ? img.url : `${strapiUrl}${img.url}`)) : null
          if (!src) return null
          return <img src={src} alt={autoAlt(effectiveBrandsSection.altImage, img, [effectiveBrandsSection.title], site)} width={img.width || 1024} height={img.height || 116} className="w-full max-w-4xl h-auto px-4" loading="lazy" />
        })() : null}
      </div>
    </section>
  )
  const applicationsSection = _applicationsSection && Array.isArray(_applicationsSection.items) && _applicationsSection.items.length > 0 ? _applicationsSection : null
  const tabsSection = _tabsSection && Array.isArray(_tabsSection.tabs) ? _tabsSection : null
  const typesSection = _typesSection && Array.isArray(_typesSection.tabs) && _typesSection.tabs.length > 0 ? _typesSection : null
  const tiposSection = _tiposSection && Array.isArray(_tiposSection.tipos) ? _tiposSection : null
  const tableSection = _tableSection && Array.isArray(_tableSection.rows) ? _tableSection : null
  const compareSection = _compareSection && Array.isArray(_compareSection.rows) ? _compareSection : null
  const featuresSection = _featuresSection && Array.isArray(_featuresSection.features) ? _featuresSection : null
  const comparisonSection = _comparisonSection && Array.isArray(_comparisonSection.features) && _comparisonSection.features.length > 0 ? _comparisonSection : null
  const benefitsIntroSection = _benefitsIntroSection && _benefitsIntroSection.title ? _benefitsIntroSection : null
  const faqSection = _faqSection && Array.isArray(_faqSection.faqs) ? _faqSection : null
  const processSection = _processSection && Array.isArray(_processSection.steps) && _processSection.steps.length > 0 ? _processSection : null
  const benefitsSection = _benefitsSection && Array.isArray(_benefitsSection.benefits) && _benefitsSection.benefits.length > 0 ? _benefitsSection : null
  const benefitsWindowSection = _benefitsWindowSection && Array.isArray(_benefitsWindowSection.benefits) && _benefitsWindowSection.benefits.length > 0 ? _benefitsWindowSection : null
  const exploreSection = _exploreSection && Array.isArray(_exploreSection.items) && _exploreSection.items.length > 0 ? _exploreSection : null
  // "Más Ubicaciones" — auto-derived per-site zonas list passed in from the page
  // (see [service]/[city].astro). No CMS-authored city list, no hardcoded
  // fallback town names: empty until this site has real zonas.
  const otherZonas = Array.isArray(zonas) ? zonas : []

  const [heroRef, heroVisible] = useReveal(0)
  const [statsRef, statsVisible] = useReveal(0.1)
  const [applicationsRef, applicationsVisible] = useReveal(0.1)
  const [tabsRef, tabsVisible] = useReveal(0.1)
  const [typesRef, typesVisible] = useReveal(0.1)

  const [tiposRef, tiposVisible] = useReveal(0.1)
  const [tableRef, tableVisible] = useReveal(0.1)
  const [compareRef, compareVisible] = useReveal(0.1)
  const [processRef, processVisible] = useReveal(0.1)
  const [benefitsRef, benefitsVisible] = useReveal(0.1)
  const [benefitsWindowRef, benefitsWindowVisible] = useReveal(0.1)
  const [exploreRef, exploreVisible] = useReveal(0.1)
  const [zonasRef, zonasVisible] = useReveal(0.1)
  const [featuresRef, featuresVisible] = useReveal(0.1)
  const [bannerRef, bannerVisible] = useReveal(0.1)
  const [faqRef, faqVisible] = useReveal(0.1)
  const [galleryRef, galleryVisible] = useReveal(0.1)
  const [blogRef, blogVisible] = useReveal(0.1)

  const WHY_CHOOSE_BULLET_ICONS = ['shield', 'wrench', 'star']
  const effectiveWhyChooseSection = whyChooseSection || (slug === 'mantenimiento-y-limpieza-de-tejados-y-canalones' ? {
    title: "Motivos para confiar en nuestro servicio de mantenimiento y limpieza de tejados en {site}",
    paragraph1: "En Tejados {site} trabajamos con dedicacion y rigor en cada proyecto de mantenimiento. Ofrecemos intervenciones de confianza, respuesta agil y resultados que perduran.",
    paragraph2: null,
    bullet1: "Mas de 15 años de Experiencia",
    bullet2: "Atencion Rapida y Profesional",
    bullet3: "Calidad Garantizada en Cada Trabajo",
    image: {
      url: "/uploads/Frame_2147223769_5fcd07b40a.webp",
      alternativeText: "Motivos para confiar"
    }
  } : slug === 'aislamiento-termico-y-acustico' ? {
    title: "Razones para elegirnos para tu aislamiento en {site}",
    paragraph1: "En {site} trabajamos con materiales de primera calidad y un equipo especializado orientado a mejorar el confort y la eficiencia energetica de tu hogar.",
    paragraph2: null,
    bullet1: "Tecnicos con Experiencia Demostrada",
    bullet2: "Aislantes Certificados y Duraderos",
    bullet3: "Presupuestos Claros y Detallados",
    image: {
      url: "/uploads/Frame_2147223769_5fcd07b40a.webp",
      alternativeText: "Razones para elegirnos"
    }
  } : null);

  const whyChooseSectionEl = effectiveWhyChooseSection && (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className={slug === 'retirada-de-amianto-uralita' ? 'md:order-2' : ''}>
          <h2 className="text-[28px] md:text-[32px] font-medium text-[#111827] mb-6 leading-tight">
            {(effectiveWhyChooseSection.title || '').replace(/\{site\}/g, site)}
          </h2>
          {effectiveWhyChooseSection.paragraph1 && (
            <p className="text-[15px] text-slate-600 leading-relaxed mb-4">{withSite(effectiveWhyChooseSection.paragraph1, site)}</p>
          )}
          {effectiveWhyChooseSection.paragraph2 && (
            <p className="text-[15px] text-slate-600 leading-relaxed mb-4">{withSite(effectiveWhyChooseSection.paragraph2, site)}</p>
          )}
          {[effectiveWhyChooseSection.bullet1, effectiveWhyChooseSection.bullet2, effectiveWhyChooseSection.bullet3].some(Boolean) && (
            <ul className="space-y-3 mt-4">
              {[effectiveWhyChooseSection.bullet1, effectiveWhyChooseSection.bullet2, effectiveWhyChooseSection.bullet3].filter(Boolean).map((bullet, i) => (
                <li key={i} className="flex items-center gap-3 text-[15px] text-slate-700">
                  <Icon icon={WHY_CHOOSE_BULLET_ICONS[i]} className="w-5 h-5 text-[#24274D] shrink-0" />
                  {bullet}
                </li>
              ))}
            </ul>
          )}
          {(slug === 'instalacion-tejados-panel-sandwich' || slug === 'instalacion-y-reparacion-de-claraboyas' || slug === 'mantenimiento-y-limpieza-de-tejados-y-canalones' || slug === 'aislamiento-termico-y-acustico' || slug === 'impermeabilizaciones' || slug === 'reparacion-de-goteras' || slug === 'reparacion-de-humedades' || slug === 'instalacion-y-reparacion-de-ventanas-velux' || slug === 'rehabilitacion-de-fachadas' || slug === 'retirada-de-amianto-uralita' || slug === 'trabajos-verticales') && (
            <a href="/contacto" className="inline-flex items-center gap-2 bg-[#24274D] text-white px-6 py-3 rounded-lg font-medium text-[15px] hover:bg-[#1a1d38] transition-colors mt-8">
              Solicita Presupuesto Gratis
            </a>
          )}
        </div>
        {effectiveWhyChooseSection.image?.url && (
          <div className="rounded-[16px] overflow-hidden">
            <img
              src={optimizedImageUrl(effectiveWhyChooseSection.image.url.startsWith('http') ? effectiveWhyChooseSection.image.url : `${strapiUrl}${effectiveWhyChooseSection.image.url}`)}
              alt={autoAlt(effectiveWhyChooseSection.altImage, effectiveWhyChooseSection.image, [effectiveWhyChooseSection.title, data.pageTitle], site)}
              width={effectiveWhyChooseSection.image.width || 800}
              height={effectiveWhyChooseSection.image.height || 600}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </section>
  )

  const faqSectionEl = faqSection && (
    <section
      ref={faqRef}
      style={{ opacity: faqVisible ? 1 : 0, transform: faqVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
      className="py-24 px-6 bg-white"
    >
      <div className="max-w-[1140px] mx-auto flex flex-col md:flex-row gap-12 md:gap-24">
        <div className="w-full md:w-1/3">
          <h2 className="font-semibold text-[32px] md:text-[36px] leading-tight text-[#11181C]">
            {withSite(faqSection.title, site)}
          </h2>
        </div>
        <div className="w-full md:w-2/3 space-y-3">
          {faqSection?.faqs?.map((faq, i) => {
            const isActive = activeFaq === i;
            return (
              <div
                key={i}
                className="rounded-[16px] overflow-hidden transition-all duration-300 bg-[#F4F7FB]"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isActive ? null : i)}
                  aria-expanded={isActive}
                  aria-controls={`svcfaq-panel-${i}`}
                  id={`svcfaq-trigger-${i}`}
                  className="w-full text-left px-8 py-5 flex justify-between items-center transition-colors"
                >
                  <span className="font-medium text-[15px] text-[#11181C] pr-8">{faq.q}</span>
                  <span aria-hidden="true" className="text-[#3b82f6] font-medium text-[24px] leading-none shrink-0 flex items-center justify-center w-6 h-6 mb-1">
                    {isActive ? '−' : '+'}
                  </span>
                </button>
                {/* Collapsed with max-height, not display:none, so the answer
                    stays in the rendered text — that is what makes these
                    eligible for an FAQ rich result. `inert` keeps a closed
                    panel out of the tab order and the accessibility tree. */}
                <div
                  id={`svcfaq-panel-${i}`}
                  role="region"
                  aria-labelledby={`svcfaq-trigger-${i}`}
                  inert={isActive ? undefined : ''}
                  className="px-8 overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: isActive ? '300px' : '0px', paddingBottom: isActive ? '24px' : '0' }}
                >
                  <p className="text-[14px] text-slate-600 leading-relaxed font-medium">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  )

  const featuresSectionEl = featuresSection && (
    <section
      ref={featuresRef}
      style={{ opacity: featuresVisible ? 1 : 0, transform: featuresVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
      className="py-24 px-6 bg-white"
    >
      <div className="max-w-5xl mx-auto">
        <h2 className={slug === 'instalacion-tejados-panel-sandwich' ? "text-left font-semibold text-[26px] md:text-[28px] text-[#111827] mb-10" : "text-center font-semibold text-[26px] md:text-[28px] text-[#111827] mb-10"}>
          {withSite(featuresSection.title, site)}
        </h2>
        {featuresSection?.features?.some(f => f.image?.url) ? (
          (slug === 'instalacion-tejados-panel-sandwich' || slug === 'impermeabilizaciones') ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuresSection.features.map((f, i) => {
                const src = f.image?.url ? (optimizedImageUrl(f.image.url.startsWith('http') ? f.image.url : `${strapiUrl}${f.image.url}`)) : null
                const priceMatch = (f.desc || '').match(/\s*Precio:.*$/)
                const desc = priceMatch ? f.desc.slice(0, priceMatch.index).trim() : f.desc
                const price = priceMatch ? priceMatch[0].trim() : null
                return (
                  <div key={i} className="rounded-[12px] overflow-hidden border border-slate-200 bg-white">
                    <div className="relative aspect-[3/2] bg-slate-100">
                      {src && <img src={src} alt={autoAlt(f.altImage, f.image, [f.title, featuresSection.title], site)} width={f.image?.width || 800} height={f.image?.height || 600} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-[#24274D] text-[16px] mb-1.5">{f.title}</h3>
                      <p className="text-[13px] text-slate-600 leading-relaxed mb-2">{desc}</p>
                      {price && <p className="text-[13px] text-slate-500">{price}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuresSection.features.map((f, i) => {
                const src = f.image?.url ? (optimizedImageUrl(f.image.url.startsWith('http') ? f.image.url : `${strapiUrl}${f.image.url}`)) : null
                return (
                  <div key={i} className="rounded-[12px] overflow-hidden border border-slate-100 bg-white">
                    <div className="relative aspect-[4/3] bg-slate-100">
                      {src && <img src={src} alt={autoAlt(f.altImage, f.image, [f.title, featuresSection.title], site)} width={f.image?.width || 800} height={f.image?.height || 600} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-[#111827] text-[16px] mb-1.5">{f.title}</h3>
                      <p className="text-[13px] text-slate-600 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuresSection?.features?.map((f, i) => (
              <div key={i} className="bg-[#F4F6F9] p-8 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-md bg-white shadow-sm flex items-center justify-center text-blue-500 shrink-0">
                    <Icon icon={f.icon} className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontFamily: 'Inter, sans-serif', fontStyle: 'normal', fontWeight: 400, color: 'rgb(0, 0, 0)', fontSize: '24px', lineHeight: '24px' }}>{f.title}</h3>
                </div>
                <p className="text-[#4B5563] text-[16px] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )

  const bannerSectionEl = bannerSection && (
    <section
      ref={bannerRef}
      style={{ opacity: bannerVisible ? 1 : 0, transform: bannerVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
      className="py-16 px-6"
    >
      <div className="max-w-[1140px] mx-auto bg-[#F0F5FD] rounded-[32px] overflow-hidden flex flex-col md:flex-row shadow-sm">
        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center items-start">
          <h2 className="text-[28px] md:text-[34px] font-bold text-[#11181C] mb-6 leading-tight tracking-tight">
            {withSite(bannerSection.title, site)}
          </h2>
          <p className="text-slate-600 text-[16px] mb-10 font-medium">
            {bannerSection.desc}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <a href="/contacto" className="inline-flex items-center justify-center bg-[#24274D] text-white px-8 py-3.5 rounded-[12px] font-medium text-[15px] hover:bg-[#1a1d38] transition-colors shadow-lg shadow-blue-900/10 whitespace-nowrap">
              Solicitar Presupuesto
            </a>
          </div>
        </div>

        {bannerSection?.images?.length > 0 && (
          <div className="w-full md:w-1/2 flex flex-col gap-[3px] self-stretch">
            {bannerSection.images.map((img, i) => {
              const src = img?.url ? (optimizedImageUrl(img.url.startsWith('http') ? img.url : `${strapiUrl}${img.url}`)) : null
              if (!src) return null
              return (
                <div key={i} className="w-full flex-1 overflow-hidden bg-slate-200 relative min-h-[140px]">
                  <img src={src} width={img.width || 800} height={img.height || 600} className="absolute inset-0 w-full h-full object-cover" alt={autoAlt(bannerSection.altImage, img, [bannerSection.title, data.pageTitle], site)} loading="lazy" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )

  const exploreSectionEl = exploreSection && (
    <section
      ref={exploreRef}
      style={{ opacity: exploreVisible ? 1 : 0, transform: exploreVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
      className="py-24 px-6 bg-white"
    >
      <div className="max-w-6xl mx-auto">
        <p className="text-center font-normal text-[13px] text-[#11181C] mb-2">
          Explora nuestro servicio en {titleCasePlace(site)}
        </p>
        <h2 className="text-center font-medium text-[32px] leading-tight text-[#11181C] mb-12">
          {withSite(exploreSection.title, site)}
        </h2>
        {/* Light-blue slider panel */}
        <div className="bg-[#EEF4FB] rounded-[24px] md:rounded-[32px] p-5 md:p-8">
          <div
            ref={exploreSliderRef}
            onMouseDown={onExploreMouseDown}
            onMouseMove={onExploreMouseMove}
            onMouseUp={endExploreDrag}
            onMouseLeave={endExploreDrag}
            onClickCapture={onExploreClickCapture}
            onDragStart={(e) => e.preventDefault()}
            className={`flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth cursor-grab select-none [&::-webkit-scrollbar]:hidden ${exploreSection.items.length === 1 ? 'justify-center' : ''}`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {exploreSection.items.map((item, i) => {
              const src = item.image?.url ? (optimizedImageUrl(item.image.url.startsWith('http') ? item.image.url : `${strapiUrl}${item.image.url}`)) : null
              return (
                <a
                  key={i}
                  href={localizeServiceHref(item.href) || '#'}
                  /* The card image and the label live inside one <a>, so by
                     default the link's accessible name is the concatenation of
                     both — which read "Aislamiento Térmico y Acústico en
                     Santander Aislamiento Térmico y Acústico" and is the
                     doubled anchor text P2 fixed by emptying the alt. Naming
                     the link explicitly fixes it at the source instead: an
                     aria-label wins over the element's contents, so the image
                     can carry real alt text for search engines without ever
                     reaching the accessible name. It matches the visible label
                     verbatim, which is what WCAG 2.5.3 (Label in Name) asks. */
                  aria-label={item.title}
                  className="group block shrink-0 snap-start w-[80%] sm:w-[46%] lg:w-[calc((100%-40px)/3)] rounded-[14px] overflow-hidden bg-white border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="relative aspect-[4/3] bg-slate-100">
                    {src && <img src={src} alt={autoAlt(item.altImage, item.image, [item.title, exploreSection.title], site)} width={item.image?.width || 800} height={item.image?.height || 600} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />}
                  </div>
                  <div className="flex items-start justify-between gap-2 px-4 py-3">
                    <span className="text-[14px] text-[#111827] leading-tight">{item.title}</span>
                    <svg className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17L17 7M17 7H7M17 7v10" /></svg>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
        {/* Prev / next controls */}
        {exploreSection.items.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => scrollExplore(-1)}
              className="w-10 h-10 rounded-full border border-[#11181C] flex items-center justify-center text-[#11181C] hover:bg-[#11181C] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              onClick={() => scrollExplore(1)}
              className="w-10 h-10 rounded-full border border-[#11181C] flex items-center justify-center text-[#11181C] hover:bg-[#11181C] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>
    </section>
  )

  const benefitsIntroSectionEl = benefitsIntroSection && (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        <h2 className="text-left font-medium text-[26px] md:text-[28px] text-[#111827] leading-tight">
          {withSite(benefitsIntroSection.title, site)}
        </h2>
        <p className="text-[15px] text-slate-600 leading-relaxed">{withSite(benefitsIntroSection.paragraph1, site)}</p>
      </div>
    </section>
  )

  const typesSectionEl = typesSection && (
    <section
      ref={typesRef}
      style={{ opacity: typesVisible ? 1 : 0, transform: typesVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
      className="py-24 px-6 bg-white"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <h2 className="text-center mb-4" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, color: 'rgb(0,0,0)', fontSize: '32px', lineHeight: '32px' }}>
          {withSite(typesSection.title, site)}
        </h2>

        <div className="sr-only" aria-hidden="true">
          {typesSection.tabs?.map((tab, i) => <h3 key={i}>{tab.title}</h3>)}
        </div>

        <div className="w-full grid grid-cols-2 md:flex bg-[#F8FAFC] border border-gray-200 rounded-xl p-1.5 mx-auto max-w-5xl gap-1.5 md:gap-0">
          {typesSection.tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveType(idx)}
              className={`md:flex-1 py-2 px-3 min-h-[56px] min-w-[120px] rounded-lg text-[13px] md:text-[14px] transition-all duration-200 flex items-center justify-center text-center whitespace-normal leading-snug ${activeType === idx ? 'bg-white border border-gray-200 shadow-sm font-semibold text-[#11181C]' : 'font-normal text-slate-500 hover:text-[#11181C] hover:bg-gray-100/50'}`}
            >
              {tab.title}
            </button>
          ))}
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col md:flex-row items-stretch max-w-5xl mx-auto w-full mt-2">
          <div className="w-full md:w-[45%] p-8 md:p-10 flex flex-col justify-center bg-white">
            <h3 className="text-[20px] font-bold text-black mb-3">
              {typesSection.tabs[activeType]?.title}
            </h3>
            <p className="text-slate-500 text-[14px] leading-relaxed mb-4">
              {typesSection.tabs[activeType]?.desc}
            </p>
            {typesSection.tabs[activeType]?.price && (
              <p className="text-[14px] font-bold text-black">
                {typesSection.tabs[activeType].price}
              </p>
            )}
          </div>
          {(() => {
            const tabImg = typesSection.tabs[activeType]?.img
            const src = (tabImg && tabImg.url) 
              ? (optimizedImageUrl(tabImg.url.startsWith('http') ? tabImg.url : `${strapiUrl}${tabImg.url}`)) 
              : optimizedImageUrl(`${strapiUrl}/uploads/card_reparacion_tejados_404161ce4e.jpg`);
            
            return (
              <div className="w-full md:w-[55%] relative min-h-[280px] md:min-h-[320px]">
                <img width="800" height="600" src={src} alt={autoAlt(typesSection.tabs[activeType]?.altImage, tabImg, [typesSection.tabs[activeType]?.title, typesSection.title], site)} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              </div>
            )
          })()}
        </div>
      </div>
    </section>
  )

  const comparisonSectionEl = comparisonSection && (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-center font-semibold text-[26px] md:text-[28px] text-[#111827] mb-10">
          {withSite(comparisonSection.title, site)}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {comparisonSection.features.map((f, i) => (
            <div key={i}>
              <h3 className="font-semibold text-[#111827] text-[18px] mb-3">{f.title}</h3>
              <p className="text-[15px] text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )

  const tabsSectionEl = tabsSection && (
    <section
      ref={tabsRef}
      style={{ opacity: tabsVisible ? 1 : 0, transform: tabsVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
      className="py-24 px-6 bg-[#F8FAFC]"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <h2 className="text-center mb-4" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, color: 'rgb(0,0,0)', fontSize: '32px', lineHeight: '32px' }}>
          {withSite(tabsSection.title, site)}
        </h2>

        {/* Hidden H3s for SEO — all tab titles visible to crawlers */}
        <div className="sr-only" aria-hidden="true">
          {tabsSection.tabs?.map((tab, i) => <h3 key={i}>{tab.title}</h3>)}
        </div>

        {/* Tab Bar */}
        {tabsSection?.tabs?.length > 0 && (
          <div className="w-full grid grid-cols-2 md:flex bg-white border border-gray-200 rounded-xl p-1.5 mx-auto max-w-5xl gap-1.5 md:gap-0">
            {tabsSection.tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`md:flex-1 py-2 px-3 min-h-[56px] rounded-lg text-[13px] md:text-[14px] transition-all duration-200 flex items-center justify-center text-center whitespace-normal leading-snug ${activeTab === idx ? 'bg-white border border-gray-200 shadow-sm font-semibold text-[#11181C]' : 'font-normal text-slate-500 hover:text-[#11181C] hover:bg-gray-100/50'}`}
              >
                {tab.title}
              </button>
            ))}
          </div>
        )}

        {/* Content Card */}
        {tabsSection?.tabs?.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col md:flex-row items-stretch max-w-5xl mx-auto w-full mt-2">
            {/* Left (Text) */}
            <div className="w-full md:w-[45%] p-8 md:p-10 flex flex-col justify-center bg-white">
              <h3 className="text-[20px] font-bold text-black mb-3">
                {tabsSection.tabs[activeTab]?.title}
              </h3>
              {(() => {
                const desc = tabsSection.tabs[activeTab]?.desc || ''
                const bullets = desc.split('•').map(s => s.trim()).filter(Boolean)
                if (desc.includes('•') && bullets.length > 1) {
                  return (
                    <ul className="text-slate-500 text-[14px] leading-relaxed mb-4 space-y-2 list-disc pl-5">
                      {bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  )
                }
                return <p className="text-slate-500 text-[14px] leading-relaxed mb-4">{desc}</p>
              })()}
              {tabsSection.tabs[activeTab]?.price && (
                <p className="text-[14px] font-bold text-black">
                  {tabsSection.tabs[activeTab].price}
                </p>
              )}
            </div>
            {/* Right (Image) */}
            {(() => {
              const tabImg = tabsSection.tabs[activeTab]?.img
              const src = (tabImg && tabImg.url) 
                ? (optimizedImageUrl(tabImg.url.startsWith('http') ? tabImg.url : `${strapiUrl}${tabImg.url}`)) 
                : optimizedImageUrl(`${strapiUrl}/uploads/card_reparacion_tejados_404161ce4e.jpg`);
              
              return (
                <div className="w-full md:w-[55%] relative min-h-[280px] md:min-h-[320px]">
                  <img width="800" height="600" src={src} alt={autoAlt(tabsSection.tabs[activeTab]?.altImage, tabImg, [tabsSection.tabs[activeTab]?.title, tabsSection.title], site)} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </section>
  )

  const processSectionEl = processSection && (
    <section
      ref={processRef}
      style={{ opacity: processVisible ? 1 : 0, transform: processVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
      className="py-24 px-6 bg-white"
    >
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        {processSection.image?.url && (
          <div className="w-full lg:w-1/2">
            <div className="rounded-[24px] overflow-hidden">
              <img width="1200" height="800"
                src={optimizedImageUrl(processSection.image.url.startsWith('http') ? processSection.image.url : `${strapiUrl}${processSection.image.url}`)}
                alt={autoAlt(processSection.altImage, processSection.image, [processSection.title, data.pageTitle], site)}
                className="w-full h-auto object-cover" loading="lazy"
              />
            </div>
          </div>
        )}
        <div className="w-full lg:w-1/2">
          <h2 className="font-medium text-[32px] leading-tight text-[#2B2B2B] mb-8">
            {withSite(processSection.title, site)}
          </h2>
          <div>
            {processSection.steps.map((step, i) => {
              const isActive = activeProcess === i;
              const isLast = i === processSection.steps.length - 1;
              return (
                <div key={i} className={`py-5 ${!isLast ? 'border-b border-slate-200' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setActiveProcess(isActive ? null : i)}
                    className="w-full flex items-center gap-4 text-left"
                  >
                    <span className="shrink-0 w-7 h-7 rounded border border-slate-300 flex items-center justify-center text-slate-500 text-[16px] leading-none">
                      {isActive ? '−' : '+'}
                    </span>
                    <h3 className="font-medium text-[17px] text-[#24274D]">{step.title}</h3>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: isActive ? '300px' : '0px' }}
                  >
                    {step.desc && (
                      <p className="text-[14px] text-slate-600 leading-relaxed pl-11 pt-3">{step.desc}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  )

  const applicationsSectionEl = applicationsSection && (() => {
    const items = applicationsSection.items
    const perView = 3
    const maxIndex = Math.max(0, items.length - perView)
    return (
      <section
        ref={applicationsRef}
        style={{ opacity: applicationsVisible ? 1 : 0, transform: applicationsVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
        className="py-16 px-6 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          {slug === 'impermeabilizaciones' ? (
            <div className="flex flex-col md:flex-row gap-12 lg:gap-16 items-start">
              <div className="w-full md:w-1/3">
                <h2 className="font-semibold text-[32px] md:text-[36px] leading-tight text-[#11181C]">
                  {withSite(applicationsSection.title, site)}
                </h2>
              </div>
              <div className="w-full md:w-2/3 space-y-3">
                {items.map((item, i) => {
                  const isActive = activeAppAccordion === i;
                  const parts = (item.description || '').split('\n\n');
                  const descText = parts[0];
                  const priceText = parts.length > 1 ? parts[1] : null;

                  return (
                    <div key={i} className="rounded-[16px] overflow-hidden transition-all duration-300 bg-[#F4F7FB] border border-slate-100">
                      <button
                        onClick={() => setActiveAppAccordion(isActive ? null : i)}
                        className="w-full text-left px-8 py-5 flex justify-between items-center transition-colors"
                      >
                        <span className="font-medium text-[15px] text-[#11181C] pr-8">{item.title}</span>
                        <span className="text-[#3b82f6] font-medium text-[24px] leading-none shrink-0 flex items-center justify-center w-6 h-6 mb-1">
                          {isActive ? '−' : '+'}
                        </span>
                      </button>
                      <div
                        className="px-8 overflow-hidden transition-all duration-300 ease-in-out"
                        style={{ maxHeight: isActive ? '300px' : '0px', paddingBottom: isActive ? '24px' : '0' }}
                      >
                        <p className="text-[14px] text-slate-600 leading-relaxed font-medium">
                          {descText}
                          {priceText && (
                            <>
                              <br /><br />
                              <strong className="text-[#11181C] font-bold">{priceText}</strong>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-center font-medium text-[26px] md:text-[28px] text-[#2B2B2B] mb-10">
                {withSite(applicationsSection.title, site)}
              </h2>
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${activeApplication * (100 / perView)}%)` }}
                >
                  {items.map((item, i) => {
                    const src = item.image?.url ? (optimizedImageUrl(item.image.url.startsWith('http') ? item.image.url : `${strapiUrl}${item.image.url}`)) : null
                    return (
                      <div key={i} className="w-full sm:w-1/2 lg:w-1/3 shrink-0 px-2.5">
                        <div className="rounded-[16px] overflow-hidden relative aspect-[4/3] bg-slate-100">
                          {src && <img src={src} alt={autoAlt(item.altImage, item.image, [item.title, applicationsSection.title], site)} width={item.image?.width || 800} height={item.image?.height || 600} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
                        </div>
                        <p className="text-center text-[14px] md:text-[15px] text-[#11181C] mt-4 leading-snug">{item.title}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {items.length > perView && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={() => setActiveApplication((prev) => Math.max(0, prev - 1))}
                    disabled={activeApplication === 0}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1f2937] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#111827] transition-colors"
                    aria-label="Anterior"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button
                    onClick={() => setActiveApplication((prev) => Math.min(maxIndex, prev + 1))}
                    disabled={activeApplication >= maxIndex}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1f2937] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#111827] transition-colors"
                    aria-label="Siguiente"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    )
  })();

  return (
    <div className="bg-white">
      {/* ── Hero Section ── */}
      <section
        ref={heroRef}
        style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
        className="pt-10 pb-16 px-6 relative bg-white"
      >
        <div className={`max-w-7xl mx-auto flex flex-col items-center gap-12 lg:gap-8 ${slug === 'instalacion-y-reparacion-de-ventanas-velux' ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
          {/* Left Text */}
          <div className="w-full lg:w-[45%] flex flex-col items-start pr-0 lg:pr-8">
            <h1 className="text-[28px] sm:text-[34px] md:text-[42px] font-medium text-black mb-6 leading-[1] md:leading-[42px] break-words w-full" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="block text-[13px] md:text-[15px] font-semibold text-[#24274D] tracking-wide mb-3 uppercase break-words w-full">
                {hero.subtitle}
              </span>
              {(() => {
                const t1 = withSite(hero.titlePart1, site || 'Madrid')
                const t2 = withSite(hero.titlePart2, site || 'Madrid')
                const normalize = (str) => str
                  .normalize('NFD').replace(/[̀-ͯ]/g, '')
                  .replace(/[^a-z0-9]+/gi, ' ')
                  .trim().toLowerCase()
                const siteInT1 = site && normalize(t1).includes(normalize(site))
                if (siteInT1) return <>{t1}</>
                return <>{t1}<br /><span>{site || 'Madrid'}</span>{t2 ? ` ${t2}` : ''}</>
              })()}
            </h1>
            <p className="text-black text-[16px] font-normal mb-10 leading-[24px] max-w-[500px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {hero.desc}
            </p>
            <div className="flex items-center w-full sm:w-auto">
              <a href="/contacto" className="inline-flex items-center gap-2 bg-[#24274D] text-white px-6 py-3 rounded-lg font-medium text-[15px] hover:bg-[#1a1d38] transition-colors">
                Solicita Presupuesto Gratis
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" /></svg>
              </a>
            </div>
          </div>

          {/* Right image(s) — single image or bento grid from Strapi hero.images[] */}
          {hero.images?.length > 0 && (() => {
            const imgs = hero.images
            const url = (img) => img?.url ? (optimizedImageUrl(img.url.startsWith('http') ? img.url : `${strapiUrl}${img.url}`)) : null
            // One altImage in Strapi covers the whole hero gallery; each image
            // falls back to the hero headline, then the page title, + the city.
            const heroAlt = (img) => autoAlt(
              hero.altImage,
              img,
              [[hero.titlePart1, hero.titlePart2].filter(Boolean).join(' '), data?.pageTitle],
              site,
            )
            // Single image: render full, no cropping
            if (imgs.length === 1) {
              const src = url(imgs[0])
              if (!src) return null
              return (
                <div className="w-full lg:w-[50%] flex justify-center lg:justify-end">
                  {/* The hero is the LCP element on every service page. It was
                      marked loading="lazy", which tells the browser to delay the
                      one image the score is measured on until layout says it is
                      needed — so it was fetched late, after the below-fold
                      images already queued. eager + fetchpriority=high is the
                      correct pair for an LCP candidate. */}
                  <img width="800" height="600" src={src} className="w-full max-w-[480px] lg:max-w-none rounded-xl object-contain" alt={heroAlt(imgs[0])} loading="eager" fetchPriority="high" />
                </div>
              )
            }
            const col1 = [imgs[0], imgs[1]].filter(Boolean)
            const col2 = [imgs[2], imgs[3], imgs[4]].filter(Boolean)
            const col3 = [imgs[5], imgs[6]].filter(Boolean)
            const aspects = ['aspect-[4/3]', 'aspect-square', 'aspect-square', 'aspect-square', 'aspect-[4/3]', 'aspect-[4/3]', 'aspect-square']
            if (!col1.length && !col2.length && !col3.length) return null
            return (
              <div className="w-full lg:w-[38%] flex justify-center lg:justify-end">
                <div className="flex w-full max-w-[280px] lg:max-w-[320px] gap-2">
                  {col1.length > 0 && (
                    <div className="flex-1 flex flex-col gap-2 mt-12">
                      {col1.map((img, i) => url(img) && (
                        <div key={i} className={`relative w-full ${aspects[i]} rounded-xl overflow-hidden`}>
                          {/* First tile only: it is the largest above-fold image
                              in the bento hero, so it is the LCP candidate. The
                              rest of the grid stays lazy. */}
                          <img src={url(img)} width={img.width || 800} height={img.height || 600} className="w-full h-full object-cover" alt={heroAlt(img)} loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : undefined} />
                        </div>
                      ))}
                    </div>
                  )}
                  {col2.length > 0 && (
                    <div className="flex-1 flex flex-col gap-2 mt-0">
                      {col2.map((img, i) => url(img) && (
                        <div key={i} className={`relative w-full ${aspects[i + 2]} rounded-xl overflow-hidden`}>
                          <img src={url(img)} width={img.width || 800} height={img.height || 600} className="w-full h-full object-cover" alt={heroAlt(img)} loading="lazy" />
                        </div>
                      ))}
                    </div>
                  )}
                  {col3.length > 0 && (
                    <div className="flex-1 flex flex-col gap-2 mt-2">
                      {col3.map((img, i) => url(img) && (
                        <div key={i} className={`relative w-full ${aspects[i + 5]} rounded-xl overflow-hidden`}>
                          <img src={url(img)} width={img.width || 800} height={img.height || 600} className="w-full h-full object-cover" alt={heroAlt(img)} loading="lazy" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* ── Stats ── */}
      <section
        ref={statsRef}
        style={{ opacity: statsVisible ? 1 : 0, transform: statsVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
        className="py-16 md:py-24 bg-white"
      >
        {(() => {
          // Per-slug stat layout: [prefix, value, suffix, label] x3
          const statItems = slug === 'rehabilitacion-de-fachadas' ? [
            ['+', stats.installations, '', stats.installationsLabel || 'fachadas rehabilitadas'],
            ['', stats.experience, '%', stats.experienceLabel || 'ahorro energetico y termico'],
            ['', stats.warranty, '', stats.warrantyLabel || 'años de garantia en los trabajos'],
          ] : slug === 'trabajos-verticales' ? [
            ['+', stats.installations, '', stats.installationsLabel || 'tejados hechos y felices'],
            ['', stats.experience, '', stats.experienceLabel || 'años de experiencia en trabajos verticales'],
            ['', stats.warranty, '%', stats.warrantyLabel || 'de trabajos con seguridad garantizada'],
          ] : [
            ['+', stats.experience, '', stats.experienceLabel || 'años de experiencia'],
            ['', stats.warranty, '', stats.warrantyLabel || 'años de garantía'],
            ['+', stats.installations, '', stats.installationsLabel],
          ]
          return (
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-center items-center gap-12 md:gap-28 px-6">
              {statItems.map(([prefix, value, suffix, label], i) => (
                <div key={i} className="text-center flex flex-col items-center">
                  <div className="flex items-baseline justify-center" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: 'rgb(0,0,0)', fontSize: 'clamp(56px, 8vw, 88px)', lineHeight: '88px' }}>
                    {prefix && <span>{prefix}</span>}
                    <AnimatedNumber value={value} />
                    {suffix && <span>{suffix}</span>}
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, color: 'rgb(0,0,0)', fontSize: '16px', lineHeight: '40px' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </section>

      {/* ── Causas de goteras: photo cards right below stats (goteras only) ── */}
      {slug === 'reparacion-de-goteras' && featuresSection && (
        <section className="py-16 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center font-semibold text-[26px] md:text-[28px] text-[#111827] mb-10">
              {withSite(featuresSection.title, site)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {featuresSection.features.map((f, i) => {
                const src = f.image?.url ? (optimizedImageUrl(f.image.url.startsWith('http') ? f.image.url : `${strapiUrl}${f.image.url}`)) : null
                const isWide = featuresSection.features.length % 2 === 1 && i === featuresSection.features.length - 1
                return (
                  <div key={i} className={`rounded-[12px] overflow-hidden border border-slate-200 bg-white ${isWide ? 'sm:col-span-2' : ''}`}>
                    <div className={`relative bg-slate-100 ${isWide ? 'aspect-[3/1]' : 'aspect-[2/1]'}`}>
                      {src && <img src={src} alt={autoAlt(f.altImage, f.image, [f.title, featuresSection.title], site)} width={f.image?.width || 800} height={f.image?.height || 600} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-[#24274D] text-[16px] mb-1.5">{f.title}</h3>
                      <p className="text-[13px] text-slate-600 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Brands (goteras: right below causes) ── */}
      {slug === 'reparacion-de-goteras' && brandsSectionEl}

      {/* ── Comparison intro + Differences + Brands + Precios (claraboyas only) ── */}
      {slug === 'instalacion-y-reparacion-de-claraboyas' && comparisonSectionEl}
      {slug === 'instalacion-y-reparacion-de-claraboyas' && featuresSectionEl}
      {slug === 'instalacion-y-reparacion-de-claraboyas' && brandsSectionEl}
      {slug === 'instalacion-y-reparacion-de-claraboyas' && tabsSectionEl}

      {/* ── Service List (title + expandable items with price) ── */}
      {((serviceList && Array.isArray(serviceList.items) && serviceList.items.length > 0) || (slug === 'reparacion-de-tejados-y-cubiertas' && tiposSection)) && (() => {
        const title = slug === 'reparacion-de-tejados-y-cubiertas' ? tiposSection.title : serviceList.title;
        const items = slug === 'reparacion-de-tejados-y-cubiertas' ? tiposSection.tipos : serviceList.items;

        return (
          <section className="py-16 px-6 bg-white border-b border-gray-100">
            <div className="max-w-[1140px] mx-auto flex flex-col md:flex-row gap-12 md:gap-24">
              <div className="w-full md:w-1/3">
                <h2 className="font-semibold text-[32px] md:text-[36px] leading-tight text-[#11181C]">
                  {withSite(title, site)}
                </h2>
              </div>
              <div className="w-full md:w-2/3 space-y-3">
                {items.map((item, i) => {
                  const isActive = activeServiceItem === i;
                  return (
                    <div
                      key={i}
                      className={`rounded-[16px] overflow-hidden transition-all duration-300 ${isActive ? 'bg-[#F4F7FB]' : 'bg-[#FAFAFA]'}`}
                    >
                      <button
                        onClick={() => setActiveServiceItem(isActive ? null : i)}
                        className="w-full text-left px-8 py-5 flex justify-between items-center transition-colors"
                      >
                        <span className="font-medium text-[15px] text-[#11181C] pr-8">{item.title}</span>
                        <span className="text-[#3b82f6] font-medium text-[24px] leading-none shrink-0 flex items-center justify-center w-6 h-6 mb-1">
                          {isActive ? '−' : '+'}
                        </span>
                      </button>
                      <div
                        className="px-8 overflow-hidden transition-all duration-300 ease-in-out"
                        style={{ maxHeight: isActive ? '300px' : '0px', paddingBottom: isActive ? '24px' : '0' }}
                      >
                        {(item.desc || item.text) && (
                          <p className="text-[14px] text-slate-600 leading-relaxed font-medium mb-2">
                            {item.desc || item.text}
                          </p>
                        )}
                        {(item.price || item.subt) && (
                          <p className="text-[14px] text-slate-600 leading-relaxed font-medium">
                            {item.price || item.subt}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── Brands Section (directly below Service List, this service only) ── */}
      {(slug === 'instalacion-tejados-panel-sandwich' || slug === 'reparacion-de-tejados-y-cubiertas' || slug === 'rehabilitacion-de-fachadas') && brandsSectionEl}

      {/* ── Applications gallery (types of projects) ── */}
      {slug !== 'impermeabilizaciones' && applicationsSectionEl}

      {/* ── Brands Section (impermeabilizaciones: below applicationsSection) ── */}
      {slug === 'impermeabilizaciones' && brandsSectionEl}

      {/* ── Brands Section (onduline: right below applications carousel) ── */}
      {slug === 'instalacion-de-onduline-bajo-teja' && brandsSectionEl}

      {/* ── Services Tabs Section ── */}
      {slug !== 'instalacion-tejados-panel-sandwich' && slug !== 'instalacion-y-reparacion-de-claraboyas' && slug !== 'impermeabilizaciones' && tabsSectionEl}

      {/* ── Como detectar filtraciones: left title + numbered 2x2 cards (goteras only) ── */}
      {slug === 'reparacion-de-goteras' && benefitsWindowSection && (
        <section className="py-24 px-6 bg-white">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 md:gap-16 items-start">
            <div className="w-full md:w-1/3">
              <h2 className="font-semibold text-[28px] md:text-[32px] leading-tight text-[#11181C]">
                {withSite(benefitsWindowSection.title, site)}
              </h2>
            </div>
            <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {benefitsWindowSection.benefits.map((b, i) => (
                <div key={i} className="bg-[#F4F7FB] border border-slate-100 p-6 rounded-[16px]">
                  <div className="w-8 h-8 rounded-full bg-[#24274D] text-white flex items-center justify-center text-[14px] font-semibold mb-4">
                    {i + 1}
                  </div>
                  <h3 className="font-medium text-[#2B2B2B] text-[16px] mb-2">{b.title}</h3>
                  <p className="text-[14px] text-slate-600 leading-[1.6]">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Brands Section (canalones, mantenimiento, aislamiento, humedades: between tabs and types) ── */}
      {(slug === 'instalacion-de-canalones' || slug === 'mantenimiento-y-limpieza-de-tejados-y-canalones' || slug === 'aislamiento-termico-y-acustico' || slug === 'reparacion-de-humedades' || slug === 'instalacion-y-reparacion-de-ventanas-velux') && brandsSectionEl}

      {/* ── Types Section (second tab-style group, e.g. Tipos de Claraboyas) ── */}
      {slug !== 'instalacion-y-reparacion-de-claraboyas' && slug !== 'reparacion-de-tejados-y-cubiertas' && slug !== 'retirada-de-amianto-uralita' && typesSectionEl}

      {/* ── Why Choose Section (right below types, velux only) ── */}
      {slug === 'instalacion-y-reparacion-de-ventanas-velux' && whyChooseSectionEl}

      {/* ── Factores de precio: icon cards 3-col (velux only) ── */}
      {slug === 'instalacion-y-reparacion-de-ventanas-velux' && benefitsWindowSection && (
        <section className="py-24 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-center font-semibold text-[26px] md:text-[28px] text-[#111827] mb-10">
              {withSite(benefitsWindowSection.title, site)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefitsWindowSection.benefits.map((b, i) => (
                <div key={i} className="bg-[#F8FAFC] border border-slate-100 p-6 rounded-[16px] text-left">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#3b82f6] mb-4">
                    <Icon icon={b.icon || 'check'} className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <h3 className="font-medium text-[#2B2B2B] text-[16px] mb-2">{b.title}</h3>
                  <p className="text-[14px] text-slate-600 leading-[1.6]">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* ── Applications Section (impermeabilizaciones: below typesSection) ── */}
      {slug === 'impermeabilizaciones' && applicationsSectionEl}

      {/* ── Process Section (impermeabilizaciones: below applicationsSection) ── */}
      {slug === 'impermeabilizaciones' && processSectionEl}

      {/* ── Features Section (Tipos de Materiales for impermeabilizaciones) ── */}
      {slug === 'impermeabilizaciones' && featuresSectionEl}

      {/* ── Why Choose Section (impermeabilizaciones: below featuresSection) ── */}
      {slug === 'impermeabilizaciones' && whyChooseSectionEl}

      {/* ── Brands Section (original position, all other pages) ── */}
      {slug !== 'instalacion-de-canalones' && slug !== 'instalacion-de-onduline-bajo-teja' && slug !== 'instalacion-tejados-panel-sandwich' && slug !== 'instalacion-y-reparacion-de-claraboyas' && slug !== 'reparacion-de-tejados-y-cubiertas' && slug !== 'mantenimiento-y-limpieza-de-tejados-y-canalones' && slug !== 'aislamiento-termico-y-acustico' && slug !== 'impermeabilizaciones' && slug !== 'reparacion-de-goteras' && slug !== 'reparacion-de-humedades' && slug !== 'instalacion-y-reparacion-de-ventanas-velux' && slug !== 'rehabilitacion-de-fachadas' && slug !== 'retirada-de-amianto-uralita' && slug !== 'trabajos-verticales' && brandsSectionEl}

      {/* ── Brands + Proceso + Types + WhyChoose (custom order, amianto/verticales only) ── */}
      {(slug === 'retirada-de-amianto-uralita' || slug === 'trabajos-verticales') && brandsSectionEl}
      {(slug === 'retirada-de-amianto-uralita' || slug === 'trabajos-verticales') && processSectionEl}
      {slug === 'retirada-de-amianto-uralita' && typesSectionEl}
      {(slug === 'retirada-de-amianto-uralita' || slug === 'trabajos-verticales') && whyChooseSectionEl}

      {/* ── Features 4 boxes ── */}
      {slug !== 'instalacion-y-reparacion-de-claraboyas' && slug !== 'reparacion-de-tejados-y-cubiertas' && slug !== 'impermeabilizaciones' && slug !== 'reparacion-de-goteras' && slug !== 'rehabilitacion-de-fachadas' && featuresSectionEl}

      {/* ── Table Durability ── */}
      {tableSection && (slug === 'instalacion-tejados-panel-sandwich' ? (
        <section className="py-24 px-6 bg-white">
          <div className="max-w-[1140px] mx-auto flex flex-col md:flex-row gap-12 md:gap-24 items-start">
            <div className="w-full md:w-1/3">
              <h2 className="font-semibold text-[28px] md:text-[32px] leading-tight text-[#11181C]">
                {withSite(tableSection.title, site)}
              </h2>
            </div>

            <div className="w-full md:w-2/3 bg-white rounded-[24px] overflow-hidden border border-slate-200 flex flex-col">
              {/* Table Header */}
              <div className="grid grid-cols-2 border-b border-slate-200">
                <div className="p-6 md:p-8 border-r border-slate-200">
                  <Icon icon="hammer" className="w-5 h-5 text-slate-700 mb-2" />
                  <div className="font-bold text-[18px] text-[#11181C]">{tableSection.header1}</div>
                </div>
                <div className="p-6 md:p-8">
                  <Icon icon="credit-card" className="w-5 h-5 text-slate-700 mb-2" />
                  <div className="font-bold text-[18px] text-[#11181C]">{tableSection.header2}</div>
                </div>
              </div>

              {/* Table Rows */}
              {tableSection?.rows?.map((row, i) => (
                <div key={i} className={`grid grid-cols-2 border-b border-slate-200 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}`}>
                  <div className="p-6 md:p-8 text-[16px] text-[#11181C] font-medium border-r border-slate-200">{row.m}</div>
                  <div className="p-6 md:p-8 text-[16px] text-slate-600">{row.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section
          ref={tableRef}
          style={{ opacity: tableVisible ? 1 : 0, transform: tableVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
          className="py-24 px-6 bg-[#F8FAFC] border-y border-slate-100"
        >
          <div className="max-w-4xl mx-auto flex flex-col gap-10">
            <div className="text-center">
              <h2 className="font-medium text-[32px] leading-none text-center text-[#2B2B2B]">
                {withSite(tableSection.title, site)}
              </h2>
            </div>

            <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-[#3b82f6]/30 flex flex-col">
              {/* Table Header */}
              <div className="grid grid-cols-2 border-b border-[#3b82f6]/10">
                {slug === 'instalacion-de-onduline-bajo-teja' ? (
                  <>
                    <div className="p-6 md:p-8 border-r border-[#3b82f6]/10">
                      <Icon icon="hammer" className="w-5 h-5 text-slate-700 mb-2" />
                      <div className="font-bold text-[18px] text-[#11181C]">{tableSection.header1}</div>
                    </div>
                    <div className="p-6 md:p-8">
                      <Icon icon="credit-card" className="w-5 h-5 text-slate-700 mb-2" />
                      <div className="font-bold text-[18px] text-[#11181C]">{tableSection.header2}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-6 md:p-8 font-bold text-[18px] text-[#11181C] border-r border-[#3b82f6]/10">{tableSection.header1}</div>
                    <div className="p-6 md:p-8 font-bold text-[18px] text-[#11181C]">{tableSection.header2}</div>
                  </>
                )}
              </div>

              {/* Table Rows */}
              {tableSection?.rows?.map((row, i) => (
                <div key={i} className={`grid grid-cols-2 border-b border-[#3b82f6]/10 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}`}>
                  <div className="p-6 md:p-8 text-[16px] text-[#11181C] font-medium border-r border-[#3b82f6]/10">{row.m}</div>
                  <div className="p-6 md:p-8 text-[16px] text-slate-600">{row.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ── Fases / Proceso (repositioned below the pricing table, this service only) ── */}
      {slug === 'instalacion-de-canalones' && processSectionEl}

      {/* ── Services Tabs Section (repositioned below the pricing table, this service only) ── */}
      {slug === 'instalacion-tejados-panel-sandwich' && tabsSectionEl}

      {/* ── Comparison Table ── */}
      {compareSection && <section
        ref={compareRef}
        style={{ opacity: compareVisible ? 1 : 0, transform: compareVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
        className="py-20 px-6 bg-[#F1F5F9]"
      >
        <div className="max-w-[820px] mx-auto flex flex-col gap-10">
          <h2 className="text-center font-semibold text-[26px] md:text-[28px] text-[#111827]">
            {withSite(compareSection.title, site)}
          </h2>

          <div className="bg-white rounded-[24px] shadow-sm p-3 md:p-4 overflow-x-auto">
            <div className="min-w-[560px] grid grid-cols-[180px_1fr_1fr] relative">
              {/* Header Row */}
              <div className="p-6 flex flex-col justify-end"></div>

              <div className="bg-[#FFFEFA] p-6 border border-amber-300 border-b-0 rounded-t-[16px] relative z-10 flex flex-col items-start gap-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                <h3 className="font-medium text-[18px] text-[#111827]">{compareSection.col1}</h3>
              </div>

              <div className="p-6 flex flex-col items-start gap-2">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                <h3 className="font-medium text-[18px] text-[#111827]">{compareSection.col2}</h3>
              </div>

              {/* Data Rows */}
              {compareSection?.rows?.map((row, i) => {
                const isLast = i === compareSection.rows.length - 1;
                const zebra = i % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white';
                return (
                  <Fragment key={i}>
                    <div className={`p-6 flex items-center gap-2.5 ${zebra}`}>
                      <Icon icon={row.icon} className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-[15px] text-[#111827]">{row.label}</span>
                    </div>

                    <div className={`px-6 py-6 border-x border-amber-300 relative z-10 flex items-center bg-[#FFFEFA] ${isLast ? 'border-b rounded-b-[16px]' : ''}`}>
                      <p className="text-[15px] text-[#111827] leading-relaxed">
                        {row.replace}
                      </p>
                    </div>

                    <div className={`p-6 flex items-center ${zebra}`}>
                      <p className="text-[15px] text-[#111827] leading-relaxed">
                        {row.repair}
                      </p>
                    </div>
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </section>}

      {/* ── Fases / Proceso ── */}
      {slug !== 'instalacion-de-canalones' && slug !== 'impermeabilizaciones' && slug !== 'retirada-de-amianto-uralita' && slug !== 'trabajos-verticales' && processSectionEl}

      {/* ── Tiempos de proyecto: photo cards (fachadas only) + Why Choose ── */}
      {slug === 'rehabilitacion-de-fachadas' && featuresSectionEl}
      {slug === 'rehabilitacion-de-fachadas' && whyChooseSectionEl}

      {/* ── Why Choose Section (right below process, goteras/humedades only) ── */}
      {(slug === 'reparacion-de-goteras' || slug === 'reparacion-de-humedades') && whyChooseSectionEl}

      {/* ── Types Section + Why Choose Section (repositioned right below the process section, claraboyas only) ── */}
      {slug === 'instalacion-y-reparacion-de-claraboyas' && typesSectionEl}
      {slug === 'instalacion-y-reparacion-de-claraboyas' && whyChooseSectionEl}
      {slug === 'instalacion-y-reparacion-de-claraboyas' && benefitsIntroSectionEl}

      {/* ── Why Choose Section (repositioned right below the process section, panel-sandwich only) ── */}
      {(slug === 'instalacion-tejados-panel-sandwich' || slug === 'mantenimiento-y-limpieza-de-tejados-y-canalones' || slug === 'aislamiento-termico-y-acustico') && whyChooseSectionEl}

      {/* ── Beneficios (segundo grid) ── */}
      {benefitsSection && (
        <section
          ref={benefitsRef}
          style={{ opacity: benefitsVisible ? 1 : 0, transform: benefitsVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
          className="py-24 px-6 bg-white"
        >
          <div className="max-w-6xl mx-auto">
            <h2 className={['instalacion-tejados-panel-sandwich', 'instalacion-y-reparacion-de-claraboyas', 'mantenimiento-y-limpieza-de-tejados-y-canalones'].includes(slug) ? "text-left font-medium text-[26px] md:text-[28px] text-[#111827] mb-10" : "text-center font-normal text-[26px] md:text-[28px] text-[#111827] mb-12"}>
              {(benefitsSection.title || '').replace(/\{site\}/g, site)}
            </h2>

            {slug === 'reparacion-de-goteras' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {benefitsSection.benefits.map((b, i) => (
                  <div key={i} className="bg-[#F8FAFC] border border-slate-100 p-8 rounded-[16px] text-left">
                    <div className="w-8 h-8 rounded-full bg-[#24274D] text-white flex items-center justify-center text-[14px] font-semibold mb-4">
                      {i + 1}
                    </div>
                    <h3 className="font-medium text-[#2B2B2B] text-[17px] mb-3">{b.title}</h3>
                    <p className="text-[14px] text-slate-600 leading-[1.6]">{b.desc}</p>
                  </div>
                ))}
              </div>
            ) : slug === 'impermeabilizaciones' && benefitsSection.benefits.length === 4 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(() => {
                  const [b0, b1, b2, b3] = benefitsSection.benefits;
                  const card = (b, i) => (
                    <div key={i} className="bg-[#F8FAFC] border border-slate-100 p-6 rounded-[16px] text-left">
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#3b82f6] mb-4">
                        <Icon icon={b.icon || 'check'} className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <h3 className="font-medium text-[#2B2B2B] text-[16px] mb-2">{b.title}</h3>
                      <p className="text-[14px] text-slate-600 leading-[1.6]">{b.desc}</p>
                    </div>
                  );
                  // Bento images come from benefitsSection.images (editable in Strapi)
                  const gridImgs = (benefitsSection.images || []).map(img =>
                    img?.url ? (optimizedImageUrl(img.url.startsWith('http') ? img.url : `${strapiUrl}${img.url}`)) : null
                  ).filter(Boolean)
                  const image = (src, alt, i) => src ? (
                    <div key={`img-${i}`} className="hidden sm:block rounded-[16px] overflow-hidden border border-slate-100">
                      <img width="800" height="600" src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ) : null;
                  return [
                    card(b0, 0),
                    card(b1, 1),
                    image(gridImgs[0], autoAlt(benefitsSection.altImage, null, [b0?.title, benefitsSection.title], site), 2),
                    card(b2, 3),
                    image(gridImgs[1], autoAlt(benefitsSection.altImage, null, [b2?.title, benefitsSection.title], site), 4),
                    card(b3, 5),
                  ].filter(Boolean);
                })()}
              </div>
            ) : (slug === 'instalacion-de-canalones' || slug === 'reparacion-de-humedades' || slug === 'instalacion-y-reparacion-de-ventanas-velux') ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {benefitsSection.benefits.map((b, i) => {
                  return (
                    <div key={i} className="bg-white border border-slate-100 p-8 rounded-[12px] text-left shadow-sm hover:shadow-md transition-shadow">
                      <Icon icon={b.icon} className="w-6 h-6 text-[#3b82f6] mb-5" strokeWidth={1.5} />
                      <h3 className="font-medium text-[#111827] text-[17px] mb-3">{b.title}</h3>
                      <p className="text-[15px] text-slate-600 leading-relaxed">{b.desc}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${['aislamiento-termico-y-acustico', 'instalacion-de-onduline-bajo-teja', 'instalacion-tejados-panel-sandwich', 'instalacion-y-reparacion-de-claraboyas', 'reparacion-de-tejados-y-cubiertas', 'mantenimiento-y-limpieza-de-tejados-y-canalones', 'reformas-integrales', 'rehabilitacion-de-fachadas', 'retirada-de-amianto-uralita', 'trabajos-verticales'].includes(slug) ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
                {benefitsSection.benefits.map((b, i) => {
                  // Determine if we apply the bento-box 3-column layout where the first item spans 2 rows
                  const isBento = ['instalacion-de-onduline-bajo-teja', 'reparacion-de-tejados-y-cubiertas'].includes(slug);
                  const isAislamientoBento = slug === 'aislamiento-termico-y-acustico' && benefitsSection.benefits.length === 8;
                  const bgClass = isAislamientoBento ? 'bg-white' : 'bg-[#F8FAFC]';
                  const pClass = isAislamientoBento ? 'p-8' : 'p-6';
                  const roundedClass = isAislamientoBento ? 'rounded-lg' : 'rounded-[16px]';
                  const iconWrapperClass = isAislamientoBento ? 'w-10 h-10 rounded-md bg-[#F4F7FB] flex items-center justify-center text-[#3b82f6] mb-4' : 'w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#3b82f6] mb-4';

                  const content = (
                    <div key={i} className={`${bgClass} border border-slate-100 ${pClass} ${roundedClass} text-left ${isBento && i === 0 ? 'lg:row-span-2' : ''} ${isAislamientoBento ? 'shadow-sm hover:shadow-md transition-shadow' : ''}`}>
                      <div className={iconWrapperClass}>
                        <Icon icon={b.icon || 'check'} className="w-5 h-5" strokeWidth={isAislamientoBento ? 1.5 : 2} />
                      </div>
                      <h3 className="font-medium text-[#2B2B2B] text-[16px] mb-2">{b.title}</h3>
                      <p className="text-[14px] text-slate-600 leading-[1.6]">{b.desc}</p>
                    </div>
                  );

                  if (isAislamientoBento && i === 4) {
                    const centerImageSrc = benefitsSection.image?.url
                      ? (optimizedImageUrl(benefitsSection.image.url.startsWith('http') ? benefitsSection.image.url : `${strapiUrl}${benefitsSection.image.url}`))
                      : null;

                    return [
                      <div key={`img-${i}`} className="hidden lg:block rounded-lg overflow-hidden border border-slate-100 shadow-sm flex items-center justify-center bg-white">
                        {centerImageSrc && (
                          <img width="800" height="600" src={centerImageSrc} alt={autoAlt(benefitsSection.altImage, benefitsSection.image, [benefitsSection.title, data.pageTitle], site)} className="w-full h-full object-cover" />
                        )}
                      </div>,
                      content
                    ]
                  }

                  return content;
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Subvenciones / Financial Aid (fachadas only) ── */}
      {slug === 'rehabilitacion-de-fachadas' && data.financialAidSection && (() => {
        const fa = data.financialAidSection
        const img2 = fa.image?.url ? (optimizedImageUrl(fa.image.url.startsWith('http') ? fa.image.url : `${strapiUrl}${fa.image.url}`)) : null
        return (
          <section className="py-24 px-6 bg-white">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10 items-start">
              {img2 && (
                <div className="w-full lg:w-2/5 shrink-0 rounded-[16px] overflow-hidden">
                  <img width="800" height="600" src={img2} alt={autoAlt(fa.altImage, fa.image, [fa.title, data.pageTitle], site)} className="w-full h-auto object-cover" loading="lazy" />
                </div>
              )}
              <div className="w-full lg:w-3/5">
                <h2 className="font-semibold text-[26px] md:text-[28px] text-[#111827] mb-4 leading-tight">
                  {withSite(fa.title, site)}
                </h2>
                {fa.paragraph1 && <p className="text-[15px] text-slate-600 leading-relaxed mb-8">{withSite(fa.paragraph1, site)}</p>}

                {Array.isArray(fa.requirements) && fa.requirements.length > 0 && (
                  <>
                    <h3 className="font-semibold text-[20px] text-[#111827] mb-4">{fa.requirementsTitle}</h3>
                    <ul className="space-y-3 mb-8">
                      {fa.requirements.map((r, i) => (
                        <li key={i} className="text-[15px] text-slate-700">{r}</li>
                      ))}
                    </ul>
                  </>
                )}

                {Array.isArray(fa.procedures) && fa.procedures.length > 0 && (
                  <>
                    <h3 className="font-semibold text-[20px] text-[#111827] mb-4">{fa.proceduresTitle}</h3>
                    <ul className="space-y-3 mb-8">
                      {fa.procedures.map((p, i) => (
                        <li key={i} className="text-[15px] text-slate-700">{p}</li>
                      ))}
                    </ul>
                  </>
                )}

                <a href="/contacto" className="inline-flex items-center gap-2 bg-[#24274D] text-white px-6 py-3 rounded-lg font-medium text-[15px] hover:bg-[#1a1d38] transition-colors">
                  Solicita Presupuesto Gratis
                </a>
              </div>
            </div>
          </section>
        )
      })()}

      {/* ── FAQ + Banner (right below Beneficios/Subvenciones, velux/reformas-integrales/fachadas only) ── */}
      {(slug === 'instalacion-y-reparacion-de-ventanas-velux' || slug === 'reformas-integrales') && faqSectionEl}
      {(slug === 'instalacion-y-reparacion-de-ventanas-velux' || slug === 'reformas-integrales') && bannerSectionEl}

      {/* ── Why Choose Section (original position, all other pages) ── */}
      {slug !== 'instalacion-tejados-panel-sandwich' && slug !== 'instalacion-y-reparacion-de-claraboyas' && slug !== 'mantenimiento-y-limpieza-de-tejados-y-canalones' && slug !== 'aislamiento-termico-y-acustico' && slug !== 'impermeabilizaciones' && slug !== 'reparacion-de-goteras' && slug !== 'reparacion-de-humedades' && slug !== 'instalacion-y-reparacion-de-ventanas-velux' && slug !== 'rehabilitacion-de-fachadas' && slug !== 'retirada-de-amianto-uralita' && slug !== 'trabajos-verticales' && whyChooseSectionEl}

      {/* ── FAQ Section (repositioned directly below benefits for this service only) ── */}
      {slug === 'reparacion-de-tejados-y-cubiertas' && faqSectionEl}

      {/* ── Beneficios (segundo grupo, e.g. Lucernarios) ── */}
      {slug !== 'reparacion-de-goteras' && slug !== 'instalacion-y-reparacion-de-ventanas-velux' && benefitsWindowSection && (
        <section
          ref={benefitsWindowRef}
          style={{ opacity: benefitsWindowVisible ? 1 : 0, transform: benefitsWindowVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
          className="py-24 px-6 bg-white"
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="text-center font-semibold text-[26px] md:text-[28px] text-[#111827] mb-10">
              {withSite(benefitsWindowSection.title, site)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefitsWindowSection.benefits.map((b, i) => (
                <div key={i} className="bg-[#F8FAFC] p-6 rounded-[12px] border border-slate-100 text-center flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#DBEAFE] flex items-center justify-center text-blue-600 mb-3">
                    <Icon icon={b.icon} className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-[#111827] text-[15px] mb-2">{b.title}</h3>
                  <p className="text-[13px] text-slate-600 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Banner Action (repositioned right above FAQ, claraboyas only) ── */}
      {slug === 'instalacion-y-reparacion-de-claraboyas' && bannerSectionEl}

      {/* ── FAQs (repositioned right below Beneficios de los lucernarios, claraboyas only) ── */}
      {slug === 'instalacion-y-reparacion-de-claraboyas' && faqSectionEl}
      {slug === 'instalacion-y-reparacion-de-claraboyas' && exploreSectionEl}

      {/* ── Banner Action (original position, all other pages) ── */}
      {slug !== 'instalacion-y-reparacion-de-claraboyas' && slug !== 'impermeabilizaciones' && slug !== 'reparacion-de-goteras' && slug !== 'reparacion-de-humedades' && slug !== 'instalacion-y-reparacion-de-ventanas-velux' && slug !== 'reformas-integrales' && slug !== 'rehabilitacion-de-fachadas' && slug !== 'retirada-de-amianto-uralita' && slug !== 'trabajos-verticales' && bannerSectionEl}

      {/* ── Explora nuestro servicio (original position, all other pages) ── */}
      {slug !== 'instalacion-y-reparacion-de-claraboyas' && slug !== 'reformas-integrales' && exploreSectionEl}

      {/* ── Explora nuestro servicio (repositioned right below FAQ+Banner, reformas-integrales only) ── */}
      {slug === 'reformas-integrales' && exploreSectionEl}

      {/* ── Zonas de Trabajo + Map ── */}
      <section
        ref={zonasRef}
        style={{ opacity: zonasVisible ? 1 : 0, transform: zonasVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
        className="py-24 px-6 bg-white"
      >
        <div className="max-w-[1140px] mx-auto">
          <h2 className="font-medium text-[32px] leading-tight text-[#2B2B2B] mb-10">
            Zonas donde prestamos servicio
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="w-full">
              {(() => {
                const allCities = [...new Set((serviceCities || []).filter(Boolean))]
                const fmtCity = (c) => c.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                return allCities.length > 0 && (
                  <div className="mb-10">
                    <p className="text-[14px] font-medium text-slate-500 mb-4">Principales Zonas de Servicio</p>
                    <div className="flex flex-wrap gap-3">
                      {allCities.map((c, i) => {
                        const isActive = c === city
                        return (
                          <a
                            key={i}
                            href={`/${slug}/${c}`}
                            aria-current={isActive ? 'page' : undefined}
                            className={`inline-flex items-center justify-between gap-6 text-[14px] font-medium px-5 py-3 rounded-[10px] min-w-[150px] transition-colors ${
                              isActive
                                ? 'bg-[#F1BF00] text-[#11181C] hover:bg-[#e0b200]'
                                : 'bg-[#24274D] text-white hover:bg-[#1a1d38]'
                            }`}
                          >
                            {fmtCity(c)}
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" /></svg>
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {otherZonas.length > 0 && (
                <div>
                  <p className="text-[14px] font-medium text-slate-500 mb-4">Más Ubicaciones</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-6">
                    {(zonasExpanded ? otherZonas : otherZonas.slice(0, 6)).map((z, i) => {
                      const pageTitle = data.pageTitle || ''
                      const lastEnIdx = pageTitle.lastIndexOf(' en ')
                      const serviceLabel = lastEnIdx > -1 ? pageTitle.slice(0, lastEnIdx) : pageTitle
                      return (
                        <a key={i} href={z.href || '#'} className="flex items-start gap-2 text-[15px] leading-[22px] font-normal text-slate-800 hover:text-[#24274D] transition-colors">
                          <svg className="w-4 h-4 mt-0.5 text-slate-800 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          <span>{serviceLabel} en <span className="font-bold">{z.city}</span></span>
                        </a>
                      )
                    })}
                  </div>
                  {otherZonas.length > 6 && (
                    <button
                      onClick={() => setZonasExpanded(!zonasExpanded)}
                      className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-[10px] py-3 text-[14px] font-medium text-[#11181C] hover:border-slate-300 hover:bg-slate-50 transition-colors"
                    >
                      {zonasExpanded ? 'Ver menos ubicaciones' : 'Ver todas las demás ubicaciones'}
                      <svg className={`w-4 h-4 transition-transform duration-300 ${zonasExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="w-full h-[360px] md:h-[420px] rounded-[16px] overflow-hidden opacity-90 relative shadow-sm border border-slate-200/60">
              <iframe
                src={contact?.mapEmbedUrl || `https://maps.google.com/maps?q=${data.zonasMap?.defaultLocation || site || 'Madrid'}&t=&z=10&ie=UTF8&iwloc=&output=embed`}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa de Zonas de Servicio"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* ── Banner Action (repositioned right below Zonas+Map, impermeabilizaciones only) ── */}
      {slug === 'impermeabilizaciones' && bannerSectionEl}

      {/* ── Preguntas Frecuentes (original position) ── */}
      {slug !== 'instalacion-y-reparacion-de-claraboyas' && slug !== 'reparacion-de-tejados-y-cubiertas' && slug !== 'instalacion-y-reparacion-de-ventanas-velux' && slug !== 'reformas-integrales' && faqSectionEl}

      {/* ── Banner Action (repositioned right below FAQ, goteras/humedades/fachadas/amianto only) ── */}
      {(slug === 'reparacion-de-goteras' || slug === 'reparacion-de-humedades' || slug === 'rehabilitacion-de-fachadas' || slug === 'retirada-de-amianto-uralita' || slug === 'trabajos-verticales') && bannerSectionEl}

      {/* ── Hidden SEO Section ── */}
      {data.hiddenSection && (() => {
        const formattedDate = data.publishedAt
          ? new Date(data.publishedAt).toLocaleDateString('es-ES', { month: '2-digit', day: '2-digit', year: 'numeric' })
          : '13/06/2026';

        let rawMarkdown = typeof data.hiddenSection === 'string' ? data.hiddenSection : '';
        if (rawMarkdown) {
          const authorHtml = `\n\n<div class="flex items-center gap-3 mt-4 mb-8 not-prose">\n  <img width="40" height="40" src="/assets/logo.webp" alt="Top Tejados" class="w-10 h-10 object-contain p-1 border border-slate-200 rounded-full shadow-sm bg-white" />\n  <span class="text-[14px] text-slate-600 font-medium">\n    <strong class="text-[#0E0C29] font-bold">TOP</strong> Escrito por <strong class="text-[#0E0C29]">Top Tejados</strong> &nbsp;·&nbsp; ${formattedDate}\n  </span>\n</div>\n\n`;

          if (/(^#{1,2}\s+.*(?:\r?\n)+)/m.test(rawMarkdown)) {
            rawMarkdown = rawMarkdown.replace(/(^#{1,2}\s+.*(?:\r?\n)+)/m, `$1${authorHtml}`);
          } else {
            rawMarkdown = authorHtml + rawMarkdown;
          }
        }

        return (
          <section className="py-24 px-6 bg-white border-t border-slate-100/60">
            <div className="max-w-4xl mx-auto">
              <div className={`relative overflow-hidden transition-all duration-700 ease-in-out ${seoExpanded ? '' : 'max-h-[280px]'}`}>
                <div
                  className="[&_h1]:text-[28px] md:[&_h1]:text-[36px] [&_h1]:font-bold [&_h1]:text-[#11181C] [&_h1]:mb-2 [&_h1]:leading-[1.2] [&_p]:text-[15px] md:[&_p]:text-[16px] [&_p]:text-slate-600 [&_p]:leading-[1.8] [&_p]:mb-5 [&_h2]:text-[24px] [&_h2]:font-semibold [&_h2]:text-[#11181C] [&_h2]:mt-10 [&_h2]:mb-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_ul]:text-[15px] md:[&_ul]:text-[16px] [&_ul]:text-slate-600 [&_li]:mb-2 [&_strong]:font-bold [&_strong]:text-[#11181C] [&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-800"
                >
                  {Array.isArray(data.hiddenSection)
                    ? renderBlocks(data.hiddenSection)
                    : typeof data.hiddenSection === 'string'
                      ? <div dangerouslySetInnerHTML={{ __html: String(marked.parse(rawMarkdown))
                          // Page already has its hero <h1>; markdown "# " headings here
                          // would add a second one. Demote to <h2> styled identically.
                          .replace(/<h1(\s[^>]*)?>/g, '<h2 style="font-size:clamp(28px,4vw,36px);font-weight:700;color:#11181C;margin:0 0 8px;line-height:1.2">')
                          .replace(/<\/h1>/g, '</h2>') }} />
                      : null}
                </div>

                {/* Fade out gradient when collapsed */}
                {!seoExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                )}
              </div>

              {/* Toggle Button */}
              <button
                onClick={() => setSeoExpanded(!seoExpanded)}
                className="mt-6 font-bold text-[15px] text-[#0f172a] hover:text-blue-600 transition-colors flex items-center gap-2"
              >
                {seoExpanded ? 'Leer menos' : 'Leer más'}
              </button>
            </div>
          </section>
        )
      })()}

    </div>
  )
}
