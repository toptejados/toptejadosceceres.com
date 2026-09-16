// The migration map the SEO team delivered, served instead of parked.
//
// It shipped as redirect-map.csv in the repo root and nothing ever read it, so
// every old WordPress URL still answers 404 and drops whatever links point at
// it. The rows below are that CSV, transcribed; src/middleware.ts merges them
// with the Strapi `redirects` collection on every request.
//
// Strapi wins on a duplicate source, so the SEO team can still correct any row
// from the admin panel without a deploy. Keeping the baseline in the repo means
// a fresh clone of this template is never one forgotten CMS import away from
// 404ing its entire migration.
//
// Rows that were identity mappings in the CSV (/contacto/ -> /contacto and
// friends) are deliberately absent: those describe the trailing slash, which is
// now handled once, for every URL, by trailingSlash: 'never' plus the edge 301 —
// and as literal rules they would have redirected to themselves forever.

export type RedirectRule = { source: string; destination: string; type: string }

export const STATIC_REDIRECTS: RedirectRule[] = [
  // slug renamed
  { source: '/aislamiento-termico/santander', destination: '/aislamiento-termico-y-acustico/santander', type: 'r301' },
  // closest content match - confirm before publishing
  { source: '/rosetones-en-el-techo-con-roseton', destination: '/blog/rosetones-en-el-techo-con-roseton-decorativo-para-techo-moderno-en-escayola-y-modelos-prefaes', type: 'r301' },
  // internal rename - just shipped in this repo
  { source: '/legal', destination: '/aviso-legal', type: 'r301' },
  // internal rename - just shipped in this repo
  { source: '/privacy', destination: '/politica-de-privacidad', type: 'r301' },
  // internal rename - just shipped in this repo
  { source: '/cookies', destination: '/politica-de-cookies', type: 'r301' },
]

// The service a legacy /zonas/<town> URL falls back to. It is the broadest of the
// roofing services, so it is the closest match to what a generic town landing
// page on the old site used to cover.
export const LEGACY_ZONA_FALLBACK_SERVICE = 'reparacion-de-tejados-y-cubiertas'

/**
 * Pattern rules, tried only after every exact rule has missed.
 *
 * `source` is a path in which a single `*` matches exactly one path segment;
 * `$1` in the destination is replaced with whatever `*` matched. Order matters —
 * the first match wins, so narrow rules go first.
 *
 * The /zonas rule exists because the old site had a /zonas/ page for towns that
 * have no `zonas` row in Strapi yet — Santander, Torrelavega, Castro-Urdiales and
 * Camargo were all indexed and all 404 today. Sending those to the town's own
 * service page keeps both the visitor and the link equity on a page about the
 * same town, instead of discarding them.
 *
 * `guardedBy` names a check in src/middleware.ts that has to confirm the target
 * really exists before the redirect is served. A wildcard can generate a URL for
 * any input, so it must never be trusted to have generated a real one — without
 * the guard, /zonas/anything would 301 into a fresh 404, which is strictly worse
 * than the 404 it started as.
 */
export type PatternRule = {
  source: string
  destination: string
  type: string
  guardedBy?: 'serviceCityExists'
}

export const PATTERN_REDIRECTS: PatternRule[] = [
  // Guarded twice, and the order matters: a town that HAS a zona page is served
  // that page, and only a town with no zona at all falls through to its service
  // page. Santander, Camargo, Castro-Urdiales and Torrelavega were all listed as
  // BLOCKED in redirect-map.csv and have since been published — without the
  // zona check this rule would redirect four live, indexed pages away.
  {
    source: '/zonas/*',
    destination: `/${LEGACY_ZONA_FALLBACK_SERVICE}/$1`,
    type: 'r301',
    guardedBy: 'serviceCityExists',
  },
]

// Indexed on the old site, no destination chosen yet. Left out of the served
// table on purpose: a 301 to a guessed page is worse than the 404 these return
// today, and a wrong guess is invisible once it ships. The /zonas/* rows are
// covered by PATTERN_REDIRECTS above whenever the town has a service page.
// NOTE: the four /zonas/* rows that redirect-map.csv listed as BLOCKED
// (Santander, Camargo, Castro-Urdiales, Torrelavega) have since been published
// in Strapi and now resolve on their own — they are no longer listed here.
export const UNRESOLVED_REDIRECTS: string[] = [
  // NO MATCH - needs manual destination (nearest service or blog post)
  '/pintura-decorativa-para-transformar',
  // NO MATCH - needs manual destination (nearest service or blog post)
  '/techo-inclinados-y-sus-ventajas',
  // BLOCKED - service not yet published in Strapi (site=cantabria)
  '/reformas-integrales/santander',
]
