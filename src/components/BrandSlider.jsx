import { optimizedImageUrl, autoAlt } from '../lib/site.js'

// Brands render as ONE composite strip image everywhere — individual brand
// uploads in Strapi are ignored so every site/section stays uniform.
const BRANDS_STRIP_URL = '/uploads/Frame_2147223484_1_1024x116_70b52fa8bf.webp'

export default function BrandSlider({ site, data, strapiUrl = '' }) {
  if (!data) return null

  const formattedSite = site || 'la Zona'
  // Entry titles increasingly contain the town name already — appending the
  // site again would render "…en Calafell Calafell". Also undo catalog-style
  // article inversion ("Vendrell, El" -> "El Vendrell").
  const prefix = (data.titlePrefix || '').replace(/([\wÀ-ÿ-]+), (El|La|Los|Las)\b/g, '$2 $1')
  const heading = prefix.toLowerCase().includes(formattedSite.toLowerCase())
    ? prefix
    : `${prefix} ${formattedSite}`
  const src = optimizedImageUrl(BRANDS_STRIP_URL.startsWith('http') ? BRANDS_STRIP_URL : `${strapiUrl}${BRANDS_STRIP_URL}`, 1024)

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6 mb-12 text-center">
        <h2 className="text-[20px] md:text-[24px] font-medium text-[#11181C]">
          {heading}
        </h2>
      </div>
      <div className="max-w-5xl mx-auto px-6 flex justify-center">
        <img
          src={src}
          alt={autoAlt(data.altImage, null, [heading, 'Marcas de confianza'], formattedSite)}
          width="1024"
          height="116"
          className="w-full max-w-4xl h-auto object-contain"
          loading="lazy"
        />
      </div>
    </section>
  )
}
