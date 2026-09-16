import { useState, useEffect } from 'react'
import { initialsAvatar } from './HomeContent.jsx'
import LazyMap from './LazyMap.jsx'
import { formatSiteName, optimizedImageUrl, FORMAT_WIDTHS, safeAlt, telHref } from '../lib/site.js'

// Spanish national number: +34 is a fixed prefix in the UI, so just 9 digits starting 6-9
const SPANISH_PHONE_RE = /^[6789]\d{8}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const validators = {
  name: (v) => (v.trim().length >= 2 ? '' : 'Introduce tu nombre (mínimo 2 caracteres).'),
  email: (v) => (EMAIL_RE.test(v.trim()) ? '' : 'Introduce un correo electrónico válido.'),
  phone: (v) =>
    SPANISH_PHONE_RE.test(v.replace(/\s/g, ''))
      ? ''
      : 'Introduce un teléfono español válido: 9 dígitos que empiecen por 6, 7, 8 o 9.',
  message: (v) => (v.trim().length >= 10 ? '' : 'El mensaje debe tener al menos 10 caracteres.'),
}

const SpainFlag = ({ className }) => (
  <svg className={className} viewBox="0 0 22 16" aria-hidden="true">
    <rect width="22" height="16" fill="#AA151B" />
    <rect y="4" width="22" height="8" fill="#F1BF00" />
  </svg>
)

