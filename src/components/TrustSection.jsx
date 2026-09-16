import { optimizedImageUrl, titleCasePlace } from '../lib/site.js'
const iconMap = {
  shield: (
    <svg className="w-6 h-6 text-[#24274D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.744c0 5.055 3.383 9.32 8.098 10.75a11.973 11.973 0 0 0 8.098-10.75c0-1.312-.21-2.57-.598-3.744A11.959 11.959 0 0 1 12 2.714Z" />
    </svg>
  ),
  bolt: (
    <svg className="w-6 h-6 text-[#24274D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  ),
  users: (
    <svg className="w-6 h-6 text-[#24274D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a5.97 5.97 0 0 0-.942 3.197M12 10.5a3.375 3.375 0 1 0 0-6.75 3.375 3.375 0 0 0 0 6.75ZM20.25 10.5a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0ZM3.75 10.5a2.625 2.625 0 1 1 5.25 0 2.625 2.625 0 0 1-5.25 0Z" />
    </svg>
  )
}

export default function TrustSection({ site, data }) {
  if (!data) return null
  return (
    <section className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
        {/* Left Image */}
        {data.image?.src && (
          <div className="w-full lg:w-1/2 relative group">
            <div className="relative rounded-[32px] overflow-hidden shadow-2xl">
              <img
                src={optimizedImageUrl(data.image.src, 640)} width="640" height="640"
                alt={data.image.alt}
                className="w-full h-auto object-cover transform scale-100 group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-brand-blue/10 rounded-full blur-3xl -z-10"></div>
          </div>
        )}

        {/* Right Content */}
        <div className="w-full lg:w-1/2 flex flex-col items-start pt-4 lg:pt-0">
          <h2 className="text-[32px] md:text-[40px] font-bold text-[#11181C] mb-6 leading-tight tracking-tight">
            {data.title}
          </h2>
          <p className="text-[#4F4F4F] text-[16px] md:text-[17px] leading-[1.7] mb-10 max-w-[540px]">
            {data.descriptionPrefix} {titleCasePlace(site)}.
          </p>

          <div className="space-y-6 mb-12">
            {(data.features ?? []).map((feature, i) => (
              <div key={i} className="flex items-center gap-5 group/item cursor-default">
                <div className="w-12 h-12 flex items-center justify-center bg-[#F4F7FB] rounded-2xl group-hover/item:bg-[#24274D] group-hover/item:text-white transition-colors duration-300">
                  {iconMap[feature.iconType]}
                </div>
                <span className="text-[15px] md:text-[16px] font-semibold text-[#11181C] tracking-tight">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          <a
            href={data.buttonHref}
            className="inline-block bg-[#24274D] text-white px-10 py-4 rounded-xl font-bold text-[15px] hover:bg-[#1a1d38] transition-all shadow-xl shadow-brand-blue/20 hover:shadow-brand-blue/30 active:scale-95 translate-y-0 hover:-translate-y-1"
          >
            {data.buttonText}
          </a>
        </div>
      </div>
    </section>
  )
}
