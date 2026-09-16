import { renderBlocks } from '../lib/blocks.jsx'

const LEGAL_CLASSES = { heading: 'text-[24px] font-semibold text-[#0E0C29] mt-10 mb-4' }

export default function LegalContent({ data }) {
  if (!data) {
    return (
      <section className="pt-32 pb-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <p className="font-semibold">Error: Legal page data unavailable</p>
          <p className="text-sm mt-1">Entry not found in Strapi. Check `legal-pages` collection and slug filter.</p>
        </div>
      </section>
    )
  }

  const body = data.body
  const isBlocks = Array.isArray(body)
  const isString = typeof body === 'string'

  return (
    <section className="pt-32 pb-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-[36px] md:text-[44px] font-medium text-[#0E0C29] mb-8 leading-tight">
          {data.title}
        </h1>
        {data.updatedAt && (
          <p className="text-[13px] text-slate-400 mb-10">
            Última actualización: {new Date(data.updatedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}
        <div className="legal-body">
          {isBlocks && renderBlocks(body, { classNames: LEGAL_CLASSES })}
          {isString && <div dangerouslySetInnerHTML={{ __html: body }} />}
        </div>
      </div>
    </section>
  )
}
