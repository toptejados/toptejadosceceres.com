import { optimizedImageUrl } from '../lib/site.js'
// Shared "recent blogs" layout: featured post left, up to 3 thumbnail rows right.
// Posts arrive pre-mapped from Astro pages (image URLs already absolute).
export default function RecentBlogsSection({ subtitle = 'Blog', title, posts = [], visible = true }) {
  const items = (posts || []).filter(Boolean).slice(0, 4)
  if (items.length === 0) return null
  const [featured, ...side] = items

  const imgUrl = (p) => p.image?.url ? optimizedImageUrl(p.image.url) : null

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h3 className="text-[14px] font-medium text-slate-500 mb-3">{subtitle}</h3>
          <h2 className="text-[32px] md:text-[36px] font-medium text-[#11181C] leading-tight">
            {title}
          </h2>
        </div>
        <a
          href="/blog"
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#24274D] hover:text-[#1a1d38] transition-colors group/link"
        >
          Ver todos los artículos
          <span className="inline-block transition-transform duration-300 group-hover/link:translate-x-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Featured post */}
        <a
          href={featured.url}
          className="group/blog-card block bg-white rounded-[16px] border border-slate-200 overflow-hidden transition-all duration-300 ease-out hover:border-[#24274D]/30 hover:shadow-[0_8px_24px_-8px_rgba(36,39,77,0.15)] hover:-translate-y-0.5"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease, box-shadow 0.3s ease',
          }}
        >
          <div className="relative aspect-[4/3] bg-slate-100">
            {imgUrl(featured) && (
              <img
                src={imgUrl(featured)}
                alt={featured.image?.alt || featured.title || ''}
                width={featured.image?.width || 800}
                height={featured.image?.height || 600}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/blog-card:scale-105"
                loading="lazy"
              />
            )}
          </div>
          <div className="p-6 md:p-7">
            <div className="text-[13px] text-slate-400 font-medium mb-2">{featured.date}</div>
            <h3 className="text-[18px] md:text-[20px] font-semibold text-[#11181C] leading-snug mb-2 group-hover/blog-card:text-[#24274D] transition-colors">
              {featured.title}
            </h3>
            <p className="text-[14px] text-slate-500 line-clamp-2 leading-relaxed">
              {featured.description}
            </p>
          </div>
        </a>

        {/* Side posts */}
        <div className="flex flex-col gap-5">
          {side.map((p, i) => (
            <a
              href={p.url}
              key={i}
              className="group/blog-card flex bg-white rounded-[16px] border border-slate-200 overflow-hidden transition-all duration-300 ease-out hover:border-[#24274D]/30 hover:shadow-[0_8px_24px_-8px_rgba(36,39,77,0.15)] hover:-translate-y-0.5"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.6s ease ${(i + 1) * 0.08}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${(i + 1) * 0.08}s, border-color 0.3s ease, box-shadow 0.3s ease`,
              }}
            >
              <div className="relative w-[130px] sm:w-[160px] shrink-0 bg-slate-100 self-stretch min-h-[120px]">
                {imgUrl(p) && (
                  <img
                    src={imgUrl(p)}
                    alt={p.image?.alt || p.title || ''}
                    width={p.image?.width || 800}
                    height={p.image?.height || 600}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/blog-card:scale-105"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="p-4 sm:p-5 flex flex-col justify-center">
                <div className="text-[12.5px] text-slate-400 font-medium mb-1.5">{p.date}</div>
                <h3 className="text-[15px] sm:text-[16px] font-semibold text-[#11181C] leading-snug mb-1.5 group-hover/blog-card:text-[#24274D] transition-colors">
                  {p.title}
                </h3>
                <p className="text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
