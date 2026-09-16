import { useState, useRef, useEffect } from 'react'
import ServiceAccordion from './ServiceAccordion'
import BrandSlider from './BrandSlider'
import WhyChooseSection from './WhyChooseSection'
import AdvantagesSection from './AdvantagesSection'
import ContactBanner from './ContactBanner'
import FAQSection from './FAQSection'
import RecentBlogsSection from './RecentBlogsSection.jsx'
import { initialsAvatar } from './HomeContent.jsx'
import { optimizedImageUrl, FORMAT_WIDTHS, autoAlt } from '../lib/site.js'

// Map a zona service-list text ("Reparación de Goteras en Amposta") to its
// service page slug. Keyword rules ordered most-specific first.
const SERVICE_SLUG_RULES = [
  ['onduline', 'instalacion-de-onduline-bajo-teja'],
  ['panel sandwich', 'instalacion-tejados-panel-sandwich'],
  ['claraboyas', 'instalacion-y-reparacion-de-claraboyas'],
  ['velux', 'instalacion-y-reparacion-de-ventanas-velux'],
  ['mantenimiento', 'mantenimiento-y-limpieza-de-tejados-y-canalones'],
  ['canalones', 'instalacion-de-canalones'],
  ['aislamiento', 'aislamiento-termico-y-acustico'],
  ['impermeabilizacion', 'impermeabilizaciones'],
  ['goteras', 'reparacion-de-goteras'],
  ['humedades', 'reparacion-de-humedades'],
  ['fachadas', 'rehabilitacion-de-fachadas'],
  ['amianto', 'retirada-de-amianto-uralita'],
  ['uralita', 'retirada-de-amianto-uralita'],
  ['reformas', 'reformas-integrales'],
  ['verticales', 'trabajos-verticales'],
  ['reparacion de tejados', 'reparacion-de-tejados-y-cubiertas'],
  ['construccion', 'construccion-de-tejados-y-cubiertas'],
  ['tejados', 'construccion-de-tejados-y-cubiertas'],
]
const stripAccents = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Editors type the town however they please ("Torrelavega", "San Vicente de la
// Barquera"); the URL needs a slug. Accepts an already-correct slug unchanged.
const citySlugify = (s) => stripAccents(String(s ?? '').trim())
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
// `citySlug` is the city used to build /[service]/[city] links. Defaults to
// the site slug (works when the site is named after its city, e.g. "madrid").
// Province-named sites (e.g. "cantabria") whose service entries live under a
// real city slug (e.g. "santander") override it via analytic-contact's
// `defaultServiceCity` field — otherwise these links 404.
function serviceUrlFor(text, citySlug) {
  if (!citySlug) return null
  const t = stripAccents(text)
  const rule = SERVICE_SLUG_RULES.find(([kw]) => t.includes(kw))
  return rule ? `/${rule[1]}/${citySlug}` : null
}

// ── Shared, single-instance scroll reveal observer ──
// One observer handles every reveal node on the page.
// Updates inline styles directly — no React state, no re-renders.
let sharedObserver = null
const revealedNodes = new WeakSet()

function getSharedObserver() {
  if (sharedObserver) return sharedObserver
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const el = entry.target
          el.style.opacity = '1'
          el.style.transform = 'translate3d(0, 0, 0)'
          el.style.willChange = 'auto'
          sharedObserver.unobserve(el)
        }
      }
    },
    { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
  )
  return sharedObserver
}

function useRevealRef() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (revealedNodes.has(el)) return

    // If the element is already above the viewport (user scrolled past it
    // before hydration), reveal it immediately without animation.
    const rect = el.getBoundingClientRect()
    if (rect.bottom < 0) {
      el.style.opacity = '1'
      el.style.transform = 'translate3d(0, 0, 0)'
      revealedNodes.add(el)
      return
    }

    el.style.opacity = '0'
    el.style.transform = 'translate3d(0, 24px, 0)'
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out'
    el.style.willChange = 'opacity, transform'

    getSharedObserver().observe(el)
    revealedNodes.add(el)
  }, [])
  return ref
}

