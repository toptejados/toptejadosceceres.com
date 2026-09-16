// Page-level schema.org builders.
//
// The site already emits an organisation `@graph` from Strapi (analytic-seo
// `jsonLd`), plus a WebPage and a BreadcrumbList assembled by BaseLayout. What
// was missing is the markup that describes the *page*: what service it sells,
// the questions it answers, and — on the blog — a publication date in a format
// a validator accepts. These builders fill those gaps from data that already
// exists in Strapi, and each returns null when its source data is absent so a
// page never emits an empty or half-populated node.

import { toIsoDate } from './dates.js'
import { withSite } from './site.js'

const abs = (base, path) => {
  if (!path) return undefined
  try {
    return new URL(path, base).toString()
  } catch {
    return undefined
  }
}

/**
 * FAQPage from the FAQ block already rendered on the page.
 *
 * Only built from questions that are genuinely present in the markup — the
 * accordions keep their answers in the DOM (collapsed with max-height, never
 * display:none), which is what makes this eligible rather than a mismatch
 * between the structured data and the visible page.
 *
 * Strapi stores service FAQs as {q, a} and zona FAQs as {question, answer};
 * both shapes are accepted.
 */
export function buildFaqPage(faqSection, site = '') {
  const faqs = faqSection?.faqs
  if (!Array.isArray(faqs) || faqs.length === 0) return null

  const entities = faqs
    .map((f) => ({
      q: withSite(f?.q ?? f?.question, site),
      a: withSite(f?.a ?? f?.answer, site),
    }))
    .filter((f) => f.q && f.a)
    .map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    }))

  if (entities.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entities,
  }
}

/**
 * Service for a /{servicio}/{ciudad} page.
 *
 * Deliberately carries no `offers` or `priceRange`. The only prices this site
 * holds live inside marketing prose ("Estimación de precio: Desde 598€-1198€/m²"
 * inside a `tiposSection` text field) — there is no structured price field to
 * read. Regex-scraping those figures into machine-readable `offers` would
 * publish them to Google as firm quotes, and those exact figures are the ones
 * flagged as not defensible. If Strapi later grows a real price field, pass it
 * as `priceRange` and it will be emitted; until then the node is accurate about
 * what is known.
 */
export function buildService({ name, description, serviceSlug, city, cityLabel, base, providerName, image, priceRange, areaServed }) {
  if (!name) return null

  const node = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    serviceType: name,
    url: abs(base, `/${serviceSlug}/${city}`),
    provider: {
      '@type': 'RoofingContractor',
      name: providerName,
      ...(base ? { '@id': `${base.replace(/\/$/, '')}/#organization` } : {}),
    },
  }

  if (description) node.description = description
  if (image) node.image = image
  if (cityLabel || areaServed) {
    node.areaServed = { '@type': 'City', name: areaServed || cityLabel }
  }
  // Only when a real structured value was supplied — see the note above.
  if (priceRange) node.offers = { '@type': 'Offer', priceRange, availability: 'https://schema.org/InStock' }

  return node
}

/**
 * Normalise whatever the CMS stored for a blog post into valid BlogPosting.
 *
 * Strapi's authored `jsonLd` for posts is an `Article` whose `datePublished` is
 * the human string shown on the card ("5 de agosto de 2024"). That is not ISO
 * 8601, so the node fails validation outright. This keeps every field the SEO
 * team authored, upgrades the type to BlogPosting, and replaces the date with
 * the parsed ISO form — dropping the property entirely rather than emitting an
 * invalid one when it cannot be parsed.
 */
export function normaliseBlogPosting(authored, post, { base, canonical, publisherName, logo } = {}) {
  const isoPublished = toIsoDate(post?.dateISO ?? post?.date ?? post?.publishedAt)
  const isoModified = toIsoDate(post?.updatedAt) ?? isoPublished

  const node = {
    '@context': 'https://schema.org',
    ...(authored && typeof authored === 'object' && !Array.isArray(authored) ? authored : {}),
    // BlogPosting is the specific subtype of Article for a blog entry; Google
    // documents it as the type for this content.
    '@type': 'BlogPosting',
  }

  node.headline = node.headline || post?.title || undefined
  node.description = node.description || post?.excerpt || undefined
  if (canonical) {
    node.url = canonical
    node.mainEntityOfPage = { '@type': 'WebPage', '@id': canonical }
  }
  if (post?.coverImg) node.image = node.image || post.coverImg
  if (post?.authorName && !node.author) node.author = { '@type': 'Person', name: post.authorName }
  if (publisherName && !node.publisher) {
    node.publisher = {
      '@type': 'Organization',
      name: publisherName,
      ...(logo ? { logo: { '@type': 'ImageObject', url: logo } } : {}),
    }
  }

  if (isoPublished) node.datePublished = isoPublished
  else delete node.datePublished
  if (isoModified) node.dateModified = isoModified
  else delete node.dateModified

  return node
}
