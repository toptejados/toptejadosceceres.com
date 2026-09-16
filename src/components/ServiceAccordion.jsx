import { useState } from 'react'
import { autoAlt, optimizedImageUrl, withSite } from '../lib/site.js';

// Button under each open service. `ctaLabel` comes from Strapi and wins when
// set; {service} is the service name, {site} the city. Empty -> "Ver <service>".
const ctaText = (ctaLabel, title, site) => {
  const custom = withSite(ctaLabel, site)
    .replace(/\{\s*service\s*\}/gi, title)
    .replace(/\s{2,}/g, ' ')
    .trim()
  return custom || `Ver ${title}`
}

const AccordionItem = ({ title, content, url, isOpen, onClick, ctaLabel = '', site = '', id }) => {
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={isOpen}
        aria-controls={`svc-panel-${id}`}
        id={`svc-trigger-${id}`}
        className="w-full py-5 flex items-center gap-4 text-left group"
      >
        <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isOpen ? 'bg-[#24274D] border-[#24274D] text-white' : 'border-slate-300 text-slate-400 group-hover:border-slate-400'}`}>
          {isOpen ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          )}
        </div>
        <span className={`text-[15px] md:text-[16px] font-semibold transition-colors ${isOpen ? 'text-[#11181C]' : 'text-slate-600 group-hover:text-[#11181C]'}`}>
          {title}
        </span>
      </button>

      {/* See FAQSection: collapsed by max-height so the copy stays crawlable,
          and `inert` so the CTA link inside a closed panel is not a focus trap. */}
      <div
        id={`svc-panel-${id}`}
        role="region"
        aria-labelledby={`svc-trigger-${id}`}
        inert={isOpen ? undefined : ''}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[280px] pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="pl-10">
          <p className="text-[14px] text-slate-500 leading-relaxed font-medium">
            {content}
          </p>
          {url && (
            <a
              href={url}
              aria-label={`Más información sobre ${title}`}
              title={`Más información sobre ${title}`}
              className="inline-block mt-4 bg-[#24274D] text-white text-[13px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#1a1d38] transition-colors"
            >
              {ctaText(ctaLabel, title, site)}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ServiceAccordion({ category, items, image, isReversed = false, altImage = '', alternativeText = '', site = '', ctaLabel = '' }) {
  const [openIndex, setOpenIndex] = useState(0);

  // Several of these render on one page, so the aria-controls/id pairs have to
  // be unique per category or every trigger points at the first panel.
  const categoryId = String(category || 'svc')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return (
    <div className={`flex flex-col md:flex-row items-center gap-12 lg:gap-24 py-16 ${isReversed ? 'md:flex-row-reverse' : ''}`}>
      {/* Image Column */}
      <div className="w-full md:w-1/2">
        <div className="rounded-[24px] overflow-hidden shadow-sm aspect-square md:aspect-[4/3] lg:aspect-square">
          {/* Always below the fold — this block only appears after the hero and
              at least one section of copy. It had no loading hint, so it
              defaulted to eager and was fetched in competition with the LCP. */}
          <img width="800" height="600"
            src={optimizedImageUrl(image)}
            alt={autoAlt(altImage, { alternativeText }, [category], site)}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            loading="lazy"
          />
        </div>
      </div>

      {/* Accordion Column */}
      <div className="w-full md:w-1/2">
        <h3 className="text-[28px] md:text-[36px] font-bold text-[#11181C] mb-8 leading-tight">
          {category}
        </h3>

        <div className="border-t border-slate-200">
          {items.map((item, index) => (
            <AccordionItem
              key={index}
              id={`${categoryId}-${index}`}
              title={item.title}
              content={item.content}
              url={item.url}
              ctaLabel={ctaLabel}
              site={site}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
