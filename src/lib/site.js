// "ciudad-real" -> "Ciudad Real"; safe to import from both Astro pages and client components
// ── Images ───────────────────────────────────────────────────────────────
//
// Every image on the site used to be requested as /_image?href=<strapi url>&w=…
// — Astro's SSR image endpoint, which fetches the file from Strapi and resizes
// it on each request. That cost a serverless round-trip plus an external origin
// fetch per image, exposed the same source at N widths as N crawlable URLs, and
// put strapi.digiagency.net in the critical render path of all 54 domains at
// once.
//
// It is gone. Images are now plain static files under strapi.digiagency.net/
// uploads/… — one stable, query-string-free URL per actual file, cacheable
// forever (the filename is content-hashed; see src/middlewares/uploads-headers.ts
// in strapi-admin). The resizing and re-compression the proxy was doing per
// request happens once, up front, in strapi-admin's
// scripts/backfill-image-formats.mjs, which re-encodes each original in place
// and writes a w320/w480/… webp ladder into the media's `formats`.
//
// So: never synthesise an image URL here. Every URL emitted comes from a
// `formats` entry Strapi returned, which means it is a file that exists — a
// srcset candidate cannot 404, and an image with no derivatives simply falls
// back to its original.

// Resolve a possibly-relative Strapi URL against the API origin. Absolute and
// data: URLs pass through untouched.
export function absoluteUrl(url, apiBase = '') {
  if (!url) return ''
  if (url.startsWith('data:') || url.startsWith('http')) return url
  if (url.startsWith('//')) return `https:${url}`
  if (!url.startsWith('/')) return `${apiBase || ''}/${url}`
  return `${apiBase || ''}${url}`
}

// Previously built the /_image proxy URL. Now a pass-through: the URL handed in
// is already the final static file. The `width` argument is accepted so the ~40
// call sites that pass one keep working, but it no longer selects anything —
// picking a width needs the media object (its `formats`), not a bare URL, so
// call sites that want per-width candidates go through responsiveImage instead.
export function optimizedImageUrl(url, _width, _quality, _format) {
  if (!url) return ''
  // Legacy proxied URLs can still arrive from cached content; unwrap them back
  // to the file they point at rather than re-proxying.
  if (url.startsWith('/_image')) {
    const href = new URLSearchParams(url.slice(url.indexOf('?') + 1)).get('href')
    return href || ''
  }
  return absoluteUrl(url)
}

// The srcset candidates for a media object: every derivative Strapi has on disk
// for it, deduped by width with the smallest file winning when two formats land
// on the same width (the backfill's webp `w768` beats an older `medium` of the
// same size). The original is deliberately excluded — after the backfill there
// is always a derivative at the source width, and it is the better-compressed
// of the two.
export function imageVariants(imageOrUrl, apiBase = '') {
  if (!imageOrUrl || typeof imageOrUrl === 'string') return []
  const byWidth = new Map()
  for (const candidate of Object.values(imageOrUrl.formats || {})) {
    const width = Number(candidate?.width)
    if (!candidate?.url || !width) continue
    const bytes = Number(candidate.sizeInBytes) || Number(candidate.size) * 1024 || Infinity
    const previous = byWidth.get(width)
    if (!previous || bytes < previous.bytes) {
      byWidth.set(width, { url: absoluteUrl(candidate.url, apiBase), width, bytes })
    }
  }
  return [...byWidth.values()].sort((a, b) => a.width - b.width)
}

// Resolve a Strapi media object (or bare URL string) to an absolute source URL,
// preferring a named format. Shared so that a preload <link> and the <img> it is
// meant to warm up can never drift apart and fetch two different files.
export function resolveStrapiImage(imageOrUrl, preferredFormat = 'large', apiBase = '') {
  if (!imageOrUrl) return { src: '', width: 0, height: 0 }
  let chosen = null
  let url = ''
  if (typeof imageOrUrl === 'string') {
    url = imageOrUrl
  } else if (imageOrUrl.formats?.[preferredFormat]?.url) {
    chosen = imageOrUrl.formats[preferredFormat]
    url = chosen.url
  } else {
    // The requested format was never generated (Strapi only creates a format
    // when the original is larger than it). Falling back to `small` here used
    // to hand a 500px file to a full-width hero, which the browser then
    // upscaled. Pick the smallest candidate that still covers the target
    // width, and the widest one when nothing does. Derivatives are listed
    // before the original so that at equal width the re-compressed webp wins.
    const target = FORMAT_WIDTHS[preferredFormat] || 800
    const candidates = [
      ...Object.values(imageOrUrl.formats || {}),
      imageOrUrl,
    ].filter((c) => c?.url && Number(c.width) > 0)
      .sort((a, b) => Number(a.width) - Number(b.width))
    chosen = candidates.find((c) => Number(c.width) >= target)
      || candidates[candidates.length - 1]
      || imageOrUrl
    url = chosen?.url || ''
  }
  if (!url) return { src: '', width: 0, height: 0 }
  return {
    src: absoluteUrl(url, apiBase),
    width: Number(chosen?.width) || Number(imageOrUrl?.width) || 0,
    height: Number(chosen?.height) || Number(imageOrUrl?.height) || 0,
  }
}

