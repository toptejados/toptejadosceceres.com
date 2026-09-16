// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://tejados-web.vercel.app',
  output: 'server',

  // Astro's default ('ignore') serves /page and /page/ as two 200s for the same
  // content, which is a duplicate of every URL on the site. Canonicals here are
  // emitted without the slash and the old WordPress site linked everything with
  // one, so 'never' is the variant to keep. This setting only governs how Astro
  // matches routes — the 301 that collapses the other variant is issued in
  // src/middleware.ts, so both layers agree instead of one of them 200ing.
  // Deliberately not repeated in vercel.json: @astrojs/vercel already emits the
  // host-layer redirect from this setting, as the first route in
  // .vercel/output/config.json (^/(.*)/$ -> /$1, 308). Declaring it there too
  // would be a second mechanism aiming at the same thing, and the two can
  // drift. That note used to live in vercel.json under a "//trailingSlash" key,
  // which Vercel's schema rejects as an unknown property and which failed the
  // deploy. Verify after a build with:
  //   node -e "console.log(require('./.vercel/output/config.json').routes[0])"
  trailingSlash: 'never',

  // No @astrojs/sitemap here on purpose. It builds a STATIC sitemap at build
  // time, and every route on this site is server-rendered from Strapi — so it
  // emitted only the 8 hardcoded pages, gave them no <lastmod>, and stamped them
  // with the `site` fallback above (tejados-web.vercel.app) rather than the real
  // domain. That file shipped to /sitemap-index.xml and /sitemap-0.xml, where a
  // crawler could find a sitemap advertising someone else's host.
  //
  // src/pages/sitemap.xml.ts is the real one: it queries Strapi per request, so
  // it covers the zonas, blog posts and all /{servicio}/{ciudad} routes (89 URLs
  // against the static file's 8), carries each entry's true Strapi updatedAt as
  // <lastmod>, and resolves the host from the live request. robots.txt points
  // there.
  integrations: [
    preact({ compat: true }),
  ],

  build: {
    inlineStylesheets: 'always'
  },

  image: {
    remotePatterns: [
      { protocol: 'http' },
      { protocol: 'https' }
    ]
  },

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        'react': 'preact/compat',
        'react-dom': 'preact/compat',
        'react/jsx-runtime': 'preact/jsx-runtime',
      }
    }
  },
  adapter: vercel()
});