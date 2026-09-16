import { optimizedImageUrl, autoAlt, cmsHref } from '../lib/site.js'
export default function WhyChooseSection({ data, site = '' }) {
  if (!data) return null

  // CMS `feature.icon` is uniformly "check" on every entry (not a real icon
  // name), so matching it against the switch below always misses — bullets
  // rendered as empty circles. Cycle a fixed set positionally instead.
  const ICON_CYCLE = ['shield', 'bolt', 'warning', 'hardhat']
  const renderIcon = (name, index) => {
    const key = ['shield', 'bolt', 'warning', 'hardhat'].includes(name)
      ? name
      : ICON_CYCLE[index % ICON_CYCLE.length]
    switch (key) {
      case 'shield':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        )
      case 'bolt':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        )
      case 'warning':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        )
      case 'hardhat':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 18a10 10 0 0 1 20 0" />
            <path d="M2 18h20" />
            <path d="M10 10V6a2 2 0 0 1 4 0v4" />
            <path d="M6 18v-4a6 6 0 0 1 12 0v4" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="w-full">
            {data.image ? (
              <img width="1200" height="480"
                src={optimizedImageUrl(data.image, 1200)}
                alt={autoAlt(data.altImage, { alternativeText: data.alternativeText }, [data.title, data.subtitle], site)}
                className="w-full h-[380px] md:h-[480px] object-cover rounded-[20px]"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-[380px] md:h-[480px] rounded-[20px] bg-slate-100" />
            )}
          </div>

          <div className="flex flex-col">
            {data.subtitle && (
              <p className="text-[11px] font-bold tracking-[0.15em] text-slate-400 mb-3 uppercase">
                {data.subtitle}
              </p>
            )}
            <h2 className="text-[32px] md:text-[40px] font-semibold text-[#11181C] leading-tight tracking-tight mb-5">
              {data.title}
            </h2>
            {data.description && (
              <p className="text-[16px] text-slate-500 leading-[1.6] mb-8">
                {data.description}
              </p>
            )}

            {(data.features ?? []).length > 0 && (
              <div className="flex flex-col gap-5 mb-10">
                {data.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="shrink-0 w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                      {renderIcon(f.icon, i)}
                    </span>
                    <p className="text-[15px] md:text-[16px] text-[#11181C] leading-[1.5] pt-1.5 font-medium">
                      {f.title}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {data.button?.text && (
              <div>
                <a
                  href={cmsHref(data.button.url, '/contacto')}
                  className="inline-flex items-center justify-center bg-[#24274D] text-white px-7 py-3.5 rounded-lg font-semibold text-[15px] hover:bg-[#1a1d38] transition-colors shadow-sm"
                >
                  {data.button.text}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
