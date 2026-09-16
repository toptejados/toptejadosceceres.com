import { optimizedImageUrl, autoAlt, titleCasePlace, withCity, cmsHref } from '../lib/site.js'
export default function ContactBanner({ site: rawSite = '', data }) {
  if (!data) return null

  // Callers pass whatever they have: /[service]/[city] passes a formatted name,
  // but the zonas and blog routes pass the raw Strapi slug, which is lowercase.
  // This banner drops the value straight into a heading, so normalise it here.
  const site = titleCasePlace(rawSite)

  // Don't append the site when the title already mentions it (avoids
  // "…en Calafell? ¡Contactanos ahora! Calafell").
  const _prefix = data.titlePrefix ?? ''
  const heading = (site && _prefix.toLowerCase().includes(String(site).toLowerCase())
    ? `${_prefix}${data.titleSuffix ?? ''}`
    : `${_prefix} ${site}${data.titleSuffix ?? ''}`).trim()
  // Same guard the heading above already uses. The city was appended
  // unconditionally, so copy that already ends "...viviendas y negocios en
  // Laredo." rendered as "...negocios en Laredo. Laredo" — withCity appends the
  // town only when it is not already named.
  const _descPrefix = data.descriptionPrefix ?? ''
  const _descSuffix = data.descriptionSuffix ?? ''
  const description = _descSuffix
    ? `${_descPrefix} ${site}${_descSuffix}`.replace(/\s{2,}/g, ' ').trim()
    : withCity(_descPrefix, site)

  const img = data.image
  const imgSrc = optimizedImageUrl((typeof img === 'string' ? img : img?.src) || '')
  const imgAlt = autoAlt(data.altImage, typeof img === 'object' ? img : null, [heading], site)

  const hasMultipleImages = Array.isArray(data.images) && data.images.length > 0

  // Same single image, three cards, each showing a different vertical slice
  const slices = ['object-top', 'object-center', 'object-bottom']

  return (
    <section className="py-10 px-6">
      <div className="max-w-[1140px] mx-auto">
        <div className="bg-[#F0F6FF] rounded-[32px] flex flex-col md:flex-row relative">

          {/* Left Side: Content */}
          <div className="w-full md:w-[55%] text-left flex flex-col justify-center p-8 md:py-[60px] md:pl-[60px] md:pr-10">
            <h2
              className="text-[#11181C] font-medium text-[28px] md:text-[34px] leading-[1.2] mb-5"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {heading}
            </h2>

            <p
              className="text-[#334155] font-normal text-[15px] md:text-[16px] leading-[1.6] mb-8 max-w-[480px]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {description}
            </p>

            <a
              href={cmsHref(data.buttonHref, '/contacto')}
              className="self-start inline-block bg-[#1a1f3d] text-white px-8 py-3.5 rounded-[12px] font-semibold text-[15px] hover:bg-[#2a305d] transition-colors shadow-sm"
            >
              {data.buttonText}
            </a>
          </div>

          {/* Right Side: Single Image */}
          <div className="w-full md:w-[45%] flex flex-col px-8 pb-8 md:p-0 md:absolute md:right-0 md:top-0 md:bottom-0 md:pr-[60px]">
            {imgSrc && (
              <div className="w-full h-[240px] md:h-full rounded-[16px] overflow-hidden shadow-sm bg-slate-200">
                <img
                  src={imgSrc}
                  alt={imgAlt}
                  width={(typeof img === 'object' && img?.width) || 800}
                  height={(typeof img === 'object' && img?.height) || 600}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
