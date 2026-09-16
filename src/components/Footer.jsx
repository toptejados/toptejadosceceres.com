import { formatSiteName, responsiveImage, LOGO_SIZES } from '../lib/site.js'
import LazyMap from './LazyMap.jsx'

// Social icons (Phosphor-style, outline)
const SOCIAL_ICONS = {
  facebook: <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm8,191.63V152h24a8,8,0,0,0,0-16H136V112a16,16,0,0,1,16-16h16a8,8,0,0,0,0-16H152a32,32,0,0,0-32,32v24H96a8,8,0,0,0,0,16h24v63.63a88,88,0,1,1,16,0Z" />,
  instagram: <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z" />,
  twitter: <path d="M214.75,211.71l-62.6-98.38,61.77-67.95a8,8,0,0,0-11.84-10.76L143.24,99.34,102.75,35.71A8,8,0,0,0,96,32H48a8,8,0,0,0-6.75,12.3l62.6,98.37-61.77,68a8,8,0,1,0,11.84,10.76l58.84-64.72,40.49,63.63A8,8,0,0,0,160,224h48a8,8,0,0,0,6.75-12.29ZM164.39,208,62.57,48h29L193.43,208Z" />,
  x: <path d="M214.75,211.71l-62.6-98.38,61.77-67.95a8,8,0,0,0-11.84-10.76L143.24,99.34,102.75,35.71A8,8,0,0,0,96,32H48a8,8,0,0,0-6.75,12.3l62.6,98.37-61.77,68a8,8,0,1,0,11.84,10.76l58.84-64.72,40.49,63.63A8,8,0,0,0,160,224h48a8,8,0,0,0,6.75-12.29ZM164.39,208,62.57,48h29L193.43,208Z" />,
  tiktok: <path d="M224,72a48.05,48.05,0,0,1-48-48,8,8,0,0,0-8-8H128a8,8,0,0,0-8,8V156a20,20,0,1,1-28.57-18.08A8,8,0,0,0,96,130.69V88a8,8,0,0,0-9.4-7.88C50.91,86.48,24,119.1,24,156a68,68,0,0,0,136,0V115.29A103.25,103.25,0,0,0,224,128a8,8,0,0,0,8-8V80A8,8,0,0,0,224,72Zm-8,39.64a87.19,87.19,0,0,1-43.33-16.15A8,8,0,0,0,160,102v54a52,52,0,0,1-104,0c0-25.9,16.64-49.13,40-57.6v27.67A36,36,0,1,0,136,156V32h24.5A64.14,64.14,0,0,0,216,87.5Z" />,
  whatsapp: <path d="M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88,40,40,0,0,0,40-40A8,8,0,0,0,187.58,144.84ZM152,176a72.08,72.08,0,0,1-72-72A24,24,0,0,1,99.29,80.46l11.48,23L101,118a8,8,0,0,0-.73,7.51,56.47,56.47,0,0,0,30.15,30.15A8,8,0,0,0,138,155l14.61-9.74,23,11.48A24,24,0,0,1,152,176ZM128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-6.54-.67L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Z" />,
  email: <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48Zm-96,85.15L52.57,64H203.43ZM98.71,128,40,181.81V74.19Zm11.84,10.85,12,11.05a8,8,0,0,0,10.82,0l12-11.05,58,53.15H52.57ZM157.29,128,216,74.18V181.82Z" />,
  youtube: <path d="M164.44,121.34l-48-32A8,8,0,0,0,104,96v64a8,8,0,0,0,12.44,6.66l48-32a8,8,0,0,0,0-13.32ZM120,145.05V111l25.58,17ZM234.33,69.52a24,24,0,0,0-14.49-16.4C185.56,39.88,131,40,128,40s-57.56-.12-91.84,13.12a24,24,0,0,0-14.49,16.4C19.08,79.5,16,97.74,16,128s3.08,48.5,5.67,58.48a24,24,0,0,0,14.49,16.41C69,215.56,120.4,216,127.34,216h1.32c6.94,0,58.37-.44,91.18-13.11a24,24,0,0,0,14.49-16.41c2.59-10,5.67-28.22,5.67-58.48S236.92,79.5,234.33,69.52Zm-15.49,113a8,8,0,0,1-4.77,5.49c-31.65,12.22-85.48,12-86,12H128c-.54,0-54.33.2-86-12a8,8,0,0,1-4.77-5.49C34.8,173.39,32,156.57,32,128s2.8-45.39,5.16-54.47A8,8,0,0,1,41.93,68c30.52-11.79,81.66-12,85.85-12h.27c.54,0,54.38-.18,86,12a8,8,0,0,1,4.77,5.49C221.2,82.61,224,99.43,224,128S221.2,173.39,218.84,182.47Z" />,
}