export function resolveStrapiImageSrc(imageOrUrl, preferredFormat = 'large', apiBase = '') {
  return resolveStrapiImage(imageOrUrl, preferredFormat, apiBase).src
}

// Hero `sizes`, shared by the <img> and its preload <link>. The widths that go
// with it are no longer declared here: they are whatever the backfill actually
// produced for that particular image, which is the only list that cannot 404.
export const HERO_SIZES = '(min-width: 1024px) 1000px, 100vw'

// srcset/sizes for a Strapi media object. Most visitors are on a 1x or 2x screen
// well under the largest file, so letting the browser choose cuts real-world
// bytes; the largest candidate is unchanged for high-DPR devices and for
// Lighthouse's emulated phone.
//
// Spread the result straight into <SmartImage> or an <img>: it carries `src`,
// `srcSet`, `sizes`, and the intrinsic `width`/`height` that keep the box
// reserved before the bytes land (the CLS half of this fix).
export function responsiveImage(imageOrUrl, sizes, apiBase = '') {
  const resolved = resolveStrapiImage(imageOrUrl, 'large', apiBase)
  const variants = imageVariants(imageOrUrl, apiBase)
  const intrinsic = {
    width: Number(imageOrUrl?.width) || resolved.width || undefined,
    height: Number(imageOrUrl?.height) || resolved.height || undefined,
  }

  // Height that goes with a given candidate width, from the media's own aspect
  // ratio — so the reserved box matches the file that actually loads.
  const heightAt = (w) => (intrinsic.width && intrinsic.height
    ? Math.round((intrinsic.height / intrinsic.width) * w)
    : undefined)

  // One candidate or none (an SVG, a GIF, or a media the backfill has not
  // reached yet): serve the file itself rather than inventing candidates for
  // it. `srcSet`/`sizes` are left undefined instead of carrying a lone
  // descriptor, so the result can be spread onto a plain <img> as-is.
  if (variants.length < 2) {
    const only = variants[0]
    if (!only && !resolved.src) return {}
    return only
      ? { src: only.url, width: only.width, height: heightAt(only.width) }
      : { src: resolved.src, ...intrinsic }
  }

  const largest = variants[variants.length - 1]
  return {
    src: largest.url,
    srcSet: variants.map((v) => `${v.url} ${v.width}w`).join(', '),
    sizes,
    width: largest.width,
    height: heightAt(largest.width),
  }
}

// The header and footer logos both render at ~115px CSS, on every page, and the
// header one is preloaded at high priority — so the widest ladder step they can
// justify is small.
export const LOGO_SIZES = '115px'

// Google renders roughly 60 characters (~580px) of a <title>; past that it
// truncates mid-phrase. Append each suffix only while the whole title still
// fits, so a long post title keeps its keywords and the brand — the part worth
// losing — is what gets dropped. Suffixes are tried in order, most important
// first, and the first one that does not fit stops the chain.
export const TITLE_MAX_CHARS = 60

export function composeTitle(main, suffixes = [], max = TITLE_MAX_CHARS) {
  let title = String(main ?? '').trim()
  for (const suffix of suffixes) {
    const s = String(suffix ?? '').trim()
    if (!s) continue
    const next = `${title} | ${s}`
    if (next.length > max) break
    title = next
  }
  return title
}

// Sensible output widths per Strapi format name
export const FORMAT_WIDTHS = { thumbnail: 160, small: 480, medium: 800, large: 1200 }

