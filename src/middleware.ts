import { defineMiddleware } from 'astro:middleware';
import { getRedirects, getServiceCities, getZonaSlugs } from './lib/strapi';
import {
  STATIC_REDIRECTS,
  PATTERN_REDIRECTS,
  LEGACY_ZONA_FALLBACK_SERVICE,
  type RedirectRule,
} from './data/redirects';

const REDIRECT_CACHE_TTL_MS = 60_000;
let redirectCache: { data: RedirectRule[]; ts: number } = { data: [], ts: 0 };

/**
 * Canonical host for this deployment, derived from the same value that feeds
 * astro.config.mjs `site`, the sitemap and every canonical tag — so the
 * middleware cannot disagree with them. Empty when unset (preview builds),
 * which disables host canonicalisation rather than guessing.
 */
const CANONICAL_HOST = (() => {
  try {
    return new URL(import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || '').hostname;
  } catch {
    return '';
  }
})();

const normPath = (p: string) => (p || '').replace(/\/+$/, '') || '/';

/**
 * The repo baseline (always available) overlaid with whatever the SEO team has
 * entered in Strapi. Strapi wins on a duplicate source so a row can be corrected
 * from the admin panel without a deploy, and the migration map still gets served
 * when Strapi is unreachable or was never populated.
 *
 * Self-referential rows are dropped here rather than at the call site: a rule
 * whose source and destination normalise to the same path would 301 to itself
 * forever, because the destination re-enters this same lookup on the next
 * request. Several rows in redirect-map.csv had exactly that shape.
 */
function mergeRedirects(remote: RedirectRule[]): RedirectRule[] {
  const bySource = new Map<string, RedirectRule>();
  for (const r of [...STATIC_REDIRECTS, ...remote]) {
    if (!r?.source || !r?.destination) continue;
    const source = normPath(r.source);
    const isAbsolute = /^https?:\/\//i.test(r.destination);
    if (!isAbsolute && normPath(r.destination) === source) continue;
    bySource.set(source, { source, destination: r.destination, type: r.type || 'r301' });
  }
  return [...bySource.values()];
}

async function getCachedRedirects(): Promise<RedirectRule[]> {
  const now = Date.now();
  if (now - redirectCache.ts > REDIRECT_CACHE_TTL_MS) {
    try {
      redirectCache = { data: mergeRedirects(await getRedirects()), ts: now };
    } catch {
      // Strapi unreachable — keep serving what we have. Seeding an empty cache
      // from the repo baseline is still better than serving no redirects at all.
      redirectCache = {
        data: redirectCache.data.length ? redirectCache.data : mergeRedirects([]),
        ts: now,
      };
    }
  }
  return redirectCache.data;
}

// Towns that have a real per-city entry for the fallback service. This is the
// guard behind the /zonas/* wildcard: it is what stops the rule from 301ing an
// unknown town into a URL that would itself 404. Cached for the same window as
// the redirect table; a Strapi failure yields an empty set, which makes the
// wildcard decline to fire and leaves today's 404 in place.
let serviceCityCache: { data: Set<string>; ts: number } = { data: new Set(), ts: 0 };

async function getServiceCitySet(): Promise<Set<string>> {
  const now = Date.now();
  if (now - serviceCityCache.ts > REDIRECT_CACHE_TTL_MS) {
    try {
      const cities = await getServiceCities(LEGACY_ZONA_FALLBACK_SERVICE);
      serviceCityCache = {
        data: new Set((cities ?? []).map((c: string) => String(c).toLowerCase())),
        ts: now,
      };
    } catch {
      serviceCityCache = { ...serviceCityCache, ts: now };
    }
  }
  return serviceCityCache.data;
}

/**
 * Compile a rule like `/zonas/*` into a matcher for exactly one path segment.
 * Deliberately not a general glob: a `*` allowed to span `/` would let
 * /zonas/a/b/c collapse into a destination that was never meant to exist.
 *
 * @returns the captured segment, '' for a literal match, or null for no match
 */
export function matchPattern(source: string, pathname: string): string | null {
  const idx = source.indexOf('*');
  if (idx === -1) return source === pathname ? '' : null;
  const prefix = source.slice(0, idx);
  const suffix = source.slice(idx + 1);
  if (!pathname.startsWith(prefix)) return null;
  if (suffix && !pathname.endsWith(suffix)) return null;
  const captured = pathname.slice(prefix.length, pathname.length - suffix.length);
  if (!captured || captured.includes('/')) return null;
  return captured;
}

// Zonas that really exist. The /zonas/* wildcard must never fire for one of
// these: four of them (Santander, Camargo, Castro-Urdiales, Torrelavega) were
// unpublished when the redirect map was written and have since gone live, and
// without this check the wildcard 301s a real, sitemap-listed page away to the
// service page — silently taking four published pages off the site.
let zonaSlugCache: { data: Set<string>; ts: number } = { data: new Set(), ts: 0 };

