import React from 'react'
import aboutData from '../data/about.json'

export default function AboutContent({ apiData, strapiUrl }) {
  const getImageUrl = (imageOrUrl, preferredFormat = 'large') => {
    if (!imageOrUrl) return '';
    let url = '';

    let w = 800;
    if (preferredFormat === 'thumbnail') w = 150;
    if (preferredFormat === 'small') w = 400;
    if (preferredFormat === 'medium') w = 800;
    if (preferredFormat === 'large') w = 1200;

    if (typeof imageOrUrl === 'string') {
      url = imageOrUrl;
      if (url.includes('randomusers/assets/avatars')) w = 150;
    } else {
      if (imageOrUrl.formats && imageOrUrl.formats[preferredFormat] && imageOrUrl.formats[preferredFormat].url) {
        url = imageOrUrl.formats[preferredFormat].url;
      } else {
        url = imageOrUrl.url || '';
      }
    }
    if (!url) return '';

    let finalUrl = url;
    if (!url.startsWith('http') && !url.startsWith('//')) {
      finalUrl = `${strapiUrl || ''}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    // Static Strapi URL, not the /_image SSR proxy: the file is already
    // compressed at rest, so there is nothing left to do per request. `w` is
    // kept in the signature for the call sites that pass it.
    return finalUrl;
  };

  const historyImage = apiData?.history?.image ? getImageUrl(apiData.history.image) : aboutData.history.image;
  const historyTitle = apiData?.history?.title || aboutData.history.title;
  const historyText = apiData?.history?.text || aboutData.history.text;

  const heroTitle = apiData?.hero?.title || aboutData.hero.title;
  const heroSubtitle = apiData?.hero?.description || aboutData.hero.subtitle;
  const heroImage = apiData?.hero?.image ? getImageUrl(apiData.hero.image) : aboutData.hero.image;

  const stats = apiData?.stats?.length > 0
    ? apiData.stats.map(s => ({
      value: `${s.prefix || ''}${s.value}`,
      label: s.label
    }))
    : aboutData.stats;

  const valuesTitle = apiData?.values?.title || aboutData.values.title;
  const valuesItems = apiData?.values?.items?.length > 0
    ? apiData.values.items.map(c => ({
      title: c.title,
      description: c.description
    }))
    : aboutData.values.items;

  const ctaTitle = apiData?.cta?.title || aboutData.cta.title;
  const ctaSubtitle = apiData?.cta?.subtitle || aboutData.cta.subtitle;
  const ctaButton = apiData?.cta?.button || aboutData.cta.button;
  const ctaUrl = apiData?.cta?.url || aboutData.cta.url;
  return (
    <div className="bg-white font-['Inter',sans-serif]">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-slate-50">
        <div className="absolute inset-0 z-0">
          <img width="1200" height="800" src={heroImage} alt="Fondo de cabecera" className="w-full h-full object-cover opacity-[0.15]" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 to-slate-50"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <span className="inline-block py-1.5 px-4 rounded-full bg-[var(--primary-color,#e5421d)]/10 text-[var(--primary-color,#e5421d)] text-sm font-bold tracking-wider uppercase mb-6">
            Conócenos
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            {heroSubtitle}
          </p>
        </div>
      </section>

      {/* History Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <img width="1200" height="800" src={historyImage} alt="Nuestra Historia" className="w-full h-auto object-cover" />
              </div>
              <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-[var(--primary-color,#e5421d)]/10 rounded-full blur-3xl z-0"></div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">{historyTitle}</h2>
              <div className="space-y-6 text-slate-600 text-lg leading-relaxed">
                {historyText.split('\n\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[var(--primary-color,#e5421d)] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center p-4">
                <span className="text-4xl md:text-5xl font-extrabold mb-3">{stat.value}</span>
                <span className="text-white/80 font-medium text-sm md:text-base uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 lg:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{valuesTitle}</h2>
            <div className="w-24 h-1 bg-[var(--primary-color,#e5421d)] mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {valuesItems.map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow duration-300 group">
                <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[var(--primary-color,#e5421d)] transition-colors duration-300">
                  <span className="text-2xl font-bold text-[var(--primary-color,#e5421d)] group-hover:text-white transition-colors">0{i + 1}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-slate-900 text-white text-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-90 z-10"></div>
          <img width="1200" height="800" src={heroImage} alt="Fondo de llamada a la acción" className="w-full h-full object-cover filter grayscale opacity-30" />
        </div>
        <div className="max-w-3xl mx-auto px-6 relative z-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{ctaTitle}</h2>
          <p className="text-lg md:text-xl text-slate-300 mb-10">{ctaSubtitle}</p>
          <a href={ctaUrl} className="inline-block px-10 py-4 bg-[var(--primary-color,#e5421d)] hover:bg-[var(--primary-color,#e5421d)]/90 text-white font-bold rounded-xl text-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(229,66,29,0.3)]">
            {ctaButton}
          </a>
        </div>
      </section>
    </div>
  )
}