export function formatSiteName(slug, fallback = '') {
  if (!slug) return fallback
  return String(slug)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// Strapi's media library is shared across every site in the network, so
// alternativeText can carry another site's place name (e.g. "Tarragona"
// leaking onto a Cantabria page). Drop it and fall back to the caller's
// own copy instead of showing wrong-region alt text.
const NETWORK_PLACE_TOKENS = [
  'tarragona',
  'cantabria',
  'toledo',
  'guadalajara',
  'guipuzcoa',
  'valladolid',
  'madrid',
]

// This site's own name is never a leak — "Tejados en Toledo" is exactly what
// the Toledo site should say. Read from the same env var as the Strapi client.
const OWN_SITE_TOKEN = String(
  import.meta.env?.PUBLIC_SITE_SLUG
  || (typeof process !== 'undefined' ? process.env?.PUBLIC_SITE_SLUG : '')
  || ''
).toLowerCase()

// `keep` is the place the current page is about — the town on /[service]/[city].
// It is legitimate even when it is another site's name, so it is never stripped.
export function safeAlt(text, keep = '') {
  if (!text) return ''
  const lower = String(text).toLowerCase()
  const allowed = [OWN_SITE_TOKEN, String(keep).toLowerCase()].filter(Boolean)
  const leaked = NETWORK_PLACE_TOKENS.some(
    (t) => lower.includes(t) && !allowed.some((a) => a.includes(t) || t.includes(a))
  )
  return leaked ? '' : text
}

// ── Alt text ────────────────────────────────────────────────────────────────
// Copy in Strapi is written once per service and reused for every city, so it
// carries a `{site}` placeholder (also seen as `{city}`/`{ciudad}`). It was
// already resolved for headings but not for alt text, which is why alt strings
// like "Construcción de Tejados y Cubiertas en {site}" reached the HTML.
const SITE_PLACEHOLDER = /\{\s*(site|city|ciudad)\s*\}/gi

// Spanish place names keep their connecting words lowercase — "Santa María de
// Cayón", "Los Corrales de Buelna" — so a naive word-by-word capitalisation
// produces "De Cayón" and reads as machine output. Only these particles are
// held back, and never in first position ("El Astillero" keeps its capital).
const PLACE_PARTICLES = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'a', 'i'])

/**
 * Title-case a place name that arrived as a slug or in lower case.
 *
 * Several call sites pass the raw Strapi `site` value, which is the lowercase
 * slug ("santander", "ciudad-real"), straight into visible copy — that is how
 * headings such as "Reparación de tejados en santander" reached production. The
 * fix belongs here rather than at each caller, because the same value also feeds
 * titles, alt text and breadcrumbs.
 *
 * A string that already contains an uppercase letter is returned untouched: the
 * CMS holds correctly-cased names like "A Coruña" and "Santa María de Cayón",
 * and re-casing those would only break them.
 */
export function titleCasePlace(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (/\p{Lu}/u.test(raw)) return raw
  return raw
    .split(/([\s-]+)/)
    .map((token, i) => {
      if (/^[\s-]+$/.test(token)) return token === '-' ? ' ' : token
      if (i > 0 && PLACE_PARTICLES.has(token)) return token
      return token.charAt(0).toUpperCase() + token.slice(1)
    })
    .join('')
}

/**
 * Resolve the {site} / {city} / {ciudad} placeholders the CMS copy is written
 * with. Copy is authored once per service and reused for every city, so these
 * tokens appear throughout headings, alt text and body text.
 *
 * Two things this does that a bare `.replace('{site}', site)` at the call site
 * did not: it is a global replace, so a string mentioning the city twice no
 * longer ships the second `{site}` verbatim to the browser; and it title-cases
 * the substituted value, so a lowercase slug does not land mid-sentence.
 */
export function withSite(text, site) {
  if (!text) return ''
  return String(text)
    .replace(SITE_PLACEHOLDER, titleCasePlace(site))
    .replace(/\s{2,}/g, ' ')
    .trim()
}