async function getZonaSlugSet(): Promise<Set<string>> {
  const now = Date.now();
  if (now - zonaSlugCache.ts > REDIRECT_CACHE_TTL_MS) {
    try {
      zonaSlugCache = { data: new Set(await getZonaSlugs()), ts: now };
    } catch {
      zonaSlugCache = { ...zonaSlugCache, ts: now };
    }
  }
  return zonaSlugCache.data;
}

async function resolvePatternRedirect(pathname: string) {
  for (const rule of PATTERN_REDIRECTS) {
    const captured = matchPattern(rule.source, pathname);
    if (!captured) continue;
    if (rule.guardedBy === 'serviceCityExists') {
      // A live page always wins over a legacy redirect rule.
      const zonas = await getZonaSlugSet();
      if (zonas.has(captured.toLowerCase())) continue;
      const cities = await getServiceCitySet();
      if (!cities.has(captured.toLowerCase())) continue;
    }
    return {
      destination: rule.destination.replace('$1', captured),
      code: Number(rule.type.replace(/^r/, '')) || 301,
    };
  }
  return null;
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  // Both hostnames served the site with a 200 and each self-canonicalised, so
  // Google saw two complete copies and split ranking signals between them —
  // while the crawl budget of a freshly migrated site got spent fetching the
  // same pages twice. Send every request to the one canonical host.
  //
  // The canonical host is read from PUBLIC_SITE_URL rather than hardcoded to the
  // apex. Sites in this family disagree: tejados-cantabria is canonical on the
  // apex, most others on www. A hardcoded www-strip here fought the host-layer
  // apex -> www redirect and produced ERR_TOO_MANY_REDIRECTS on every page.
  // Only the www/apex pair is rewritten — never a preview or unrelated host, and
  // never when the request already matches the canonical host, so it cannot loop.
  const canonicalHost = CANONICAL_HOST;
  const reqHost = ctx.url.hostname;
  if (
    canonicalHost &&
    reqHost !== canonicalHost &&
    (reqHost === `www.${canonicalHost}` || `www.${reqHost}` === canonicalHost)
  ) {
    const target = new URL(ctx.url);
    target.hostname = canonicalHost;
    return ctx.redirect(target.toString(), 301);
  }

  // Trailing slash: /page/ and /page both returned 200 for the same content,
  // duplicating every URL on the site. trailingSlash: 'never' in
  // astro.config.mjs now settles it ahead of this middleware in both
  // environments that matter — on Vercel the adapter emits an edge redirect
  // (^/(.*)/$ -> /$1, 308) that runs before the function, and `astro dev`
  // refuses to match the slashed variant at all. This branch is the backstop for
  // an adapter that does neither (the node adapter, say): it keeps the guarantee
  // that no host anywhere serves both variants with a 200.
  const pathname = normPath(ctx.url.pathname);
  if (pathname !== ctx.url.pathname) {
    const target = new URL(ctx.url);
    target.pathname = pathname;
    return ctx.redirect(target.toString(), 301);
  }

  const redirects = await getCachedRedirects();
  const match = redirects.find(r => r.source === pathname);

  if (match) {
    const code = Number(match.type.replace(/^r/, ''));
    if (code === 410 || code === 451) {
      return new Response(null, { status: code });
    }
    return ctx.redirect(match.destination, code as 301 | 302 | 307);
  }

  // Wildcards last, so an exact rule for a URL always beats a pattern that would
  // also have matched it.
  const pattern = await resolvePatternRedirect(pathname);
  if (pattern) {
    return ctx.redirect(pattern.destination, pattern.code as 301 | 302 | 307);
  }

  // Expose the redirect sources so BaseLayout can refuse to canonicalise to a
  // URL that only 301s. A canonical must name the final, indexable URL; a stale
  // Strapi canonicalUrl pointing at a renamed slug otherwise makes the page
  // non-indexable in every crawler.
  (ctx.locals as Record<string, unknown>).redirectSources = new Set(
    redirects.map(r => r.source)
  );

  const response = await next();

  // Clone the response to safely modify headers in Vercel environment
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
  });

  // This header used to be an unconditional "index, follow", which also stamped
  // it onto every 404 — explicitly inviting crawlers to index a not-found page.
  // Dynamic routes here rewrite to /404 for any unknown slug, so that is not a
  // rare path: it is what every mistyped or not-yet-published URL returns.
  const isNotFound = response.status === 404;
  newResponse.headers.set('X-Robots-Tag', isNotFound ? 'noindex, follow' : 'index, follow');

  // Security headers (SEO audits flag their absence). CSP kept minimal on
  // purpose: frame-ancestors blocks clickjacking, upgrade-insecure-requests
  // auto-upgrades any stray http:// subresource — neither restricts what the
  // pages themselves load, so no feature can break.
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
  newResponse.headers.set('Content-Security-Policy', "frame-ancestors 'self'; upgrade-insecure-requests");

  return newResponse;
});
