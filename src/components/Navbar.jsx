import { useState, useEffect, useRef } from 'react'
import { formatSiteName, responsiveImage, LOGO_SIZES, telHref } from '../lib/site.js'
import LazyMap from './LazyMap.jsx'

export default function Navbar({ site, phone, email, waLink, socials, data }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [zonaSearch, setZonaSearch] = useState('')
  const dropdownRef = useRef(null)

  const sitePhone = phone || '+34 900 000 000'
  const siteEmail = email || `contacto@tejados${site || 'burgos'}.es`
  const siteWaLink = `https://api.whatsapp.com/send/?phone=${sitePhone.replace(/[^0-9]/g, '')}&text&type=phone_number&app_absent=0`
  const siteSocials = socials || []

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mobileDrawerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      const inNav = dropdownRef.current && dropdownRef.current.contains(e.target);
      const inDrawer = mobileDrawerRef.current && mobileDrawerRef.current.contains(e.target);
      if (!inNav && !inDrawer) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleMobileDropdown = (e, name) => {
    const isOpening = activeDropdown !== name;
    setActiveDropdown(isOpening ? name : null);
    if (isOpening) {
      const target = e.currentTarget;
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  };

  const accent = 'var(--primary-color)'
  const accentHover = 'var(--secondary-color)'

  if (!data) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-[999] bg-red-50 border-b border-red-200 px-6 py-4">
        <div className="max-w-7xl mx-auto text-center text-red-700">
          <p className="font-semibold">Error: Navbar data unavailable</p>
          <p className="text-sm mt-1">Failed to load menu from CMS. Check Strapi connection and site slug.</p>
        </div>
      </nav>
    )
  }

  if (!data.logo?.url) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-[999] bg-red-50 border-b border-red-200 px-6 py-4">
        <div className="max-w-7xl mx-auto text-center text-red-700">
          <p className="font-semibold">Error: Navbar logo missing</p>
          <p className="text-sm mt-1">Menu found but `logo` not populated. Check Strapi menu entry and populate params.</p>
        </div>
      </nav>
    )
  }

  const navLinks = data.navLinks

  return (
    <>
      {/* Main navbar */}
      <nav
        ref={dropdownRef}
        className={`fixed top-0 left-0 right-0 z-[999] transition-all duration-300 px-[max(1.5rem,calc((100%-1140px)/2))] flex items-center justify-between ${scrolled || mobileMenuOpen
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 py-3'
          : 'bg-white/80 backdrop-blur-sm border-b border-slate-100 py-4'
          }`}
      >
        {/* Logo */}
        <a href="/" className="flex items-center group cursor-pointer z-50 shrink-0">
          <img
            {...responsiveImage(data.logo, LOGO_SIZES)}
            alt={data.logo.alt}
            className="w-[85px] md:w-[115px] h-auto object-contain transition-transform group-hover:scale-105"
            fetchPriority="high"
            loading="eager"
          />
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.filter(item => !item.onlyMobile).map((item) => (
            <div key={item.name} className={`relative ${item.megaMenu ? 'static' : ''}`}>
              {item.megaMenu || item.dropdown ? (
                <>
                  <button
                    className="flex items-center gap-1 px-4 py-2 font-medium text-[16px] leading-[1.2] tracking-normal text-[#000000] transition-colors rounded-lg hover:bg-slate-50 relative group"
                    onClick={() => setActiveDropdown(activeDropdown === item.name ? null : item.name)}
                  >
                    {item.name}
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`transition-transform duration-300 ${activeDropdown === item.name ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Mega Menu Render */}
                  {item.megaMenu && (
                    <div className={`absolute top-full left-0 w-full bg-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border-t border-slate-100 py-10 transition-all duration-300 ease-out origin-top ${activeDropdown === item.name ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                      <div className="max-w-7xl mx-auto px-6 lg:px-10 w-full flex flex-row justify-between gap-8">
                        {item.columns.map(col => (
                          <div key={col.title} className="flex-1 flex flex-col border-r border-slate-100/70 last:border-r-0 pr-8 last:pr-0">
                            <p className="font-medium text-[16px] text-[#000000] mb-6">
                              {col.title}
                            </p>
                            <div className="flex flex-col gap-4">
                              {col.items.map(sub => (
                                <div key={sub.name} className="flex flex-col">
                                  {sub.ciudades && sub.ciudades.length > 0 ? (
                                    <a href={sub.ciudades[0].href} className="text-[14px] text-slate-500 hover:text-brand-blue transition-colors leading-relaxed" onClick={() => setActiveDropdown(null)}>
                                      {sub.name}
                                    </a>
                                  ) : (
                                    <a href={sub.href} className="text-[14px] text-slate-500 hover:text-brand-blue transition-colors leading-relaxed" onClick={() => setActiveDropdown(null)}>
                                      {sub.name}
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Standard Dropdown Render: search + list + province map */}
                  {!item.megaMenu && item.dropdown && (() => {
                    const titleSub = item.dropdown.find(sub => sub.isTitle)
                    const linkSubs = item.dropdown.filter(sub => !sub.isTitle)
                    const filtered = linkSubs.filter(sub => sub.name.toLowerCase().includes(zonaSearch.toLowerCase()))
                    // Use the site's fixed province (env slug), not the per-page `site` prop —
                    // on service pages `site` is the current city (e.g. "Santander"), and a bare
                    // "Santander" query resolves on Google Maps to Banco Santander HQ in Madrid,
                    // not the city in Cantabria. Appending ", España" disambiguates.
                    const provinceLabel = formatSiteName(import.meta.env.PUBLIC_SITE_SLUG || site)
                    return (
                      <div className={`absolute top-full left-0 mt-3 bg-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 rounded-xl flex w-[520px] max-w-[90vw] overflow-hidden transition-all duration-300 ease-out origin-top-left ${activeDropdown === item.name ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}>
                        {/* Left: title + search + scrollable list */}
                        <div className="w-[55%] py-4 flex flex-col">
                          {titleSub && (
                            <p className="px-5 pb-1 font-medium text-[17px] text-[#000000]">{titleSub.name}</p>
                          )}
                          <div className="px-5 py-2">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 focus-within:border-brand-blue transition-colors">
                              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m20 20-3.5-3.5" /></svg>
                              <input
                                type="text"
                                value={zonaSearch}
                                onChange={e => setZonaSearch(e.target.value)}
                                placeholder="Buscar zona..."
                                className="w-full text-[14px] text-slate-700 placeholder:text-slate-400 outline-none bg-transparent"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col overflow-y-auto max-h-[46vh]">
                            {filtered.length > 0 ? filtered.map(sub => (
                              <a key={sub.name} href={sub.href} className="flex items-center gap-2.5 px-5 py-2.5 text-[14px] text-slate-500 hover:text-brand-blue hover:bg-slate-50/50 transition-colors" onClick={() => { setActiveDropdown(null); setZonaSearch('') }}>
                                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                                {sub.name}
                              </a>
                            )) : (
                              <p className="px-5 py-3 text-[13px] text-slate-400">Sin resultados</p>
                            )}
                          </div>
                        </div>
                        {/* Right: current province map */}
                        <div className="w-[45%] relative min-h-[300px] border-l border-slate-100">
                          <iframe
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(provinceLabel ? `${provinceLabel}, España` : 'España')}&t=&z=9&ie=UTF8&iwloc=&output=embed&hl=es`}
                            className="absolute inset-0 w-full h-full border-0"
                            title={`Mapa de ${provinceLabel}`}
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )
                  })()}
                </>
              ) : (
                <a
                  href={item.href}
                  className="px-4 py-2 font-medium text-[16px] leading-[1.2] tracking-normal text-[#000000] transition-colors rounded-lg hover:bg-slate-50 flex items-center relative group"
                >
                  {item.name}
                  <span
                    className="absolute bottom-0 left-4 right-4 h-px scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
                    style={{ background: accent }}
                  />
                </a>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={telHref(sitePhone)}
            className="flex items-center justify-center gap-[6px] w-[171px] h-[40px] px-3 py-2 border border-brand-blue rounded-md text-brand-blue text-[14px] font-semibold leading-[1.2] hover:bg-slate-50 transition-all whitespace-nowrap"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.59 3.45 2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.81-.81a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {sitePhone}
          </a>
          <a
            href="/contacto"
            className="flex items-center justify-center gap-[6px] w-[199px] h-[40px] px-3 py-2 rounded-md bg-brand-blue text-white text-[14px] font-semibold leading-[1.2] hover:bg-brand-blue/90 transition-all shadow-sm group whitespace-nowrap"
          >
            {data.ctaButton}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </a>
        </div>

        {/* Mobile phone button + hamburger */}
        <div className="md:hidden flex items-center gap-2 ml-auto shrink-0 z-[999]">
          <a
            href={telHref(sitePhone)}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-brand-blue text-white text-[13px] font-semibold leading-[1.2] hover:bg-brand-blue/90 transition-all shadow-sm whitespace-nowrap"
            aria-label={`Llamar al ${sitePhone}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.59 3.45 2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.81-.81a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {sitePhone}
          </a>
          <button
            className="text-slate-900 p-2 -mr-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Alternar menú"
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Drawer */}
      <div
        ref={mobileDrawerRef}
        className={`fixed inset-y-0 right-0 z-[70] w-full max-w-[420px] bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] md:hidden flex flex-col ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <a href="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
            <img
              {...responsiveImage(data.logo, LOGO_SIZES)}
              alt={data.logo.alt}
              className="w-[90px] h-auto object-contain"
              fetchPriority="high"
              loading="eager"
            />
          </a>
          <div className="flex items-center gap-3">
            <a href={telHref(sitePhone)} className="flex items-center justify-center gap-[8px] px-3 py-2 rounded-md bg-brand-blue text-white text-[14px] font-semibold hover:bg-brand-blue/90 transition-all shadow-sm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.59 3.45 2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.81-.81a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {sitePhone}
            </a>
            <button
              className="text-slate-900 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Cerrar menú"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex flex-col flex-1 overflow-y-auto px-6 py-4">
          {navLinks.map((item, idx) => {
            if (item.megaMenu) {
              return (
                <div key={item.name} className={`flex flex-col relative w-full transition-all duration-500 ease-out ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${idx * 40}ms` }}>
                  <div className="pt-2 pb-4 text-[18px] text-[#000000]">{item.name}</div>
                  <div className="flex flex-col mb-1">
                    {item.columns.map(col => (
                      <div key={col.title} className="flex flex-col w-full border-b border-slate-50 last:border-b-0">
                        <button
                          className="flex items-center justify-between py-3.5 pr-1 text-[16px] text-[#11181C] hover:text-brand-blue transition-colors group w-full text-left"
                          onClick={(e) => toggleMobileDropdown(e, col.title)}
                        >
                          {col.title}
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-400 group-hover:text-brand-blue transition-transform duration-300 ${activeDropdown === col.title ? 'rotate-90' : ''}`}><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                        <div className={`flex flex-col overflow-hidden transition-all duration-300 ${activeDropdown === col.title ? 'max-h-[600px] mb-2 opacity-100' : 'max-h-0 opacity-0'}`}>
                          {col.items.map(sub => (
                            <div key={sub.name} className="flex flex-col w-full">
                              {sub.ciudades && sub.ciudades.length > 0 ? (
                                <a href={sub.ciudades[0].href} className="py-2.5 pl-3 pr-2 text-[14px] text-slate-500 hover:text-brand-blue transition-colors leading-relaxed border-l-2 border-transparent hover:border-brand-blue hover:bg-slate-50 relative ml-1" onClick={() => setMobileMenuOpen(false)}>
                                  {sub.name}
                                </a>
                              ) : (
                                <a href={sub.href} className="py-2.5 pl-3 pr-2 text-[14px] text-slate-500 hover:text-brand-blue transition-colors leading-relaxed border-l-2 border-transparent hover:border-brand-blue hover:bg-slate-50 relative ml-1" onClick={() => setMobileMenuOpen(false)}>
                                  {sub.name}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <hr className="my-2 border-slate-100" />
                </div>
              )
            }
            if (item.dropdown) {
              return (
                <div key={item.name} className={`flex flex-col w-full transition-all duration-500 ease-out ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${idx * 40}ms` }}>
                  <button
                    className="flex items-center justify-between py-4 w-full text-left text-[18px] text-[#000000] hover:text-brand-blue group"
                    onClick={(e) => toggleMobileDropdown(e, item.name)}
                  >
                    {item.name}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-400 group-hover:text-brand-blue transition-all ${activeDropdown === item.name ? 'rotate-90' : ''}`}><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </button>
                  <div className={`flex flex-col transition-all duration-300 ${activeDropdown === item.name ? 'max-h-[50vh] mb-4 overflow-y-auto' : 'max-h-0 overflow-hidden'}`}>
                    <div className="pl-4 pr-2 pb-2 pt-1 sticky top-0 bg-white">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 focus-within:border-brand-blue transition-colors">
                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m20 20-3.5-3.5" /></svg>
                        <input
                          type="text"
                          value={zonaSearch}
                          onChange={e => setZonaSearch(e.target.value)}
                          placeholder="Buscar zona..."
                          className="w-full text-[14px] text-slate-700 placeholder:text-slate-400 outline-none bg-transparent"
                        />
                      </div>
                    </div>
                    {item.dropdown.filter(sub => !sub.isTitle && sub.name.toLowerCase().includes(zonaSearch.toLowerCase())).map(sub => (
                      <a key={sub.name} href={sub.href} className="py-3 pl-4 text-[15px] text-[#11181C] hover:text-brand-blue transition-colors" onClick={() => { setMobileMenuOpen(false); setZonaSearch('') }}>
                        {sub.name}
                      </a>
                    ))}
                    {item.dropdown.filter(sub => !sub.isTitle && sub.name.toLowerCase().includes(zonaSearch.toLowerCase())).length === 0 && (
                      <p className="py-3 pl-4 text-[13px] text-slate-400">Sin resultados</p>
                    )}
                  </div>
                  {item.mobileDivider && <hr className="my-2 border-slate-100" />}
                </div>
              )
            }
            return (
              <div key={item.name} className={`w-full transition-all duration-500 ease-out ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${idx * 40}ms` }}>
                <a
                  href={item.href}
                  className="flex text-[18px] py-4 text-[#000000] hover:text-brand-blue transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
                {item.mobileDivider && <hr className="my-2 border-slate-100" />}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