function SocialIcon({ name }) {
  const key = (name || '').toLowerCase()
  const icon = SOCIAL_ICONS[key] || SOCIAL_ICONS[key.replace(/\s+/g, '')] || null
  if (!icon) {
    return <span className="text-[13px] font-semibold uppercase">{(name || '?').slice(0, 2)}</span>
  }
  return <svg viewBox="0 0 256 256" fill="currentColor" className="w-[18px] h-[18px]">{icon}</svg>
}

// Default footer service catalog — used when the Strapi footer entry has no
// serviceColumns yet, so every new site gets correct main-city links for free.
function defaultServiceColumns(siteSlug) {
  const u = (slug) => `/${slug}/${siteSlug}`
  return [
    {
      title: 'Tejados',
      links: [
        { name: 'Construcción de Tejados y Cubiertas', url: u('construccion-de-tejados-y-cubiertas') },
        { name: 'Reparación de Tejados y Cubiertas', url: u('reparacion-de-tejados-y-cubiertas') },
        { name: 'Instalación de Onduline Bajo Teja', url: u('instalacion-de-onduline-bajo-teja') },
        { name: 'Instalación de Tejados Panel Sandwich', url: u('instalacion-tejados-panel-sandwich') },
        { name: 'Instalación de Claraboyas', url: u('instalacion-y-reparacion-de-claraboyas') },
      ],
    },
    {
      title: 'Canalones',
      links: [
        { name: 'Instalación de Canalones', url: u('instalacion-de-canalones') },
        { name: 'Mantenimiento y Limpieza de Tejados y Canalones', url: u('mantenimiento-y-limpieza-de-tejados-y-canalones') },
      ],
    },
    {
      title: 'Impermeabilizaciones',
      links: [
        { name: 'Aislamiento Térmico y Acústico', url: u('aislamiento-termico-y-acustico') },
        { name: 'Impermeabilizaciones', url: u('impermeabilizaciones') },
        { name: 'Reparación de Goteras', url: u('reparacion-de-goteras') },
        { name: 'Reparación de Humedades', url: u('reparacion-de-humedades') },
      ],
    },
    {
      title: 'Reformas',
      links: [
        { name: 'Instalación y Reparación de Ventanas Velux', url: u('instalacion-y-reparacion-de-ventanas-velux') },
        { name: 'Reformas Integrales', url: u('reformas-integrales') },
        { name: 'Rehabilitación de Fachadas', url: u('rehabilitacion-de-fachadas') },
        { name: 'Retirada de Amianto - Uralita', url: u('retirada-de-amianto-uralita') },
        { name: 'Trabajos Verticales', url: u('trabajos-verticales') },
      ],
    },
  ]
}

