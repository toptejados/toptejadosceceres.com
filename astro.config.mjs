// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

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
  // On Vercel this setting also produced a host-layer 308 (^/(.*)/$ -> /$1) in
  // .vercel/output/config.json, ahead of the function. Cloudflare Workers has
  // no equivalent config-emitted route, so the middleware redirect is now the
  // ONLY thing collapsing the trailing-slash variant in production — do not
  // remove it as redundant.
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
  adapter: cloudflare({
    // Wrangler's local Workers runtime during `astro dev`, so bindings and the
    // vars in wrangler.jsonc resolve the same way they will in production.
    platformProxy: { enabled: true }
  })
});