export default function ContactPage({ site, strapiUrl, phone, email, waLink, socials, data: cmsData, contact, zonas = [], serviceCities = [] }) {
  const siteName = formatSiteName(site)
  const sitePhone = contact?.phone || phone || '+34 900 000 000'

  // analytic-contact is the single source of truth for address/phone/map;
  // the contacts-page locationCard only supplies wording fallbacks.
  const loc = cmsData?.locationCard ?? {}
  const address = contact?.address || loc.address || ''
  const content = {
    badge: cmsData?.heroBadge || 'Contáctanos',
    title: cmsData?.heroTitle || `Reserva su Cita con Top Tejados ${siteName}`,
    description:
      cmsData?.heroDescription ||
      `¿Tu tejado necesita atención? Contacta con Top Tejados ${siteName}, estamos aquí para ayudar. Llama ahora para una evaluación gratuita y descubre cómo podemos mejorar y proteger tu hogar.`,
    location: {
      city: loc.city || siteName,
      businessName: contact?.businessName || loc.businessName || `Top Tejados ${siteName}`,
      description: loc.description || 'Expertos en reparación, rehabilitación e instalación de tejados.',
      address,
      phone: sitePhone,
      mapEmbedUrl:
        contact?.mapEmbedUrl ||
        loc.mapEmbedUrl ||
        `https://maps.google.com/maps?q=${encodeURIComponent(address || siteName || 'España')}&t=&z=12&ie=UTF8&iwloc=&output=embed`,
    },
    services: {
      title: `Servicios de tejados en ${siteName}`,
      items:
        cmsData?.servicesList?.length > 0
          ? cmsData.servicesList.map((s) => s.name)
          : [
              `Reparación de tejados en ${siteName}`,
              'Rehabilitación de cubiertas',
              'Impermeabilización de tejados',
              'Instalación de tejados nuevos',
              'Retirada de uralita y amianto',
              'Limpieza y mantenimiento de canalones',
            ],
    },
    whyChooseUs: {
      subtitle: cmsData?.whyChooseUs?.subtitle || '¿Por qué elegirnos?',
      title: cmsData?.whyChooseUs?.title || `Tu empresa de tejados de confianza en ${siteName}`,
      cards:
        cmsData?.whyChooseUs?.cards?.length > 0
          ? cmsData.whyChooseUs.cards.map((c) => ({
              title: c.hasSiteSuffix ? `${c.title} ${c.defaultLocation || siteName}` : c.title,
              description: c.description,
            }))
          : [
              {
                title: 'Presupuesto sin compromiso',
                description: `Evaluamos el estado de tu tejado en ${siteName} y te enviamos un presupuesto detallado y gratuito, sin ningún compromiso por tu parte.`,
              },
              {
                title: 'Respuesta rápida',
                description: 'Atendemos tu solicitud en menos de 24 horas. Para urgencias como goteras o filtraciones, priorizamos tu caso de inmediato.',
              },
              {
                title: 'Profesionales cualificados',
                description: 'Nuestro equipo cuenta con años de experiencia en reparación, rehabilitación e instalación de todo tipo de cubiertas y tejados.',
              },
              {
                title: 'Garantía por escrito',
                description: 'Todos nuestros trabajos incluyen garantía por escrito y utilizamos materiales de primera calidad de marcas reconocidas.',
              },
            ],
    },
    testimonials: cmsData?.testimonials?.list?.length > 0 ? cmsData.testimonials : null,
    form: {
      successTitle: cmsData?.form?.successTitle || '¡Mensaje enviado con éxito!',
      successText: cmsData?.form?.successText || 'Nos pondremos en contacto contigo pronto.',
      successButton: cmsData?.form?.successButton || 'Enviar otro mensaje',
      errorMessage: cmsData?.form?.errorMessage || 'Hubo un error al enviar. Por favor, inténtalo de nuevo.',
      submitText: cmsData?.form?.submitButtonText || 'Enviar Mensaje',
    },
  }

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')

  const testimonials = (content.testimonials?.list || []).filter(t => t.isShow !== false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [zonasExpanded, setZonasExpanded] = useState(false)

  useEffect(() => {
    if (!testimonials.length) return
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  const getImageUrl = (image, preferredFormat = 'thumbnail') => {
    if (!image) return ''
    const url = image.formats?.[preferredFormat]?.url || image.formats?.small?.url || image.url || ''
    if (!url) return ''
    const abs = (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:'))
      ? url
      : `${strapiUrl || ''}${url.startsWith('/') ? '' : '/'}${url}`
    return optimizedImageUrl(abs, FORMAT_WIDTHS[preferredFormat] || 800)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    let clean = value
    if (name === 'phone') {
      // Digits only; tolerate a pasted "+34 ..." by stripping the country code; cap at 9 digits
      let digits = value.replace(/\D/g, '')
      if (digits.startsWith('0034')) digits = digits.slice(4)
      else if (digits.startsWith('34') && digits.length > 9) digits = digits.slice(2)
      digits = digits.slice(0, 9)
      // Group 3-3-3 for readability
      clean = digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim()
    }
    setFormData((prev) => ({ ...prev, [name]: clean }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    if (value) setErrors((prev) => ({ ...prev, [name]: validators[name](value) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    for (const [field, validate] of Object.entries(validators)) {
      const err = validate(formData[field] ?? '')
      if (err) newErrors[field] = err
    }
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setStatus('loading')
    setSubmitError('')
    try {
      const response = await fetch(`${strapiUrl}/api/contact-forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            site,
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: `+34${formData.phone.replace(/\D/g, '')}`,
            message: formData.message.trim(),
          },
        }),
      })
      if (!response.ok) throw new Error(content.form.errorMessage)
      setStatus('success')
      setFormData({ name: '', email: '', phone: '', message: '' })
    } catch (err) {
      setSubmitError(err.message || content.form.errorMessage)
      setStatus('idle')
    }
  }

  const inputClass = (field) =>
    `w-full bg-white border rounded-[10px] px-4 py-3.5 text-[14px] text-[#11181C] focus:outline-none transition-colors placeholder:text-slate-400 ${
      errors[field] ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-[#24274D]'
    }`

  const fieldLabel = (text) => (
    <label className="block text-[14px] font-medium text-[#11181C] mb-2">
      {text} <span className="text-red-500">*</span>
    </label>
  )

  return (
    <>
    <section className="pt-28 md:pt-36 pb-24 px-6 bg-[#F6F7F9]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* ── Left: intro + location card ── */}
        <div className="flex flex-col gap-10">
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-5">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M6 16c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5" />
                <path d="M15 9h3M15 13h3" />
              </svg>
              <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-amber-500">{content.badge}</span>
            </div>
            <h1 className="text-[36px] md:text-[42px] font-semibold text-[#11181C] leading-[1.15] mb-6 max-w-[520px]">
              {content.title}
            </h1>
            <p className="text-[15px] text-slate-600 leading-relaxed max-w-[540px]">{content.description}</p>
          </div>

          {/* Location card */}
          <div className="bg-white rounded-[16px] border border-slate-200/70 overflow-hidden grid grid-cols-1 sm:grid-cols-2">
            <div className="p-7 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <SpainFlag className="w-[22px] h-[16px] rounded-[2px] shadow-sm shrink-0" />
                <h2 className="text-[20px] font-semibold text-[#11181C]">{content.location.city}</h2>
              </div>
              <p className="text-[15px] font-medium text-[#11181C] mb-1">{content.location.businessName}</p>
              <p className="text-[13px] text-slate-500 leading-relaxed mb-6">{content.location.description}</p>
              {content.location.address && (
                <div className="mb-5">
                  <p className="text-[14px] font-medium text-[#11181C] mb-1">Dirección</p>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{content.location.address}</p>
                </div>
              )}
              <div>
                <p className="text-[14px] font-medium text-[#11181C] mb-1">Teléfono</p>
                <a
                  href={telHref(content.location.phone)}
                  className="text-[13px] text-slate-500 hover:text-[#24274D] transition-colors"
                >
                  {content.location.phone}
                </a>
              </div>
            </div>
            <div className="relative min-h-[220px] sm:min-h-full bg-slate-100">
              <iframe
                src={content.location.mapEmbedUrl}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Mapa de ${content.location.city}`}
              ></iframe>
            </div>
          </div>
        </div>

        {/* ── Right: form card ── */}
        <div className="bg-white rounded-[16px] border border-slate-200/70 p-7 md:p-10 shadow-sm">
          {status === 'success' ? (
            <div id="form-success-message" className="text-center py-16">
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h3 className="text-[20px] font-semibold text-slate-900 mb-2">{content.form.successTitle}</h3>
              <p className="text-slate-600 mb-8">{content.form.successText}</p>
              <button onClick={() => setStatus('idle')} className="text-[#24274D] font-semibold text-[14px] hover:underline">
                {content.form.successButton}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-[14px] rounded-[10px] px-4 py-3">
                  {submitError}
                </div>
              )}

              <div>
                {fieldLabel('Nombre')}
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Tu Nombre"
                  className={inputClass('name')}
                />
                {errors.name && <p className="text-red-500 text-[13px] mt-1.5">{errors.name}</p>}
              </div>

              <div>
                {fieldLabel('Correo Electrónico')}
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="ejemplo@correo.com"
                  className={inputClass('email')}
                />
                {errors.email && <p className="text-red-500 text-[13px] mt-1.5">{errors.email}</p>}
              </div>

              <div>
                {fieldLabel('Teléfono')}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center gap-2 pl-4 pr-3 border-r border-slate-200 pointer-events-none">
                    <SpainFlag className="w-[22px] h-[16px] rounded-[2px] shadow-sm shrink-0" />
                    <span className="text-[14px] text-[#11181C] font-medium">+34</span>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel-national"
                    inputMode="numeric"
                    maxLength={11}
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="949 123 456"
                    className={`${inputClass('phone')} pl-[92px]`}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-[13px] mt-1.5">{errors.phone}</p>}
              </div>

              <div>
                {fieldLabel('Mensaje')}
                <textarea
                  rows="5"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Escribe tu mensaje aquí..."
                  className={`${inputClass('message')} resize-none`}
                />
                {errors.message && <p className="text-red-500 text-[13px] mt-1.5">{errors.message}</p>}
              </div>

              <button
                disabled={status === 'loading'}
                type="submit"
                className="w-full py-4 rounded-[12px] bg-[#24274D] text-white font-medium text-[15px] hover:bg-[#1a1d38] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {content.form.submitText}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── Why choose us ── */}
      <div className="max-w-6xl mx-auto mt-24">
        <p className="mb-3 text-[14px] text-slate-500">{content.whyChooseUs.subtitle}</p>
        <h2 className="text-[28px] md:text-[38px] font-semibold text-[#11181C] leading-[1.2] max-w-[620px] mb-12">
          {content.whyChooseUs.title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {content.whyChooseUs.cards.map((card, i) => (
            <div key={i} className="bg-white rounded-[16px] border border-slate-200/70 p-7">
              <h3 className="text-[17px] font-semibold text-[#11181C] mb-2">{card.title}</h3>
              <p className="text-[14px] text-slate-500 leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Services list ── */}
      <div className="max-w-6xl mx-auto mt-20">
        <h2 className="text-[24px] md:text-[30px] font-semibold text-[#11181C] leading-[1.2] mb-8">
          {content.services.title}
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-4">
          {content.services.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[#24274D] text-[14px] leading-[1.5]">
              <svg className="w-5 h-5 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

    </section>

    {/* ── Testimonials (CMS only) — same UI as home ── */}
    {content.testimonials && testimonials.length > 0 && (
      <section className="py-24 px-6 bg-white border-t border-slate-100">
        <div className="max-w-[800px] mx-auto">
          <div className="text-center mb-12">
            <h3
              className="mb-3 font-['Inter',sans-serif] text-[rgb(0,0,0)]"
              style={{ fontWeight: 500, fontSize: '16px', lineHeight: '16px' }}
            >
              {content.testimonials.subtitle}
            </h3>
            <h2
              className="font-['Inter',sans-serif] text-[rgb(0,0,0)]"
              style={{ fontWeight: 500, fontSize: '32px', lineHeight: '32px' }}
            >
              {content.testimonials.title}
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
                            alt={safeAlt(t.avatar?.alternativeText, site) || t.name || ''}
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

    {/* ── Zonas donde prestamos servicio — same layout as [service]/[city],
         no yellow: there's no "current city" to highlight on a contact page ── */}
    {(serviceCities.length > 0 || zonas.length > 0) && (
      <section className="py-24 px-6 bg-white border-t border-slate-100">
        <div className="max-w-[1140px] mx-auto">
          <h2 className="font-medium text-[32px] leading-tight text-[#2B2B2B] mb-10">
            Zonas donde prestamos servicio
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="w-full">
              {(() => {
                const allCities = [...new Set(serviceCities.filter(Boolean))]
                const fmtCity = (c) => c.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                return allCities.length > 0 && (
                  <div className="mb-10">
                    <p className="text-[14px] font-medium text-slate-500 mb-4">Principales Zonas de Servicio</p>
                    <div className="flex flex-wrap gap-3">
                      {allCities.map((c, i) => (
                        <a
                          key={i}
                          href={`/construccion-de-tejados-y-cubiertas/${c}`}
                          className="inline-flex items-center justify-between gap-6 text-[14px] font-medium px-5 py-3 rounded-[10px] min-w-[150px] transition-colors bg-[#24274D] text-white hover:bg-[#1a1d38]"
                        >
                          {fmtCity(c)}
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" /></svg>
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {zonas.length > 0 && (
                <div>
                  <p className="text-[14px] font-medium text-slate-500 mb-4">Más Ubicaciones</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-6">
                    {(zonasExpanded ? zonas : zonas.slice(0, 6)).map((z, i) => {
                      const pageTitle = content.services.title || ''
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
                  {zonas.length > 6 && (
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
                src={content.location.mapEmbedUrl}
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
    )}
    </>
  )
}
