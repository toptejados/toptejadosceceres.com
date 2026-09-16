import { useState, useEffect } from 'react'
import { optimizedImageUrl, titleCasePlace, telHref } from '../lib/site.js'

export default function HeroSection({ title, content, bannerUrl, bannerAlt, site, phone, data }) {
  const heroSection = data
  if (!heroSection) return null
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const accent = 'var(--primary-color)'

  const paragraphs = content?.split('\n').filter(Boolean) ?? []

  return (
    <main className="relative min-h-screen flex flex-col bg-stone-950 overflow-x-hidden">

      {/* ── Background Elements ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {bannerUrl ? (
          <div className="relative w-full h-full">
            <img width="1600" height="900"
              src={optimizedImageUrl(bannerUrl, 1600)}
              alt={bannerAlt}
              className="w-full h-full object-cover grayscale opacity-20"
            />
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-stone-950/80" />
          </div>
        ) : (
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-stone-900 to-stone-950" />
        )}

        <div
          className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{ background: accent }}
        />

        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      </div>

      {/* ── Hero Content ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center pt-24 pb-16 px-6 md:px-12 lg:px-20">
        <div className="container mx-auto">
          <div className="max-w-4xl">

            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-stone-800 bg-stone-900/50 backdrop-blur-sm text-[10px] tracking-[0.25em] uppercase font-bold text-stone-300 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: accent }}></span>
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: accent }}></span>
              </span>
              {heroSection.badge} {titleCasePlace(site)}
            </div>

            {/* Title */}
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-8"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(40px)',
                transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {title.split(' ').map((word, i) => (
                <span key={i} className="inline-block mr-4 last:mr-0 last:text-stone-500">
                  {word}
                </span>
              ))}
            </h1>

            {/* Description */}
            <div
              className="max-w-2xl space-y-5 mb-12"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
              }}
            >
              {paragraphs.map((p, i) => (
                <p key={i} className="text-stone-400 text-lg md:text-xl leading-relaxed font-light">
                  {p}
                </p>
              ))}
            </div>

            {/* Buttons */}
            <div
              className="flex flex-col sm:flex-row items-start sm:items-center gap-6"
              style={{ opacity: visible ? 1 : 0, transition: 'opacity 1s ease 0.6s' }}
            >
              <a
                href={telHref(phone)}
                className="group relative px-8 py-4 bg-white text-stone-950 font-bold text-sm tracking-widest uppercase overflow-hidden transition-all hover:pr-12"
                onMouseEnter={e => e.currentTarget.style.backgroundColor = accent}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
              >
                <span className="relative z-10 transition-colors group-hover:text-white">
                  {heroSection.callButton.emoji} {heroSection.callButton.label}
                </span>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1 text-white">→</span>
              </a>

              <a
                href={heroSection.servicesButton.href}
                className="px-8 py-4 border border-stone-800 text-stone-400 font-bold text-sm tracking-widest uppercase hover:text-white hover:border-stone-600 transition-all"
              >
                {heroSection.servicesButton.label}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div
        className="relative z-10 border-t border-stone-900 bg-stone-950/50 backdrop-blur-sm px-6 md:px-12 py-10"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.8s',
        }}
      >
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {heroSection.stats.map((stat, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-3xl font-black mb-1" style={{ color: accent }}>{stat.num}</span>
              <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-stone-500">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

    </main>
  )
}
