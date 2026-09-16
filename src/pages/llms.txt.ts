import type { APIRoute } from 'astro';
import { formatSiteName } from '../lib/site.js'

const STRAPI_URL = import.meta.env.STRAPI_URL || 'https://strapi.digiagency.net';
const STRAPI_TOKEN = import.meta.env.STRAPI_TOKEN;
const SITE_SLUG = import.meta.env.PUBLIC_SITE_SLUG || 'madrid';

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

export const GET: APIRoute = async ({ site, url }) => {
  // Prefer the real request origin — same rule as BaseLayout canonicals.
  const reqIsReal = url.protocol === 'https:' && !/(^localhost$|^127\.|\.vercel\.app$)/.test(url.hostname);
  const envBase = (import.meta.env.PUBLIC_SITE_URL ?? site?.toString() ?? '').replace(/\/$/, '');
  const base = reqIsReal ? url.origin : await getSitePermalink(envBase);
  const siteSlug = import.meta.env.PUBLIC_SITE_SLUG || 'madrid';
  const siteName = formatSiteName(siteSlug);

  const content = `# Top Tejados ${siteName}

> Professional roofing repair, waterproofing, and installation services in ${siteName}, Spain.

## Pages

- [Home](${base}/): Main landing page with services overview, projects, and testimonials.
- [About](${base}/about): Company history, team, values, and credentials.
- [Blog](${base}/blog): Articles and guides about roofing, waterproofing, and maintenance.
- [Projects](${base}/proyectos): Portfolio of completed roofing projects.
- [Contact](${base}/contacto): Contact form and company details.
- [Legal Notice](${base}/aviso-legal): Legal information and terms.
- [Privacy Policy](${base}/politica-de-privacidad): Data protection and privacy policy.
- [Cookie Policy](${base}/politica-de-cookies): Cookie usage policy.

## Sitemap

${base}/sitemap.xml
`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
