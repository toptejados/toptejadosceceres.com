import { useState, useEffect, useRef } from 'react'
import RecentBlogsSection from './RecentBlogsSection.jsx'
import { optimizedImageUrl, responsiveImage, resolveStrapiImage, HERO_SIZES, FORMAT_WIDTHS, autoAlt } from '../lib/site.js'
import SmartImage from './SmartImage.jsx'

// The 16 real service page slugs — used to validate category links so the
// services section never links to a slug that has no page (404).
// Inline initials avatar (SVG data URI) — no external avatar service, so no
// extra requests and nothing to fail offline.
export const initialsAvatar = (name) => {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="#24274D"/><text x="75" y="78" text-anchor="middle" dominant-baseline="middle" font-family="Inter,Arial,sans-serif" font-size="64" font-weight="600" fill="#ffffff">${initial}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const SERVICE_SLUGS = new Set([
  'construccion-de-tejados-y-cubiertas', 'reparacion-de-tejados-y-cubiertas',
  'instalacion-de-onduline-bajo-teja', 'instalacion-tejados-panel-sandwich',
  'instalacion-y-reparacion-de-claraboyas', 'instalacion-de-canalones',
  'mantenimiento-y-limpieza-de-tejados-y-canalones', 'aislamiento-termico-y-acustico',
  'impermeabilizaciones', 'reparacion-de-goteras', 'reparacion-de-humedades',
  'instalacion-y-reparacion-de-ventanas-velux', 'reformas-integrales',
  'rehabilitacion-de-fachadas', 'retirada-de-amianto-uralita', 'trabajos-verticales',
])

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

export default function HomeContent({ site, data, apiUrl, phone, email, waLink, socials }) {
  const homeData = data || {};
  const hasContent = data && Object.keys(data).length > 0;
  const sitePhone = phone || '+34 900 000 000'
  const siteEmail = email || `contacto@tejados${site || 'burgos'}.es`
  const siteWaLink = `https://api.whatsapp.com/send/?phone=${sitePhone.replace(/[^0-9]/g, '')}&text&type=phone_number&app_absent=0`

  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [openService, setOpenService] = useState({}) // services accordion: {catIdx: itemIdx}
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (status === 'loading') return

    setStatus('loading')
    setErrorMessage('')

    try {
      const payload = {
        data: {
          site: site || 'Toledo',
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          service: 'presupuesto-gratuito'
        }
      }

      const response = await fetch(`${apiUrl}/api/contact-forms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Error al enviar el formulario. Por favor, inténtelo de nuevo.')
      }

      setStatus('success')
      setFormData({ name: '', email: '', phone: '', message: '' })
    } catch (err) {
      console.error('Submission error:', err)
      setErrorMessage(err.message)
      setStatus('error')
    }
  }

  const testimonials = (homeData.testimonials?.list || []).filter(t => t.isShow !== false)

  useEffect(() => {
    if (!testimonials.length) return;
    const timer = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  const [servicesRef, servicesVisible] = useReveal(0.1)
  const [projectsRef, projectsVisible] = useReveal(0.1)
  const [testimonialsRef, testimonialsVisible] = useReveal(0.1)
  const [whyUsRef, whyUsVisible] = useReveal(0.1)
  const [blogRef, blogVisible] = useReveal(0.1)
  const [ctaRef, ctaVisible] = useReveal(0.1)

  const resolveImageSrc = (imageOrUrl, preferredFormat = 'large') =>
    resolveStrapiImage(imageOrUrl, preferredFormat, apiUrl).src;

  const getImageUrl = (imageOrUrl, preferredFormat = 'large') => {
    const abs = resolveImageSrc(imageOrUrl, preferredFormat);
    if (!abs) return '';
    return optimizedImageUrl(abs, FORMAT_WIDTHS[preferredFormat] || 800);
  };

  // src + srcSet + sizes + intrinsic width/height, built from the derivatives
  // Strapi actually holds for this media. `preferredFormat` is no longer a
  // parameter: the browser picks from the full ladder via `sizes`, which is
  // strictly better than us pre-committing to one named format.
  const getResponsive = (imageOrUrl, sizes) => responsiveImage(imageOrUrl, sizes, apiUrl);

  // Auto-derive alt text: an explicit `altImage` from Strapi wins verbatim,
  // otherwise the media's own alternativeText / a contextual title is used and
  // the site name is appended ("Tejados de Teja" -> "Tejados de Teja en Cantabria").
  // Shared with the service and zona pages — see autoAlt() in lib/site.js.
  const getAutoAlt = (explicit, image, contextTitles = []) => autoAlt(explicit, image, contextTitles, site);

  if (!hasContent) return null;

  return (
    <div className="bg-white">
      {/* ── Hero Section ── */}
      {homeData.hero && (
        <section
          className="pt-32 pb-16 px-6 relative bg-white"
        >
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-[28px] md:text-[36px] font-medium text-black leading-[42px] mb-6">
              {homeData.hero.titlePrefix}
            </h1>
            <p className="text-slate-600 max-w-2xl mx-auto mb-8 text-[15px] leading-relaxed">
              {homeData.hero.description}
            </p>
            <div className="flex justify-center gap-4 mb-16">
              {homeData.hero.primaryLink && (
                <a href={homeData.hero.primaryLink.url} className="bg-[#24274D] text-white px-7 py-3 rounded-md font-medium text-[14px] hover:bg-[#1a1d38] transition-colors">
                  {homeData.hero.primaryLink.text}
                </a>
              )}
              {homeData.hero.secondaryLink && (
                <a href={homeData.hero.secondaryLink.url} className="border border-[#e2e8f0] text-[#0E0C29] px-7 py-3 rounded-md font-medium text-[14px] hover:bg-slate-50 transition-colors">
                  {homeData.hero.secondaryLink.text}
                </a>
              )}
            </div>
            {homeData.hero.image && (
              <div className="mb-16">
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <SmartImage
                    {...getResponsive(homeData.hero.image, HERO_SIZES)}
                    alt={getAutoAlt(homeData.hero.altImage, homeData.hero.image, [homeData.hero.titlePrefix])}
                    className="w-full h-[300px] md:h-[450px] object-cover"
                    fetchPriority="high"
                    loading="eager"
                  />
                </div>
                {homeData.hero.captionImage && (
                  <p className="text-center text-[13px] text-slate-400 mt-3 italic">
                    {homeData.hero.captionImage}
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-32">
              {(homeData.hero.stats || []).map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-[88px] leading-[88px] font-[600] text-black mb-1 font-['Inter',sans-serif]">
                    <AnimatedNumber value={stat.value} prefix={stat.prefix} />
                  </div>
                  <div className="text-[13px] text-slate-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Services Strip ── */}
      {homeData.services && (
        <section
          id="services"
          ref={servicesRef}
          style={{ opacity: servicesVisible ? 1 : 0, transform: servicesVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
          className="py-24 px-6 bg-white border-t border-slate-100 scroll-mt-20"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-[16px] leading-[16px] font-[500] text-black mb-4 font-['Inter',sans-serif]">{homeData.services.subtitle}</p>
              <h2 className="text-[32px] leading-[32px] font-[500] text-black font-['Inter',sans-serif] max-w-2xl mx-auto">
                {homeData.services.title}
              </h2>
            </div>

            <div className="flex flex-col gap-6">
              {(homeData.services.categories || []).map((category, idx) => {
                // Category urls in Strapi sometimes point at pages that don't
                // exist (/tejados/..., /canalones/...) — only link when the
                // slug is a real service page, else fall back to the first
                // item's url so the heading never links to a 404.
                const validServiceHref = (u) => typeof u === 'string' && /^\/[a-z0-9-]+\/[a-z0-9-]+\/?$/.test(u) && SERVICE_SLUGS.has(u.split('/')[1])
                const categoryHref = validServiceHref(category.url) ? category.url
                  : (category.items || []).map(it => it.url).find(validServiceHref) || null
                return (
                <div
                  key={idx}
                  className="group/card relative bg-[#F8FAFC] rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row gap-8 lg:gap-12 items-stretch border border-slate-100 overflow-hidden transition-all duration-500 ease-out hover:bg-white hover:border-slate-200 hover:shadow-[0_20px_60px_-15px_rgba(36,39,77,0.15)] hover:-translate-y-1"
                  style={{
                    opacity: servicesVisible ? 1 : 0,
                    transform: servicesVisible ? 'translateY(0)' : 'translateY(40px)',
                    transition: `opacity 0.7s ease ${idx * 0.12}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.12}s, background-color 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease`,
                  }}
                >
                  <div className="absolute inset-0 rounded-[24px] bg-gradient-to-r from-[#24274D]/0 via-[#24274D]/0 to-[#24274D]/0 group-hover/card:from-[#24274D]/[0.02] group-hover/card:via-transparent group-hover/card:to-transparent transition-all duration-700 pointer-events-none" />

                  <div className="w-full md:w-5/12 flex flex-col gap-4 relative z-10">
                    {categoryHref ? (
                      <a
                        href={categoryHref}
                        className="inline-flex items-center gap-2 text-[22px] md:text-[24px] font-semibold text-[#11181C] hover:text-[#24274D] transition-colors duration-300 w-fit"
                      >
                        <span className="relative">
                          {category.title}
                          <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-[#24274D] transition-all duration-500 ease-out group-hover/card:w-full" />
                        </span>
                      </a>
                    ) : (
                      <h3 className="text-[22px] md:text-[24px] font-semibold text-[#11181C]">
                        {category.title}
                      </h3>
                    )}
                    {category.image && (
                      <div className="flex flex-col gap-2">
                        <div className="relative rounded-[16px] overflow-hidden">
                          <SmartImage
                            {...getResponsive(category.image, '(min-width: 768px) 33vw, 100vw')}
                            alt={getAutoAlt(category.altImage, category.image, [category.title])}
                            className="w-full h-[180px] md:h-[220px] object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/card:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#24274D]/0 via-transparent to-transparent group-hover/card:from-[#24274D]/15 transition-all duration-500" />
                        </div>
                        {category.captionImage && (
                          <p className="text-[13px] text-slate-400 italic px-1">
                            {category.captionImage}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="w-full md:w-7/12 flex flex-col justify-center relative z-10">
                    {(category.items || []).map((s, i) => {
                      const isOpen = (openService[idx] ?? 0) === i
                      return (
                        <div
                          key={i}
                          className="border-b border-slate-200 last:border-0"
                          style={{
                            opacity: servicesVisible ? 1 : 0,
                            transform: servicesVisible ? 'translateX(0)' : 'translateX(20px)',
                            transition: `opacity 0.5s ease ${0.2 + idx * 0.12 + i * 0.05}s, transform 0.5s ease ${0.2 + idx * 0.12 + i * 0.05}s`,
                          }}
                        >
                          <button
                            onClick={() => setOpenService(p => ({ ...p, [idx]: isOpen ? -1 : i }))}
                            className="w-full py-4 flex items-center gap-4 text-left group/item"
                          >
                            <span className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 transition-colors ${isOpen ? 'bg-[#24274D] border-[#24274D] text-white' : 'border-slate-300 text-slate-400 group-hover/item:border-slate-400'}`}>
                              {isOpen ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                              )}
                            </span>
                            <h3 className={`text-[16px] leading-snug font-[500] font-['Inter',sans-serif] transition-colors ${isOpen ? 'text-[#24274D]' : 'text-slate-500 group-hover/item:text-[#11181C]'}`}>
                              {s.name}
                            </h3>
                          </button>
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[280px] pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="pl-10">
                              {s.description && (
                                <p className="text-[14px] text-slate-500 leading-relaxed mb-4">
                                  {s.description}
                                </p>
                              )}
                              {s.url && (
                                <a
                                  href={s.url}
                                  aria-label={`Más información sobre ${s.name || s.title || 'este servicio'}`}
                                  title={`Más información sobre ${s.name || s.title || 'este servicio'}`}
                                  className="inline-block bg-[#24274D] text-white text-[13px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#1a1d38] transition-colors"
                                >
                                  Ver {s.name || s.title || 'más información'}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Recent Projects ── */}
      {homeData.projects && homeData.projects.list?.length > 0 && (
        <section
          ref={projectsRef}
          style={{ opacity: projectsVisible ? 1 : 0, transform: projectsVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
          className="py-24 px-6 bg-white border-t border-slate-100"
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h3 className="text-[16px] leading-[16px] font-[500] text-black mb-3 font-['Inter',sans-serif]">{homeData.projects.subtitle}</h3>
                <h2 className="text-[32px] md:text-[36px] font-medium text-[#11181C] leading-tight">
                  {homeData.projects.title}
                </h2>
              </div>
              <a href={homeData.projects.link?.url || "/proyectos"} className="text-[16px] font-medium text-[#24274D] hover:text-[#1a1d38] inline-flex items-center gap-1 transition-colors">
                {homeData.projects.link?.text || "Ver todos los proyectos"} <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(homeData.projects.list || []).map((p, i) => (
                <a href={p.url} key={i} className="group cursor-pointer flex flex-col gap-[10px]">
                  {p.image && (
                    <div className="flex flex-col gap-2">
                      <div className="rounded-[15px] overflow-hidden relative">
                        <SmartImage
                          {...getResponsive(p.image, '(min-width: 768px) 33vw, 100vw')}
                          alt={getAutoAlt(p.altImage, p.image, [p.title])}
                          className="w-full h-[320px] object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      {p.captionImage && (
                        <p className="text-[13px] text-slate-400 italic px-1">
                          {p.captionImage}
                        </p>
                      )}
                    </div>
                  )}
                  <h3 className="text-[16px] font-medium text-[#11181C] leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-[14px] text-slate-500 line-clamp-2">
                    {p.description}
                  </p>
                  <div className="inline-flex items-center text-[13px] font-semibold text-[#24274D] mt-1">
                    Leer más <svg className="ml-1.5 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ── */}
      {homeData.testimonials && testimonials.length > 0 && (
        <section
          ref={testimonialsRef}
          style={{ opacity: testimonialsVisible ? 1 : 0, transform: testimonialsVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
          className="py-24 px-6 bg-white border-t border-slate-100"
        >
          <div className="max-w-[800px] mx-auto">
            <div className="text-center mb-12">
              <h3
                className="mb-3 font-['Inter',sans-serif] text-[rgb(0,0,0)]"
                style={{ fontWeight: 500, fontSize: '16px', lineHeight: '16px' }}
              >
                {homeData.testimonials.subtitle}
              </h3>
              <h2
                className="font-['Inter',sans-serif] text-[rgb(0,0,0)]"
                style={{ fontWeight: 500, fontSize: '32px', lineHeight: '32px' }}
              >
                {homeData.testimonials.title}
              </h2>
            </div>

            <div className="relative flex items-center justify-center">
              <button
                aria-label="Anterior testimonio"
                onClick={() => setActiveTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length)}
                className="absolute left-0 md:-left-12 z-20 w-10 h-10 flex items-center justify-center hover:scale-110 transition-transform"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>

              <div className="w-full max-w-[588px] bg-white rounded-[16px] p-8 md:p-[32px] relative overflow-hidden border border-slate-200">
                <div className="relative overflow-hidden flex-1">
                  <div
                    className="flex transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
                  >
                    {testimonials.map((t, i) => (
                      <div key={i} className="min-w-full">
                        <p className="text-[#11181C] text-[15px] md:text-[16px] leading-[1.6] mb-8 font-medium">
                          {t.text}
                        </p>

                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-white">
                            <img
                              src={t.avatar?.url ? getImageUrl(t.avatar, 'thumbnail') : initialsAvatar(t.name)}
                              width="150"
                              height="150"
                              alt={autoAlt(t.avatarAlt, t.avatar, [t.name], '')}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex flex-col">
                            <h3 className="text-[#11181C] font-semibold text-[14px]">{t.name}</h3>
                            <span className="text-slate-500 text-[12px]">{t.role}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                aria-label="Siguiente testimonio"
                onClick={() => setActiveTestimonial(prev => (prev + 1) % testimonials.length)}
                className="absolute right-0 md:-right-12 z-20 w-10 h-10 flex items-center justify-center hover:scale-110 transition-transform"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Why Choose Us (Bento Grid) ── */}
      {homeData.whyChooseUs && homeData.whyChooseUs.cards && homeData.whyChooseUs.cards.length > 0 && (
        <section
          ref={whyUsRef}
          style={{ opacity: whyUsVisible ? 1 : 0, transform: whyUsVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
          className="py-24 px-6 bg-white border-t border-slate-100"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h3
                className="mb-4 font-['Inter',sans-serif] text-[rgb(0,0,0)]"
                style={{ fontWeight: 500, fontSize: '16px', lineHeight: '16px', letterSpacing: 'normal', textTransform: 'none' }}
              >
                {homeData.whyChooseUs.subtitle}
              </h3>
              <h2
                className="max-w-3xl mx-auto font-['Inter',sans-serif] text-[rgb(0,0,0)]"
                style={{ fontWeight: 500, fontSize: '32px', lineHeight: '32px', letterSpacing: 'normal' }}
              >
                {homeData.whyChooseUs.title}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 w-full mx-auto">
              {/* Card 1 */}
              {homeData.whyChooseUs.cards[0] && (
                <div className="lg:col-span-3 bg-[#EFF5F8] rounded-[24px] p-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 overflow-hidden min-h-[auto] sm:min-h-[280px]">
                  <div className="flex-1 max-w-[280px] z-10">
                    <h3 className="text-[20px] font-medium text-slate-900 mb-3">{homeData.whyChooseUs.cards[0].title}</h3>
                    <p className="text-slate-600 text-[14px] leading-relaxed mb-6">
                      {homeData.whyChooseUs.cards[0].description}
                    </p>
                    {homeData.whyChooseUs.cards[0].link?.url && (
                      <a href={homeData.whyChooseUs.cards[0].link.url} className="inline-block bg-[#24274D] text-white text-[13px] font-medium px-5 py-2.5 rounded-lg hover:bg-brand-blue/90 shadow-sm transition-colors">
                        {homeData.whyChooseUs.cards[0].link.text || 'Explorar'}
                      </a>
                    )}
                  </div>
                  {homeData.whyChooseUs.cards[0].image && (
                    <div className="hidden sm:flex w-[150px] shrink-0 justify-end items-center h-full">
                      <img src={getImageUrl(homeData.whyChooseUs.cards[0].image, 'small')} width={homeData.whyChooseUs.cards[0].image.width || 800} height={homeData.whyChooseUs.cards[0].image.height || 600} alt={getAutoAlt(homeData.whyChooseUs.cards[0].altImage, homeData.whyChooseUs.cards[0].image, [homeData.whyChooseUs.cards[0].title])} title={homeData.whyChooseUs.cards[0].captionImage || undefined} className="h-[200px] object-contain flex-shrink-0" loading="lazy" />
                    </div>
                  )}
                </div>
              )}

              {/* Card 2 */}
              {homeData.whyChooseUs.cards[1] && (
                <div className="lg:col-span-3 bg-[#EFF5F8] rounded-[24px] pt-10 px-8 pb-4 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-0 sm:gap-8 overflow-hidden min-h-[auto] sm:min-h-[280px]">
                  <div className="flex-1 min-w-0 max-w-[320px] sm:max-w-[240px] lg:max-w-[280px] z-10 text-center sm:text-left mb-2 sm:mb-0">
                    <h3 className="text-[22px] sm:text-[20px] font-medium text-slate-900 mb-4 sm:mb-3">{homeData.whyChooseUs.cards[1].title}</h3>
                    <p className="text-slate-600 text-[15px] sm:text-[14px] leading-relaxed">
                      {homeData.whyChooseUs.cards[1].description}
                    </p>
                  </div>
                  {homeData.whyChooseUs.cards[1].image && (
                    <div className="w-full sm:w-[180px] shrink-0 flex justify-center sm:justify-end items-center relative -mb-6 sm:mb-0">
                      <img src={getImageUrl(homeData.whyChooseUs.cards[1].image, 'small')} width={homeData.whyChooseUs.cards[1].image.width || 800} height={homeData.whyChooseUs.cards[1].image.height || 600} alt={getAutoAlt(homeData.whyChooseUs.cards[1].altImage, homeData.whyChooseUs.cards[1].image, [homeData.whyChooseUs.cards[1].title])} title={homeData.whyChooseUs.cards[1].captionImage || undefined} className="w-[180px] sm:w-[200px] h-auto object-contain sm:scale-105 lg:scale-110 origin-center sm:origin-right" loading="lazy" />
                    </div>
                  )}
                </div>
              )}

              {/* Cards 3, 4, 5 */}
              {homeData.whyChooseUs.cards.slice(2).map((card, idx) => (
                <div key={idx} className="lg:col-span-2 bg-[#EFF5F8] rounded-[24px] pt-8 px-8 pb-0 md:pt-10 md:px-10 flex flex-col justify-between overflow-hidden min-h-[360px]">
                  <div className="z-10 relative">
                    <h3 className="text-[20px] font-medium text-slate-900 mb-3">{card.title}</h3>
                    <p className="text-slate-600 text-[14px] leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  {card.image && (
                    <div className="mt-8 flex justify-center items-end h-[140px] w-full relative">
                      <img src={getImageUrl(card.image, 'small')} width={card.image.width || 800} height={card.image.height || 600} alt={getAutoAlt(card.altImage, card.image, [card.title])} title={card.captionImage || undefined} className="w-[100%] max-w-[280px] object-contain object-bottom translate-y-[4px] lg:translate-y-[10px]" loading="lazy" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Blog ── */}
      {homeData.blog && (homeData.blog.articles || []).length > 0 && (
        <section
          ref={blogRef}
          style={{ opacity: blogVisible ? 1 : 0, transform: blogVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
          className="py-24 px-6 bg-white border-t border-slate-100"
        >
          <RecentBlogsSection
            subtitle={homeData.blog.subtitle}
            title={homeData.blog.title}
            posts={homeData.blog.articles}
            visible={blogVisible}
          />
        </section>
      )}

      {/* ── CTA / Form ── */}
      {homeData.cta && (
        <section
          ref={ctaRef}
          style={{ opacity: ctaVisible ? 1 : 0, transform: ctaVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.8s ease' }}
          className="py-24 px-6 bg-white border-t border-slate-100"
        >
          <div className="max-w-5xl mx-auto bg-[#EFF3F7] rounded-[20px] p-6 md:p-10 shadow-sm flex flex-col md:flex-row gap-12 items-start">

            <div className="w-full md:w-5/12 text-center md:text-left">
              {homeData.cta.images && (
                <div className="flex justify-center md:justify-start mb-6">
                  <img
                    src={getImageUrl(homeData.cta.images, 'small')}
                    width={homeData.cta.images.width || 800}
                    height={homeData.cta.images.height || 600}
                    alt={getAutoAlt(homeData.cta.altImage, homeData.cta.images, [homeData.cta.title])}
                    title={homeData.cta.captionImage || undefined}
                    className="h-24 w-auto object-contain"
                    loading="lazy"
                  />
                </div>
              )}
              <h2 className="text-[30px] md:text-[34px] font-semibold text-[#11181C] leading-[1.2]">
                {homeData.cta.title}
              </h2>
            </div>

            <div className="w-full md:w-7/12">
              {status === 'success' ? (
                <div id="form-success-message" className="bg-white p-8 md:p-10 rounded-[16px] shadow-sm border border-green-100 text-center animate-in fade-in duration-500">
                  <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <h3 className="text-[20px] font-semibold text-slate-900 mb-2">¡Solicitud Enviada!</h3>
                  <p className="text-slate-600 mb-6">Gracias por contactarnos. Nos pondremos en contacto contigo lo antes posible.</p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="text-[#24274D] font-semibold text-[14px] hover:underline"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {status === 'error' && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-[13px] flex items-start gap-3">
                      <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      <span>{errorMessage}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-800 mb-2">Nombre <span className="text-red-500">*</span></label>
                      <input
                        required
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        type="text"
                        placeholder="Tu Nombre"
                        className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-[14px] focus:outline-none focus:border-[#24274D] placeholder:text-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-800 mb-2">Correo Electrónico <span className="text-red-500">*</span></label>
                      <input
                        required
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                        placeholder="ejemplo@correo.com"
                        className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-[14px] focus:outline-none focus:border-[#24274D] placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-800 mb-2">Teléfono <span className="text-red-500">*</span></label>
                    <input
                      required
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      type="tel"
                      placeholder="949 123 456"
                      className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-[14px] focus:outline-none focus:border-[#24274D] placeholder:text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-800 mb-2">Mensaje <span className="text-red-500">*</span></label>
                    <textarea
                      required
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Escribe tu mensaje aquí..."
                      className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-[14px] focus:outline-none focus:border-[#24274D] placeholder:text-slate-300 resize-none"
                    ></textarea>
                  </div>
                  <button
                    disabled={status === 'loading'}
                    type="submit"
                    className="w-full bg-[#24274D] text-white py-3.5 rounded-md text-[14px] font-semibold hover:bg-[#1a1d38] transition-colors flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Enviando...
                      </>
                    ) : (
                      'Enviar Mensaje'
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>
        </section>
      )}
    </div>
  )
}

