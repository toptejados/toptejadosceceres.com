import type { APIRoute } from 'astro';

const STRAPI_URL = import.meta.env.STRAPI_URL || 'https://strapi.digiagency.net';
const STRAPI_TOKEN = import.meta.env.STRAPI_TOKEN;
const SITE_SLUG = import.meta.env.PUBLIC_SITE_SLUG || 'madrid';

// Services migrated to their own dedicated collection (>50k rollout cities
// get bespoke per-city entries here) — must mirror SLUG_TO_COLLECTION in lib/strapi.js.
const SERVICE_COLLECTIONS = [
  'construccion-de-tejados-y-cubiertas',
  'reparacion-de-tejados-y-cubiertas',
  'instalacion-de-onduline-bajo-teja',
  'instalacion-tejados-panel-sandwich',
  'instalacion-y-reparacion-de-claraboyas',
  'instalacion-de-canalones',
  'mantenimiento-y-limpieza-de-tejados-y-canalones',
  'aislamiento-termico-y-acustico',
  'impermeabilizaciones',
  'reparacion-de-goteras',
  'reparacion-de-humedades',
  'instalacion-y-reparacion-de-ventanas-velux',
  'reformas-integrales',
  'rehabilitacion-de-fachadas',
  'retirada-de-amianto-uralita',
  'trabajos-verticales',
];

async function strapiFetch(endpoint: string): Promise<any[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(STRAPI_TOKEN && { Authorization: `Bearer ${STRAPI_TOKEN}` }),
  };
  try {
    const res = await fetch(`${STRAPI_URL}/api/${endpoint}`, { headers });
    if (!res.ok) return [];
    return (await res.json()).data ?? [];
  } catch {
    return [];
  }
}

async function getSitePermalink(fallback: string): Promise<string> {
  try {
    const res = await fetch(`${STRAPI_URL}/api/analytic-seos?filters[site][$eq]=${SITE_SLUG}&fields[0]=permalink`, {
      headers: { 'Content-Type': 'application/json', ...(STRAPI_TOKEN && { Authorization: `Bearer ${STRAPI_TOKEN}` }) },
    });
    if (res.ok) {
      const data = await res.json();
      const permalink = data?.data?.[0]?.permalink;
      if (permalink) return permalink.replace(/\/$/, '');
    }
  } catch {}
  return fallback;
}

function buildSitemap(urls: string[]): string {
  const entries = urls.map(url => `  <url><loc>${url}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

export const GET: APIRoute = async ({ site, url }) => {
  // Prefer the real request origin (production = the site's final domain);
  // env/permalink are dev/preview fallbacks — same rule as BaseLayout canonicals.
  const reqIsReal = url.protocol === 'https:' && !/(^localhost$|^127\.|\.vercel\.app$)/.test(url.hostname);
  const envBase = (import.meta.env.PUBLIC_SITE_URL ?? site?.toString() ?? '').replace(/\/$/, '');
  const base = reqIsReal ? url.origin : await getSitePermalink(envBase);

  const [services, blogs, projects, zonas, dedicatedServices] = await Promise.all([
    strapiFetch(`services?filters[site][$eq]=${SITE_SLUG}&fields[0]=slug&fields[1]=city&pagination[pageSize]=100`),
    strapiFetch(`blogs?filters[site][$eq]=${SITE_SLUG}&fields[0]=slug&pagination[pageSize]=100`),
    strapiFetch(`projects?filters[site][$eq]=${SITE_SLUG}&fields[0]=slug&pagination[pageSize]=100`),
    strapiFetch(`zonas?filters[site][$eq]=${SITE_SLUG}&fields[0]=slug&pagination[pageSize]=100`),
    Promise.all(SERVICE_COLLECTIONS.map(c =>
      strapiFetch(`${c}?filters[site][$eq]=${SITE_SLUG}&fields[0]=slug&fields[1]=city&pagination[pageSize]=100`)
    )).then(results => results.flat()),
  ]);

  const urls: string[] = [
    `${base}/`,
    `${base}/about`,
    `${base}/blog`,
    `${base}/contacto`,
    `${base}/proyectos`,
    `${base}/aviso-legal`,
    `${base}/politica-de-privacidad`,
    `${base}/politica-de-cookies`,
  ];

  for (const s of services) {
    if (s.city) {
      urls.push(`${base}/${s.slug}/${s.city}`);
    } else {
      urls.push(`${base}/${s.slug}`);
    }
  }

  for (const b of blogs) {
    const slug = (b.slug ?? '').replace(`${SITE_SLUG}-`, '');
    if (slug) urls.push(`${base}/blog/${slug}`);
  }

  for (const p of projects) {
    if (p.slug) urls.push(`${base}/proyectos/${p.slug}`);
  }

  for (const z of zonas) {
    const slug = (z.slug ?? '').replace(`${SITE_SLUG}-`, '');
    if (slug) urls.push(`${base}/zonas/${slug}`);
  }

  for (const s of dedicatedServices) {
    if (s.slug && s.city) urls.push(`${base}/${s.slug}/${s.city}`);
  }

  const uniqueUrls = [...new Set(urls)];

  // This endpoint issues 20 Strapi queries per hit (one per service collection
  // plus the shared ones) and its content changes only when the CMS does, so it
  // is exactly the kind of response the CDN should be answering.
  return new Response(buildSitemap(uniqueUrls), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