// ── Animated Number ───────────────────────────────────────────
// Lightweight count-up using rAF. The parent uses `tabular-nums` so
// every digit is the same width — no layout shift while counting.
function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1500 }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (prefersReducedMotion) return

    // Already on screen when we hydrated — the markup already holds the real
    // figure, and resetting it to 0 in front of the reader is worse than not
    // animating at all.
    if (el.getBoundingClientRect().top < window.innerHeight) return

    let raf
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      obs.disconnect()

      el.textContent = `${prefix}0${suffix}`

      // rAF, updating only the integer. tabular-nums on the span keeps digit
      // width stable so counting up cannot reflow the text beside it.
      const start = performance.now()
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        el.textContent = `${prefix}${Math.round(eased * value)}${suffix}`
        if (t < 1) raf = requestAnimationFrame(step)
        else el.textContent = `${prefix}${value}${suffix}`
      }
      raf = requestAnimationFrame(step)
    }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' })

    obs.observe(el)
    return () => {
      obs.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [value, prefix, suffix, duration])

  // Renders the real figure, not 0. The previous markup shipped
  // "{prefix}0{suffix}" and only corrected it inside the effect, so the
  // server-rendered HTML — which is what a crawler reads — advertised 0 for
  // every stat on the page.
  return <span ref={ref} className="tabular-nums inline-block">{prefix}{value}{suffix}</span>
}

