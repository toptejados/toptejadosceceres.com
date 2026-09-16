import type { APIRoute } from 'astro';

const STRAPI_URL = import.meta.env.STRAPI_URL || 'https://strapi.digiagency.net';
const STRAPI_TOKEN = import.meta.env.STRAPI_TOKEN;
const SITE_SLUG = import.meta.env.PUBLIC_SITE_SLUG || 'madrid';

async function getSiteSeo(): Promise<{ permalink?: string; robotsTxt?: string }> {
  try {
    const res = await fetch(
      `${STRAPI_URL}/api/analytic-seos?filters[site][$eq]=${SITE_SLUG}&fields[0]=permalink&fields[1]=robotsTxt`,
      { headers: { 'Content-Type': 'application/json', ...(STRAPI_TOKEN && { Authorization: `Bearer ${STRAPI_TOKEN}` }) } },
    );
    if (res.ok) {
      const data = await res.json();
      return data?.data?.[0] || {};
    }
  } catch {}
  return {};
}

// robots.txt is fetched constantly by crawlers and changes almost never, but it
// is assembled from a live Strapi read — so without this every hit was an
// uncached round trip to the CMS.
const CACHE_CONTROL = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';

export const GET: APIRoute = async ({ site, url }) => {
  // Prefer the real request origin — same rule as BaseLayout canonicals.
  const reqIsReal = url.protocol === 'https:' && !/(^localhost$|^127\.|\.vercel\.app$)/.test(url.hostname);
  const envBase = (import.meta.env.PUBLIC_SITE_URL ?? site?.toString() ?? '').replace(/\/$/, '');

  // Strapi's robotsTxt (analytic-seo) wins when set — team edits it directly
  // in Strapi admin, same "leave empty for dynamic" convention as RankMath.
  // Always fetched (even on real requests) since the override must apply in prod too.
  const seo = await getSiteSeo();
  const base = reqIsReal ? url.origin : (seo.permalink?.replace(/\/$/, '') || envBase);
  const sitemapUrl = `${base}/sitemap.xml`;

  if (seo.robotsTxt && seo.robotsTxt.trim()) {
    // A hand-edited override is still allowed to say whatever it likes about
    // crawling, but it must not be able to lose the sitemap reference — that is
    // the only way a crawler discovers the 80-odd server-rendered URLs that are
    // in no static file anywhere. Appended only when absent, so an override that
    // already declares one (even a different one) is left exactly as written.
    const override = seo.robotsTxt.trim();
    const body = /^\s*sitemap\s*:/im.test(override)
      ? override
      : `${override}

Sitemap: ${sitemapUrl}
`;
    return new Response(body, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': CACHE_CONTROL },
    });
  }

  // `Allow: /_image` used to be spelled out here because every image on the site
  // was served through Astro's SSR image endpoint. Images are now static files
  // on strapi.digiagency.net/uploads (see optimizedImageUrl in lib/site.js), so
  // nothing under /_image is referenced any more and naming it would only point
  // crawlers at an endpoint we no longer use.
  const content = `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': CACHE_CONTROL },
  });
};
