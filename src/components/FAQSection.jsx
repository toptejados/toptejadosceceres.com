import { useState } from 'react'
import { titleCasePlace } from '../lib/site.js'

export default function FAQSection({ site: rawSite = '', data }) {
  const [openIndex, setOpenIndex] = useState(0)
  if (!data) return null

  // The zonas route passes the raw lowercase slug, which used to render as
  // "Preguntas frecuentes en santander" in an <h2>.
  const site = titleCasePlace(rawSite)

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-16">

        {/* Left Side: Title */}
        <div className="md:w-1/3">
          <h2 
            className="text-[#000000] font-medium text-[32px] leading-[32px]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {data.title || `${data.titlePrefix ?? ''} ${site}`.trim()}
          </h2>
        </div>

        {/* Right Side: Accordion */}
        <div className="md:w-2/3 flex flex-col gap-4">
          {(data.faqs ?? []).map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden border border-slate-100 bg-[#f8fafc] transition-all duration-300"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
                aria-expanded={openIndex === i}
                aria-controls={`faq-panel-${i}`}
                id={`faq-trigger-${i}`}
                className="w-full text-left p-6 flex justify-between items-center group"
              >
                <h3 
                  className="text-[#1F2124] font-medium text-[16px] leading-[24px] group-hover:text-blue-600 transition-colors pr-8 m-0"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                >
                  {faq.question}
                </h3>
                <span className={`text-[24px] text-blue-500 transition-transform duration-300 transform ${openIndex === i ? 'rotate-180' : ''}`}>
                  {openIndex === i ? '−' : '+'}
                </span>
              </button>

              {/* Collapsed with max-height, never display:none — the answer stays in
                  the DOM and in the rendered text, which is what makes these
                  eligible for an FAQ rich result and what a crawler reads.
                  `inert` is what was missing: without it the links inside a
                  closed panel stayed in the tab order and in the accessibility
                  tree, so keyboard focus disappeared into invisible content and
                  screen readers announced answers to questions nobody opened. */}
              <div
                id={`faq-panel-${i}`}
                role="region"
                aria-labelledby={`faq-trigger-${i}`}
                inert={openIndex === i ? undefined : ''}
                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === i ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="p-6 pt-0 text-[#687076] text-[15px] leading-relaxed border-t border-slate-50/50">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