export default function ZonasPageContent({ site, data, recentProjects = [], homeWhyChooseUs, apiUrl, recentBlogs = [], contact = null, otherZonas = [] }) {
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Cross-links to this site's other zonas — auto-derived from otherZonas
  // (see zonas/[slug].astro), same "X en Y" label split used by
  // ServicePageContent's "Más Ubicaciones". Replaces the old CMS-authored
  // areasMapSection.areas list: a new zona now appears on every other zona
  // page with no manual edit required.
  const heroTitle = data.hero?.title || ''
  const lastEnIdx = heroTitle.lastIndexOf(' en ')
  const serviceLabel = lastEnIdx > -1 ? heroTitle.slice(0, lastEnIdx) : heroTitle
  const derivedAreas = otherZonas.map(z => ({ city: z.city, url: z.href }))

  // Towns that have their own service pages point the accordion at themselves
  // (/construccion-de-tejados-y-cubiertas/torrelavega). Everything else falls
  // back to the site's main service city, which is what every zona used to do.
  const serviceCitySlug = citySlugify(data.serviceCitySlug)
    || String(contact?.defaultServiceCity || import.meta.env.PUBLIC_SITE_SLUG || '').toLowerCase()

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (status === 'loading') return
    setStatus('loading')
    setErrorMessage('')
    try {
      const response = await fetch(`${apiUrl}/api/contact-forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { site: site || '', name: formData.name, email: formData.email, phone: formData.phone, message: formData.message, service: 'presupuesto-gratuito' } })
      })
      if (!response.ok) throw new Error('Error al enviar el formulario. Por favor, inténtelo de nuevo.')
      setStatus('success')
      setFormData({ name: '', email: '', phone: '', message: '' })
    } catch (err) {
      setErrorMessage(err.message)
      setStatus('error')
    }
  }

  const serviceDescriptions = data.serviceDescriptions ?? {}
  const servicesSection = data.servicesSection ?? {}
  const testimonialsSection = data.testimonials ?? {}
  const testimonials = (testimonialsSection.list ?? []).filter(t => t.isShow !== false)
  const cta = data.cta ?? {}
  const ctaForm = cta.form ?? {}

  const whyChooseData = data.whyChooseNew ?? null

  // The town this page is about — every auto-derived alt text ends with it.
  const cityName = data.city || site || ''

  const getImageUrl = (imageOrUrl, preferredFormat = 'large') => {
    if (!imageOrUrl) return '';
    let url = '';
    if (typeof imageOrUrl === 'string') {
      url = imageOrUrl;
    } else {
      if (imageOrUrl.formats && imageOrUrl.formats[preferredFormat]?.url) {
        url = imageOrUrl.formats[preferredFormat].url;
      } else if (imageOrUrl.formats?.small?.url) {
        url = imageOrUrl.formats.small.url;
      } else {
        url = imageOrUrl.url || '';
      }
    }
    if (!url) return '';
    const abs = (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:'))
      ? url
      : `${apiUrl || ''}${url.startsWith('/') ? '' : '/'}${url}`;
    return optimizedImageUrl(abs, FORMAT_WIDTHS[preferredFormat] || 800);
  };

  useEffect(() => {
    if (!testimonials.length) return
    const timer = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  const { hero } = data

  const heroRef = useRevealRef()
  const brandsRef = useRevealRef()
  const whyChooseNewRef = useRevealRef()
  const advantagesRef = useRevealRef()
  const contactBannerRef = useRevealRef()
  const faqRef = useRevealRef()
  const projectsRef = useRevealRef()
  const testimonialsRef = useRevealRef()
  const blogRef = useRevealRef()
  const ctaRef = useRevealRef()
  const homeWhyChooseRef = useRevealRef()

  return (
    <div className="bg-white">
      {/* ── Hero Section ── */}
      <section
        ref={heroRef}
        className="pt-10 pb-16 px-6 relative bg-white"
      >
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-[28px] md:text-[36px] font-medium text-black leading-[42px] mb-6 max-w-4xl mx-auto">
            {hero.title}
          </h1>
          <p className="text-[#24274D] font-normal max-w-4xl mx-auto mb-8 text-[16px] leading-[24px]">
            {hero.subtitle}
          </p>
          <div className="flex justify-center mb-12">
            <a
              href={hero.primaryButtonUrl ?? '/contacto'}
              className="bg-[#24274D] text-white px-8 py-3.5 rounded-lg font-semibold text-[15px] hover:bg-[#1a1d38] transition-colors shadow-sm"
            >
              {hero.primaryButtonText ?? 'Contáctanos Ahora'}
            </a>
          </div>

          <div className="rounded-[24px] overflow-hidden mb-16 shadow-lg border border-slate-100 mx-auto max-w-4xl">
            {/* LCP element for a zona page. It carried no loading or priority
                hint, so it competed on equal footing with every below-fold
                image on the page. */}
            <img width="1200" height="450"
              src={optimizedImageUrl(hero.image, 1200)}
              alt={autoAlt(hero.altImage, { alternativeText: hero.alternativeText }, [hero.title, 'Tejado'], cityName)}
              className="w-full h-[300px] md:h-[450px] object-cover"
              loading="eager"
              fetchPriority="high"
            />
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-16">
            {hero.stats && hero.stats.map((stat, idx) => {
              const numValue = parseInt(stat.value.replace(/[^0-9]/g, '')) || 0;
              const prefix = stat.value.startsWith('+') ? '+' : '';
              const suffix = stat.value.endsWith('%') ? '%' : '';
              return (
                <div key={idx} className="text-center flex flex-col items-center">
                  <div className="text-[64px] md:text-[88px] font-semibold text-black leading-[64px] md:leading-[88px] mb-2 tabular-nums">
                    <AnimatedNumber value={numValue} prefix={prefix} suffix={suffix} />
                  </div>
                  <div className="text-[16px] text-black font-normal leading-[24px] whitespace-nowrap">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Services Section ── */}
      <section
        className="py-20 px-6 bg-white border-t border-slate-100"
      >
        <div className="max-w-6xl mx-auto">
          {/* Keeps heading order sequential (h1 -> h2 -> category h3s) without changing the UI */}
          <h2 className="sr-only">Nuestros servicios de tejados en {data.city || site}</h2>
          <div className="space-y-12">
            {data.servicesLists.map((cat, index) => (
              <ServiceAccordion
                key={index}
                category={cat.category}
                image={cat.image}
                altImage={cat.altImage}
                ctaLabel={servicesSection.ctaLabel}
                alternativeText={cat.alternativeText}
                site={cityName}
                isReversed={index % 2 !== 0}
                items={cat.items.map(item => ({
                  title: item,
                  content: serviceDescriptions[item] || servicesSection.defaultDescription,
                  url: serviceUrlFor(item, serviceCitySlug),
                }))}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Brand Slider ── */}
      <div ref={brandsRef}>
        <BrandSlider site={data.city || site} data={data.brandSlider} strapiUrl={apiUrl} />
      </div>

      {/* ── Why Choose Us (image + features) ── */}
      <div ref={whyChooseNewRef}>
        <WhyChooseSection data={whyChooseData} site={cityName} />
      </div>


      {/* ── Advantages Section ── */}
      <div ref={advantagesRef}>
        <AdvantagesSection data={data.advantagesSection} />
      </div>

      {/* ── Contact Banner Section ── */}
      <div ref={contactBannerRef}>
        <ContactBanner site={data.city || site} data={data.contactBanner} />
      </div>

      {/* ── FAQ Section ── */}
      <div ref={faqRef}>
        <FAQSection site={data.city || site} data={data.faqSection} />
      </div>

      {/* ── Recent Projects ── */}
      <section
        ref={projectsRef}
        className="py-24 px-6 bg-white border-t border-slate-100"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h3
                className="mb-3 font-['Inter',sans-serif] text-[rgb(0,0,0)]"
                style={{ fontWeight: 500, fontSize: '16px', lineHeight: '16px' }}
              >
                Proyectos
              </h3>
              <h2
                className="font-['Inter',sans-serif] text-[rgb(0,0,0)]"
                style={{ fontWeight: 500, fontSize: '32px', lineHeight: '32px' }}
              >
                Conoce nuestros proyectos más recientes
              </h2>
            </div>
            <a href="/proyectos" className="text-[14px] font-bold text-[#5492f7] hover:text-[#3b82f6] pb-1 flex items-center gap-2">
              Ver todos los proyectos <span className="text-[16px]">&rarr;</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recentProjects.map((p, i) => {
              const coverImgUrl = p.coverImg?.url ? optimizedImageUrl(p.coverImg.url.startsWith('http') ? p.coverImg.url : `${apiUrl || ''}${p.coverImg.url}`) : null;

              let descText = '';
              if (typeof p.description === 'string') {
                descText = p.description;
              } else if (Array.isArray(p.description)) {
                descText = p.description.map(block => block.children?.map(c => c.text).join('')).join(' ');
              }

              return (
                <a href={`/proyectos/${p.slug}`} key={i} className="group cursor-pointer flex flex-col gap-[16px]">
                  <div className="rounded-[20px] overflow-hidden relative mb-2 aspect-[370/529] bg-slate-100">
                    {coverImgUrl && (
                      <img
                        src={coverImgUrl}
                        alt={p.coverImgAlt || p.title}
                        width={p.coverImg?.width || 800}
                        height={p.coverImg?.height || 600}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <h3 className="text-[20px] font-bold text-[#11181C] leading-[1.3] group-hover:text-[#3b82f6] transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-[14px] text-slate-500 line-clamp-3 leading-[1.6]">
                    {descText}
                  </p>
                  <div className="inline-flex items-center text-[13px] font-semibold text-[#24274D] mt-1">
                    Leer más <svg className="ml-1.5 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section
        ref={testimonialsRef}
        className="py-24 px-6 bg-white border-t border-slate-100"
      >
        <div className="max-w-[800px] mx-auto">
          <div className="text-center mb-12">
            <h3
              className="mb-3 font-['Inter',sans-serif] text-[rgb(0,0,0)]"
              style={{ fontWeight: 500, fontSize: '16px', lineHeight: '16px' }}
            >
              {testimonialsSection.subtitle}
            </h3>
            <h2
              className="font-['Inter',sans-serif] text-[rgb(0,0,0)]"
              style={{ fontWeight: 500, fontSize: '32px', lineHeight: '32px' }}
            >
              {testimonialsSection.title}
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
                            src={t.avatar ? optimizedImageUrl(t.avatar, 160) : initialsAvatar(t.name)}
                            alt={t.name}
                            width="150"
                            height="150"
                            loading="lazy"
                            className="w-full h-full object-cover"
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

      {/* ── Why Choose Us (Bento Grid) ── */}
      {homeWhyChooseUs && homeWhyChooseUs.cards && homeWhyChooseUs.cards.length > 0 && (
        <section
          ref={homeWhyChooseRef}
          className="py-24 px-6 bg-white border-t border-slate-100"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h3
                className="mb-4 font-['Inter',sans-serif] text-[rgb(0,0,0)]"
                style={{ fontWeight: 500, fontSize: '16px', lineHeight: '16px' }}
              >
                {homeWhyChooseUs.subtitle}
              </h3>
              <h2
                className="max-w-3xl mx-auto font-['Inter',sans-serif] text-[rgb(0,0,0)]"
                style={{ fontWeight: 500, fontSize: '32px', lineHeight: '32px' }}
              >
                {homeWhyChooseUs.title}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 w-full mx-auto">
              {homeWhyChooseUs.cards[0] && (
                <div className="lg:col-span-3 bg-[#EFF5F8] rounded-[24px] p-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 overflow-hidden min-h-[auto] sm:min-h-[280px]">
                  <div className="flex-1 max-w-[280px] z-10">
                    <h3 className="text-[20px] font-medium text-slate-900 mb-3">{homeWhyChooseUs.cards[0].title}</h3>
                    <p className="text-slate-600 text-[14px] leading-relaxed mb-6">
                      {homeWhyChooseUs.cards[0].description}
                    </p>
                    {homeWhyChooseUs.cards[0].link?.url && (
                      <a href={homeWhyChooseUs.cards[0].link.url} className="inline-block bg-[#24274D] text-white text-[13px] font-medium px-5 py-2.5 rounded-lg hover:opacity-90 shadow-sm transition-colors">
                        {homeWhyChooseUs.cards[0].link.text || 'Explorar'}
                      </a>
                    )}
                  </div>
                  {homeWhyChooseUs.cards[0].image && (
                    <div className="hidden sm:flex w-[150px] shrink-0 justify-end items-center h-full">
                      <img src={getImageUrl(homeWhyChooseUs.cards[0].image, 'small')} alt={autoAlt(homeWhyChooseUs.cards[0].altImage, homeWhyChooseUs.cards[0].image, [homeWhyChooseUs.cards[0].title], cityName)} width={homeWhyChooseUs.cards[0].image?.width || 800} height={homeWhyChooseUs.cards[0].image?.height || 600} className="h-[200px] object-contain flex-shrink-0" loading="lazy" />
                    </div>
                  )}
                </div>
              )}

              {homeWhyChooseUs.cards[1] && (
                <div className="lg:col-span-3 bg-[#EFF5F8] rounded-[24px] pt-10 px-8 pb-4 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-0 sm:gap-8 overflow-hidden min-h-[auto] sm:min-h-[280px]">
                  <div className="flex-1 min-w-0 max-w-[320px] sm:max-w-[240px] lg:max-w-[280px] z-10 text-center sm:text-left mb-2 sm:mb-0">
                    <h3 className="text-[22px] sm:text-[20px] font-medium text-slate-900 mb-4 sm:mb-3">{homeWhyChooseUs.cards[1].title}</h3>
                    <p className="text-slate-600 text-[15px] sm:text-[14px] leading-relaxed">
                      {homeWhyChooseUs.cards[1].description}
                    </p>
                  </div>
                  {homeWhyChooseUs.cards[1].image && (
                    <div className="w-full sm:w-[180px] shrink-0 flex justify-center sm:justify-end items-center relative -mb-6 sm:mb-0">
                      <img src={getImageUrl(homeWhyChooseUs.cards[1].image, 'small')} alt={autoAlt(homeWhyChooseUs.cards[1].altImage, homeWhyChooseUs.cards[1].image, [homeWhyChooseUs.cards[1].title], cityName)} width={homeWhyChooseUs.cards[1].image?.width || 800} height={homeWhyChooseUs.cards[1].image?.height || 600} className="w-[180px] sm:w-[200px] h-auto object-contain sm:scale-105 lg:scale-110 origin-center sm:origin-right" loading="lazy" />
                    </div>
                  )}
                </div>
              )}

              {homeWhyChooseUs.cards.slice(2).map((card, idx) => (
                <div key={idx} className="lg:col-span-2 bg-[#EFF5F8] rounded-[24px] pt-8 px-8 pb-0 md:pt-10 md:px-10 flex flex-col justify-between overflow-hidden min-h-[360px]">
                  <div className="z-10 relative">
                    <h3 className="text-[20px] font-medium text-slate-900 mb-3">{card.title}</h3>
                    <p className="text-slate-600 text-[14px] leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  {card.image && (
                    <div className="mt-8 flex justify-center items-end h-[140px] w-full relative">
                      <img src={getImageUrl(card.image, 'small')} alt={autoAlt(card.altImage, card.image, [card.title], cityName)} width={card.image?.width || 800} height={card.image?.height || 600} className="w-[100%] max-w-[280px] object-contain object-bottom translate-y-[4px] lg:translate-y-[10px]" loading="lazy" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Blog ── */}
      {recentBlogs.length > 0 && (
        <section
          ref={blogRef}
          className="py-24 px-6 bg-white border-t border-slate-100"
        >
          <RecentBlogsSection
            title="Descubre nuestros blogs más recientes"
            posts={recentBlogs.map(b => ({ ...b, description: b.excerpt }))}
          />
        </section>
      )}

      {/* ── Areas Map Section ── */}
      {(data.areasMapSection || derivedAreas.length > 0) && (
        <section className="py-24 px-6 bg-white border-t border-slate-100">
          <div className="max-w-6xl mx-auto">
            {(data.areasMapSection?.subtitle || data.areasMapSection?.title) && (
              <div className="mb-12">
                {data.areasMapSection.subtitle && (
                  <p className="mb-3 text-[14px] text-slate-500 font-normal font-['Inter',sans-serif]">
                    {data.areasMapSection.subtitle}
                  </p>
                )}
                {data.areasMapSection.title && (
                  <h2
                    className="font-['Inter',sans-serif] text-[#11181C]"
                    style={{ fontWeight: 600, fontSize: '38px', lineHeight: '1.2', maxWidth: '620px' }}
                  >
                    {data.areasMapSection.title}
                  </h2>
                )}
              </div>
            )}

            {derivedAreas.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6 mb-14">
                {derivedAreas.map((area, i) => (
                  <a
                    key={i}
                    href={area.url || '#'}
                    className="flex items-start gap-2.5 text-[#24274D] text-[14px] leading-[1.5] hover:text-[#11181C] transition-colors"
                  >
                    <svg className="w-5 h-5 mt-0.5 shrink-0 text-[#24274D]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <span>{serviceLabel} en <strong>{area.city}</strong></span>
                  </a>
                ))}
              </div>
            )}

            {(contact?.mapEmbedUrl || data.areasMapSection?.mapEmbedUrl) && (
              <div className="rounded-[16px] overflow-hidden border border-slate-100 shadow-sm w-full aspect-[16/7]">
                <iframe
                  src={contact?.mapEmbedUrl || data.areasMapSection.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa de ubicación"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Form CTA ── */}
      <section
        ref={ctaRef}
        className="py-24 px-6 bg-white border-t border-slate-100"
      >
        <div className="max-w-5xl mx-auto bg-[#EFF3F7] rounded-[20px] p-6 md:p-10 shadow-sm flex flex-col md:flex-row gap-12 items-start">

          <div className="w-full md:w-5/12 text-center md:text-left">
            {cta.images && (
              <div className="flex justify-center md:justify-start mb-6">
                <img
                  src={getImageUrl(cta.images, 'small')}
                  alt={autoAlt(cta.altImage, cta.images, [cta.title], cityName)}
                  title={cta.captionImage || undefined}
                  width={cta.images?.width || 800}
                  height={cta.images?.height || 600}
                  className="h-24 w-auto object-contain"
                  loading="lazy"
                />
              </div>
            )}
            <h2 className="text-[30px] md:text-[34px] font-semibold text-[#11181C] leading-[1.2]">
              {cta.title}
            </h2>
          </div>

          <div className="w-full md:w-7/12">
            {status === 'success' ? (
              <div id="form-success-message" className="bg-white p-8 md:p-10 rounded-[16px] shadow-sm border border-green-100 text-center">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h3 className="text-[20px] font-semibold text-slate-900 mb-2">¡Solicitud Enviada!</h3>
                <p className="text-slate-600 mb-6">Gracias por contactarnos. Nos pondremos en contacto contigo lo antes posible.</p>
                <button onClick={() => setStatus('idle')} className="text-[#24274D] font-semibold text-[14px] hover:underline">
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
                    <input required name="name" value={formData.name} onChange={handleChange} type="text" placeholder="Tu Nombre" className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-[14px] focus:outline-none focus:border-[#24274D] placeholder:text-slate-300" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-800 mb-2">Correo Electrónico <span className="text-red-500">*</span></label>
                    <input required name="email" value={formData.email} onChange={handleChange} type="email" placeholder="ejemplo@correo.com" className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-[14px] focus:outline-none focus:border-[#24274D] placeholder:text-slate-300" />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-800 mb-2">Teléfono <span className="text-red-500">*</span></label>
                  <input required name="phone" value={formData.phone} onChange={handleChange} type="tel" placeholder="949 123 456" className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-[14px] focus:outline-none focus:border-[#24274D] placeholder:text-slate-300" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-800 mb-2">Mensaje <span className="text-red-500">*</span></label>
                  <textarea required name="message" value={formData.message} onChange={handleChange} rows="3" placeholder="Escribe tu mensaje aquí..." className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-[14px] focus:outline-none focus:border-[#24274D] placeholder:text-slate-300 resize-none"></textarea>
                </div>
                <button disabled={status === 'loading'} type="submit" className="w-full bg-[#24274D] text-white py-3.5 rounded-md text-[14px] font-semibold hover:bg-[#1a1d38] transition-colors flex items-center justify-center gap-2">
                  {status === 'loading' ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Enviando...</>
                  ) : 'Enviar Mensaje'}
                </button>
              </form>
            )}
          </div>

        </div>
      </section>
    </div>
  )
}