export default function Footer({ site, phone, email, data, contact }) {
  const currentYear = new Date().getFullYear()

  if (!data) {
    return (
      <footer className="bg-[#131749] py-10 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto text-center text-red-300">
          <p className="font-semibold">Error: Footer data unavailable</p>
          <p className="text-sm mt-1">Failed to load footer from CMS. Check Strapi connection and site slug.</p>
        </div>
      </footer>
    )
  }

  const { logo, map, socials, legal: legalLinks, copyright, brandName } = data
  const siteName = formatSiteName(site, map?.defaultLocation || '')
  // analytic-contact is the single source of truth for contact identity —
  // footer-entry values are only fallbacks.
  const displayBrand = contact?.businessName || brandName || `Top Tejados ${siteName}`
  const address = contact?.address || null
  const contactSocials = contact?.socials
    ? Object.entries(contact.socials)
      .filter(([k, v]) => k !== 'id' && typeof v === 'string' && v)
      .map(([k, v]) => ({ name: k, url: v }))
    : []
  const socialLinks = contactSocials.length > 0 ? contactSocials : (socials || [])
  const mapSrc = contact?.mapEmbedUrl
    || `https://maps.google.com/maps?q=${encodeURIComponent(address || map?.defaultLocation || siteName)}&t=&z=8&ie=UTF8&iwloc=&output=embed`
  const siteSlug = String(import.meta.env.PUBLIC_SITE_SLUG || site || '').toLowerCase()

  // Main-city service link columns: Strapi footer entry wins, defaults otherwise
  const serviceColumns = (Array.isArray(data.serviceColumns) && data.serviceColumns.length > 0)
    ? data.serviceColumns
    : defaultServiceColumns(siteSlug)

  return (
    <footer className="bg-[#131749] text-white">
      <div className="max-w-[1140px] mx-auto flex flex-col lg:flex-row">

        {/* ── Left: brand / address / socials / map ── */}
        <div className="w-full lg:w-[360px] shrink-0 px-8 md:px-12 py-12 lg:border-r border-white/15 flex flex-col gap-5">
          <a href="/" className="inline-block" aria-label={displayBrand}>
            <img
              {...(logo?.url
                ? responsiveImage(logo, LOGO_SIZES)
                : { src: '/assets/logo.webp', width: 200, height: 60 })}
              {...(logo?.srcSet ? { srcSet: logo.srcSet } : {})}
              alt={logo?.altImage || `${logo?.altPrefix || 'Tejados'} ${siteName}`}
              className="w-[115px] h-auto object-contain brightness-0 invert"
              loading="lazy"
            />
          </a>

          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-2 text-[14px] font-medium text-white">
              <svg viewBox="0 0 30 20" className="w-[20px] h-[14px] rounded-[2px] shrink-0" aria-hidden="true">
                <rect width="30" height="20" fill="#AA151B" />
                <rect y="5" width="30" height="10" fill="#F1BF00" />
              </svg>
              {displayBrand}
            </p>
            {address && (
              <p className="text-[13px] text-white/80 leading-relaxed">{address}</p>
            )}
          </div>

          {socialLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {socialLinks.map(soc => (
                <a
                  key={soc.name}
                  href={soc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={soc.name}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <SocialIcon name={soc.name} />
                </a>
              ))}
            </div>
          )}

          <div className="rounded-[8px] overflow-hidden w-full max-w-[280px] h-[140px] relative border border-white/10">
            <iframe
              src={mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              title={`Ubicación ${displayBrand}`}
              loading="lazy"
            />
          </div>
        </div>

        {/* ── Right: main service link columns ── */}
        <nav aria-label="Servicios" className="flex-1 px-8 md:px-12 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
            {serviceColumns.map((col, ci) => (
              <div key={ci}>
                <p className="text-[13px] font-semibold tracking-[0.12em] uppercase text-white mb-6">
                  {col.title}
                </p>
                <ul className="flex flex-col gap-4">
                  {(col.links || []).map(l => (
                    <li key={l.name}>
                      <a
                        href={l.url || '#'}
                        className="text-[13.5px] text-white/85 hover:text-white transition-colors leading-relaxed"
                      >
                        {l.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/15">
        <div className="max-w-[1140px] mx-auto px-8 md:px-12 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[13px] text-white/70">
            {copyright?.prefix || '©'} {currentYear} {displayBrand}
          </p>
          {legalLinks?.length > 0 && (
            <div className="flex items-center flex-wrap gap-6">
              {legalLinks.map(link => (
                <a
                  key={link.name}
                  href={link.url}
                  className="text-[13px] text-white/70 hover:text-white transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