const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Catalog-style inversion, as the CMS stores some towns: "Vendrell, El" -> "El Vendrell".
const uninvertArticle = (s) => {
  const m = String(s ?? '').trim().match(/^(.+?),\s*(el|la|los|las|els|les|l['\u2019])$/i)
  if (!m) return String(s ?? '').trim()
  return /['\u2019]$/.test(m[2]) ? `${m[2]}${m[1]}` : `${m[2]} ${m[1]}`
}

const ARTICLE_PREFIX = /^(?:el|la|los|las|els|les)\s+|^l['\u2019]\s*/i

// "Tejados de Teja" + "Santander" -> "Tejados de Teja en Santander".
// Already-mentioned city is left alone so alt never reads "... en Santander en Santander".
export function withCity(text, site) {
  // Trailing punctuation is stripped only so an appended "en <city>" does not
  // land after a full stop. When nothing is appended the original text is
  // returned untouched — stripping it there turned a finished sentence into
  // "...viviendas y negocios" with no full stop.
  const original = String(text ?? '').trim()
  const base = original.replace(/\s*[.,;:]+$/, '')
  // Title-cased for the same reason withSite() does it: several callers pass the
  // raw Strapi slug, and this value is appended to alt text as a proper noun —
  // "Tejados en cantabria" was reaching production on every home page image.
  const city = titleCasePlace(uninvertArticle(site))
  if (!city) return base
  if (!base) return city
  // Test the bare name as well as the full one: copy written as "en Vendrell"
  // already names "El Vendrell" and must not grow a second "en El Vendrell".
  const names = [city, city.replace(ARTICLE_PREFIX, '')].filter(Boolean)
  const mentioned = names.some((n) =>
    new RegExp(`(^|[^\\p{L}])${escapeRegExp(n)}([^\\p{L}]|$)`, 'iu').test(base)
  )
  return mentioned ? original : `${base} en ${city}`
}

// Alt text for a CMS-driven image, in priority order:
//   1. `explicit` — the section's own `altImage` field in Strapi. The SEO team
//      owns this one, so it is used verbatim (placeholders still resolved) and
//      the city is NOT appended: whatever they typed is the alt.
//   2. the media file's own `alternativeText` (minus leaked place names, see safeAlt)
//   3. the first non-empty contextual title passed by the caller
// Cases 2 and 3 are the automatic fallback and get the current city appended,
// so entries that predate the `altImage` field keep working and still read as
// local. Returns '' only when there is nothing at all to say.
export function autoAlt(explicit, image, fallbacks = [], site = '') {
  const override = withSite(explicit, site)
  if (override) return override

  const candidates = [
    image && typeof image === 'object' ? safeAlt(image.alternativeText, site) : '',
    // `alt` is the same media alternativeText under a different key (the contact
    // banner arrives that way), so it gets the same leak filter.
    image && typeof image === 'object' ? safeAlt(image.alt, site) : '',
    ...(Array.isArray(fallbacks) ? fallbacks : [fallbacks]),
  ]
  for (const c of candidates) {
    const base = withSite(c, site)
    if (base) return withCity(base, site)
  }
  return ''
}

// ── Telephone ───────────────────────────────────────────────────────────────
// A `tel:` href has to carry the country code to be dialable from outside Spain
// and to be understood by Google's click-to-call. Strapi stores the number in
// whatever shape the site was set up with ("842 841 326", "+34 842841326",
// "0034842841326"), and the call sites were doing `phone.replace(/\s/g,'')`,
// which produced `tel:842841326` — a national number a foreign handset cannot
// dial, and not the E.164 form structured data expects.
//
// Spanish landline/mobile numbers are 9 digits and never start with 0.
const DEFAULT_COUNTRY_CODE = '34'

export function telHref(phone, countryCode = DEFAULT_COUNTRY_CODE) {
  const raw = String(phone ?? '').trim()
  if (!raw) return ''
  // Keep a leading +, drop every other non-digit (spaces, dots, dashes, parens).
  const hasPlus = raw.startsWith('+')
  let digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  if (!hasPlus) {
    // 00 prefix is the international access code — same thing as a +.
    if (digits.startsWith('00')) digits = digits.slice(2)
    else if (digits.length === 9) digits = `${countryCode}${digits}`
  }
  return `tel:+${digits}`
}

/** The same number in E.164 without the scheme — for schema.org `telephone`. */
export function telE164(phone, countryCode = DEFAULT_COUNTRY_CODE) {
  return telHref(phone, countryCode).replace(/^tel:/, '')
}

/**
 * Normalise a CMS-authored href.
 *
 * Editors type `tel:` links straight into Strapi button fields, and they arrive
 * as national numbers (`tel:842841326`) that a foreign handset cannot dial —
 * the same defect telHref() fixes for the template's own links, except this one
 * cannot be corrected in code at the point it is written. Everything that is
 * not a tel: link passes through untouched.
 */
export function cmsHref(href, fallback = '') {
  const raw = String(href ?? '').trim()
  if (!raw) return fallback
  if (/^tel:/i.test(raw)) return telHref(raw.slice(4)) || fallback
  return raw
}
