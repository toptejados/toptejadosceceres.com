import { blogDateSortKey, toIsoDate } from './dates.js'

const STRAPI_URL = import.meta.env.STRAPI_URL || (typeof process !== 'undefined' ? process.env.STRAPI_URL : null) || 'https://strapi.digiagency.net'
const STRAPI_TOKEN = import.meta.env.STRAPI_TOKEN || (typeof process !== 'undefined' ? process.env.STRAPI_TOKEN : null)
const SITE_SLUG = import.meta.env.PUBLIC_SITE_SLUG || (typeof process !== 'undefined' ? process.env.PUBLIC_SITE_SLUG : null) || 'madrid'


async function strapiGet(endpoint) {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Astro/Vercel',
    ...(STRAPI_TOKEN && { Authorization: `Bearer ${STRAPI_TOKEN}` }),
  }
  try {
    const res = await fetch(`${STRAPI_URL}/api/${endpoint}`, { headers })
    if (res.status === 404) return null
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Strapi ${res.status}: ${res.statusText}. Body: ${errText.substring(0, 200)}`)
    }
    return (await res.json()).data
  } catch (err) {
    console.error(`Error fetching from Strapi: ${err.message}`)
    return null
  }
}

// Strapi returns media URLs relative to its own origin. Absolutise the whole
// media — original plus every entry in `formats` — so components can hand the
// object straight to responsiveImage() without also needing the API base.
// The logo is preloaded with fetchpriority=high on every page, so serving the
// full-width original there costs more than anywhere else on the site.
function absolutiseMedia(media) {
  if (!media?.url) return null
  const abs = (u) => (u && !u.startsWith('http') ? `${STRAPI_URL}${u.startsWith('/') ? '' : '/'}${u}` : u)
  const formats = Object.fromEntries(
    Object.entries(media.formats || {}).map(([k, f]) => [k, { ...f, url: abs(f?.url) }])
  )
  return { ...media, url: abs(media.url), formats }
}

export async function getHomePage() {
  const params = [
    `filters[site][$eq]=${SITE_SLUG}`,
    `populate=*`,
    `populate[ogImage]=*`,
  ].join('&')
  const data = await strapiGet(`homes?${params}`)
  return data?.[0] ?? null
}

export async function getAboutPage() {
  const params = [
    `filters[site][$eq]=${SITE_SLUG}`,
    `populate[hero][populate]=image`,
    `populate[history][populate]=image`,
    `populate[stats]=*`,
    `populate[values][populate]=items`,
    `populate[cta]=*`,
    `populate[ogImage]=*`,
  ].join('&')
  const data = await strapiGet(`nosotross?${params}`)
  return data?.[0] ?? null
}

export async function getContactPage() {
  const params = [
    `filters[site][$eq]=${SITE_SLUG}`,
    `populate[jsonLd]=*`,
  ].join('&')
  const data = await strapiGet(`contacts-pages?${params}`)
  return data?.[0] ?? null
}

const SERVICE_POPULATE_PARAMS = [
  `populate[hero][populate][images]=*`,
  `populate[stats]=*`,
  `populate[tabsSection][populate][tabs][populate][img][fields][0]=url`,
  `populate[tabsSection][populate][tabs][populate][img][fields][1]=alternativeText`,
  `populate[tabsSection][populate][listItems]=*`,
  `populate[typesSection][populate][tabs][populate][img]=*`,
  `populate[typesSection][populate][listItems]=*`,
  `populate[tiposSection][populate][tipos][populate][img][fields][0]=url`,
  `populate[tiposSection][populate][tipos][populate][img][fields][1]=alternativeText`,
  `populate[tableSection][populate][rows]=*`,
  `populate[compareSection][populate][rows]=*`,
  `populate[featuresSection][populate][features][populate][image]=*`,
  `populate[comparisonSection][populate][features][populate][image]=*`,
  `populate[whyChooseSection][populate][image]=*`,
  `populate[benefitsIntroSection][populate][image]=*`,
  `populate[bannerSection][populate][images]=*`,
  `populate[faqSection][populate][faqs]=*`,
  `populate[brandsSection][populate][image]=*`,
  `populate[brandsSection][populate][logos]=*`,
  `populate[processSection][populate][image]=*`,
  `populate[processSection][populate][steps]=*`,
  `populate[benefitsSection][populate][0]=benefits`,
  `populate[benefitsSection][populate][1]=image`,
  `populate[benefitsWindowSection][populate][benefits]=*`,
  `populate[exploreSection][populate][items][populate][image]=*`,
  `populate[applicationsSection][populate][items][populate][image]=*`,
  `populate[zonasSection][populate][cities]=*`,
  `populate[processImage]=*`,
  `populate[zonasMap]=*`,
  `populate[contactMap]=*`,
]

// Services migrated to their own dedicated collection (bespoke schema/layout per
// service type) — slug -> Strapi API endpoint. Anything not listed here still
// lives in the old shared `services` collection.
const SLUG_TO_COLLECTION = {
  'construccion-de-tejados-y-cubiertas': 'construccion-de-tejados-y-cubiertas',
  'reparacion-de-tejados-y-cubiertas': 'reparacion-de-tejados-y-cubiertas',
  'instalacion-de-onduline-bajo-teja': 'instalacion-de-onduline-bajo-teja',
  'instalacion-tejados-panel-sandwich': 'instalacion-tejados-panel-sandwich',
  'instalacion-y-reparacion-de-claraboyas': 'instalacion-y-reparacion-de-claraboyas',
  'instalacion-de-canalones': 'instalacion-de-canalones',
  'mantenimiento-y-limpieza-de-tejados-y-canalones': 'mantenimiento-y-limpieza-de-tejados-y-canalones',
  'aislamiento-termico-y-acustico': 'aislamiento-termico-y-acustico',
  'impermeabilizaciones': 'impermeabilizaciones',
  'reparacion-de-goteras': 'reparacion-de-goteras',
  'reparacion-de-humedades': 'reparacion-de-humedades',
  'instalacion-y-reparacion-de-ventanas-velux': 'instalacion-y-reparacion-de-ventanas-velux',
  'reformas-integrales': 'reformas-integrales',
  'rehabilitacion-de-fachadas': 'rehabilitacion-de-fachadas',
  'retirada-de-amianto-uralita': 'retirada-de-amianto-uralita',
  'trabajos-verticales': 'trabajos-verticales',
}

export async function getServices() {
  const params = [
    `filters[site][$eq]=${SITE_SLUG}`,
    ...SERVICE_POPULATE_PARAMS,
  ].join('&')
  const data = await strapiGet(`services?${params}`)
  return data ?? []
}

export async function getServiceBySlugAndCity(slug, city) {
  const endpoint = SLUG_TO_COLLECTION[slug] || 'services'
  const params = [
    `filters[site][$eq]=${SITE_SLUG}`,
    ...(endpoint === 'services' ? [`filters[slug][$eq]=${encodeURIComponent(slug)}`] : []),
    `filters[city][$eq]=${encodeURIComponent(city)}`,
    ...SERVICE_POPULATE_PARAMS,
  ].join('&')
  const data = await strapiGet(`${endpoint}?${params}`)
  return data?.[0] ?? null
}

// Cities (>50k rollout) that have their own entry for this service — drives the
// "Principales Zonas de Servicio" pills on service pages.
export async function getServiceCities(slug) {
  const endpoint = SLUG_TO_COLLECTION[slug] || 'services'
  const params = [
    `filters[site][$eq]=${SITE_SLUG}`,
    ...(endpoint === 'services' ? [`filters[slug][$eq]=${encodeURIComponent(slug)}`] : []),
    `fields[0]=city`,
    `pagination[pageSize]=100`,
  ].join('&')
  const data = await strapiGet(`${endpoint}?${params}`)
  return [...new Set((data ?? []).map(e => e.city).filter(Boolean))]
}

export async function getProjects() {
  const data = await strapiGet(`projects?filters[site][$eq]=${SITE_SLUG}&populate=*`)
  return data ?? []
}

export async function getMenu() {
  const params = [
    `filters[site][$eq]=${SITE_SLUG}`,
    `populate[logo]=*`,
    `populate[navLinks][populate][columns][populate][items][populate]=ciudades`,
    `populate[navLinks][populate][dropdown][populate]=*`,
  ].join('&')

  // Sites without projects shouldn't show the Proyectos nav item, and the same
  // holds for Blog: a site with no posts served a listing that fell back to the
  // six seed articles in data/blogPage.json, so deleting the last post in Strapi
  // published fake content instead of emptying the page.
  const [menuData, projectsProbe, blogsProbe] = await Promise.all([
    strapiGet(`menus?${params}`),
    strapiGet(`projects?filters[site][$eq]=${SITE_SLUG}&fields[0]=id&pagination[pageSize]=1`),
    strapiGet(`blogs?filters[site][$eq]=${SITE_SLUG}&fields[0]=id&pagination[pageSize]=1`),
  ])
  const hasProjects = Array.isArray(projectsProbe) && projectsProbe.length > 0
  // A failed probe yields null, not [] — treat that as "no blogs" so an
  // unreachable Strapi hides the link rather than linking to an empty page.
  const hasBlogs = Array.isArray(blogsProbe) && blogsProbe.length > 0

  const menu = menuData?.[0]
  if (!menu) return null

  const logoMedia = absolutiseMedia(menu.logo)

  return {
    logo: logoMedia
      ? {
        ...logoMedia,
        alt: menu.logoAlt || menu.logo?.alternativeText || '',
      }
      : null,
    navLinks: (menu.navLinks ?? [])
      .filter(link => hasProjects || link.href !== '/proyectos')
      .filter(link => hasBlogs || link.href !== '/blog')
      .map(link => {
      const columns = (link.columns ?? []).map(col => ({
        title: col.title,
        items: (col.items ?? []).map(item => ({
          name: item.name,
          href: item.href,
          ciudades: (item.ciudades ?? []).map(c => ({ name: c.nombre, href: c.url })),
        })),
      }))
      const dropdown = (link.dropdown ?? []).map(sub => ({
        name: sub.name,
        href: sub.href ?? undefined,
        isTitle: sub.isTitle ?? false,
      }))
      return {
        name: link.name,
        href: link.href ?? undefined,
        megaMenu: link.megaMenu ?? false,
        onlyMobile: link.onlyMobile ?? false,
        mobileDivider: link.mobileDivider ?? false,
        ...(columns.length ? { columns } : {}),
        ...(dropdown.length ? { dropdown } : {}),
      }
    }),
    ctaButton: menu.ctaButton,
  }
}

export async function getFooter() {
  const params = [
    `filters[site][$eq]=${SITE_SLUG}`,
    `populate[logo][populate]=*`,
    `populate[map]=*`,
    `populate[links]=*`,
    `populate[areas]=*`,
    `populate[socials]=*`,
    `populate[legal]=*`,
    `populate[copyright]=*`,
  ].join('&')
  const data = await strapiGet(`footers?${params}`)
  const footer = data?.[0]
  if (!footer) return null

  const logoMedia = absolutiseMedia(footer.logo?.image)
  return {
    logo: {
      // Spread first so the component gets `formats` for srcset, then let the
      // component's own copy fields win over the media's.
      ...(logoMedia || {}),
      url: logoMedia?.url || footer.logo?.url,
      srcSet: logoMedia ? null : footer.logo?.srcSet,
      altPrefix: footer.logo?.altPrefix,
      width: logoMedia?.width ?? footer.logo?.width,
      height: logoMedia?.height ?? footer.logo?.height,
      altImage: footer.logo?.altImage || null,
      captionImage: footer.logo?.captionImage || null,
    },
    map: { defaultLocation: footer.map?.defaultLocation },
    links: footer.links ?? [],
    brandName: footer.brandName ?? null,
    address: footer.address ?? null,
    areasTitle: footer.areasTitle ?? null,
    areas: footer.areas ?? [],
    serviceColumns: footer.serviceColumns ?? null,
    socials: footer.socials ?? [],
    legal: footer.legal ?? [],
    copyright: footer.copyright ?? {},
  }
}

export async function getUiZona(slug) {
  const params = [
    `filters[site][$eq]=${slug}`,
    `populate[heroSection][populate]=*`,
    `populate[faqSection][populate]=*`,
    `populate[contactBanner][populate]=*`,
    `populate[trustSection][populate][image][populate][src]=*`,
    `populate[trustSection][populate][features]=*`,
    `populate[advantagesSection][populate]=*`,
    `populate[brandSlider][populate][brands][populate]=*`,
  ].join('&')
  const data = await strapiGet(`ui-zonas?${params}`)
  const ui = data?.[0]
  if (!ui) return null

  const resolveUrl = u => u ? (u.startsWith('http') ? u : `${STRAPI_URL}${u}`) : null

  return {
    heroSection: ui.heroSection ?? null,
    faqSection: ui.faqSection ?? null,
    contactBanner: ui.contactBanner
      ? {
        ...ui.contactBanner,
        image: ui.contactBanner.image
          ? {
            src: resolveUrl(ui.contactBanner.image.url) ?? ui.contactBanner.image.src ?? '',
            alt: ui.contactBanner.image.alternativeText ?? ui.contactBanner.image.alt ?? '',
          }
          : null,
      }
      : null,
    trustSection: ui.trustSection
      ? {
        ...ui.trustSection,
        image: ui.trustSection.image
          ? {
            src: resolveUrl(ui.trustSection.image.url) ?? ui.trustSection.image.src ?? '',
            alt: ui.trustSection.image.alternativeText ?? ui.trustSection.image.alt ?? '',
          }
          : null,
      }
      : null,
    advantagesSection: ui.advantagesSection ?? null,
    brandSlider: ui.brandSlider
      ? {
        ...ui.brandSlider,
        brands: (ui.brandSlider.brands ?? []).map(b => ({
          name: b.name,
          img: resolveUrl(b.img?.url) ?? (typeof b.img === 'string' ? b.img : null),
        })),
      }
      : null,
  }
}

export async function getLegalPage(slug) {
  const params = [
    `filters[site][$eq]=${SITE_SLUG}`,
    `filters[slug][$eq]=${slug}`,
    `populate=*`,
  ].join('&')
  const data = await strapiGet(`legal-pages?${params}`)
  const page = data?.[0]
  if (!page) return null
  return {
    title: page.title,
    body: page.body,
    updatedAt: page.updatedAt,
    metaTitle: page.metaTitle ?? null,
    metaDescription: page.metaDescription ?? null,
    metaKeywords: page.metaKeywords ?? null,
    canonicalUrl: page.canonicalUrl ?? null,
    ogTitle: page.ogTitle ?? null,
    ogDescription: page.ogDescription ?? null,
    ogImage: page.ogImage?.url ? resolveUrl(page.ogImage.url) : null,
    jsonLd: page.jsonLd ?? null,
  }
}

export async function getRedirects() {
  const params = [
    `filters[site][$eq]=${SITE_SLUG}`,
    `filters[isActive][$eq]=true`,
    `fields[0]=source`,
    `fields[1]=destination`,
    `fields[2]=type`,
    `pagination[pageSize]=200`,
  ].join('&')
  const data = await strapiGet(`redirects?${params}`)
  return data ?? []
}

export async function getAnalyticContacts() {
  const data = await strapiGet(`analytic-contacts?filters[site][$eq]=${SITE_SLUG}&populate=*`)
  return data?.[0] ?? null
}

/**
 * Just the zona slugs, for the redirect middleware.
 *
 * getZonas() deep-populates every section of every zona — far too heavy to run
 * on a request that is only asking "does this zona exist?". Slugs are returned
 * both with and without the site prefix, because entries are stored either way
 * (`cantabria-laredo` and `laredo` both occur).
 */
export async function getZonaSlugs() {
  const params = [
    `filters[site][$eq]=${SITE_SLUG}`,
    `fields[0]=slug`,
    `pagination[pageSize]=100`,
  ].join('&')
  const data = await strapiGet(`zonas?${params}`)
  const out = new Set()
  for (const z of data ?? []) {
    const slug = String(z?.slug ?? '').toLowerCase()
    if (!slug) continue
    out.add(slug)
    out.add(slug.replace(`${SITE_SLUG}-`, ''))
  }
  return [...out]
}

export async function getZonas() {
  const params = [
    `filters[site][$eq]=${SITE_SLUG}`,
    `pagination[pageSize]=100`,
    `populate[hero][populate]=*`,
    `populate[servicesLists][populate][items]=*`,
    `populate[servicesLists][populate][image]=*`,
    `populate[faqSection][populate][faqs]=*`,
    `populate[brandSlider][populate][brands][populate][img]=*`,
    `populate[contactBanner][populate][image]=*`,
    `populate[advantagesSection][populate][advantages]=*`,
    `populate[serviceDescriptions]=*`,
    `populate[testimonials][populate][list][populate][avatar]=*`,
    `populate[servicesSection]=*`,
    `populate[whyChooseNew][populate][features]=*`,
    `populate[whyChooseNew][populate][button]=*`,
    `populate[whyChooseNew][populate][image]=*`,
    `populate[blogSection][populate][link]=*`,
    `populate[blogSection][populate][list]=*`,
    `populate[cta][populate][images]=*`,
    `populate[areasMapSection][populate][areas]=*`,
    `populate[ogImage]=*`,
  ].join('&')
  const data = await strapiGet(`zonas?${params}`)
  if (!data) return []

  return data.map(zona => ({
    slug: zona.slug,
    city: zona.city,
    // Empty = fall back to the site-wide main service city, see ZonasPageContent.
    serviceCitySlug: zona.serviceCitySlug ?? '',
    metaTitle: zona.metaTitle ?? null,
    metaDescription: zona.metaDescription ?? null,
    metaKeywords: zona.metaKeywords ?? null,
    canonicalUrl: zona.canonicalUrl ?? null,
    ogTitle: zona.ogTitle ?? null,
    ogDescription: zona.ogDescription ?? null,
    ogImage: zona.ogImage?.url
      ? { url: resolveUrl(zona.ogImage.url) }
      : null,
    hero: {
      title: zona.hero?.title,
      subtitle: zona.hero?.subtitle,
      stats: zona.hero?.stats ?? [],
      image: zona.hero?.image?.url
        ? `${STRAPI_URL}${zona.hero.image.url}`
        : null,
      altImage: zona.hero?.altImage ?? '',
      alternativeText: zona.hero?.image?.alternativeText ?? '',
      primaryButtonText: zona.hero?.primaryButtonText ?? null,
      primaryButtonUrl: zona.hero?.primaryButtonUrl ?? null,
    },
    servicesLists: (zona.servicesLists ?? []).map(list => ({
      category: list.category,
      image: list.image?.url ? `${STRAPI_URL}${list.image.url}` : null,
      altImage: list.altImage ?? '',
      alternativeText: list.image?.alternativeText ?? '',
      items: (list.items ?? []).map(item => item.text),
    })),
    jsonLd: zona.jsonLd ?? null,
    serviceDescriptions: Object.fromEntries(
      (zona.serviceDescriptions ?? []).map(d => [d.serviceName, d.description])
    ),
    testimonials: zona.testimonials
      ? {
        ...zona.testimonials,
        list: (zona.testimonials.list ?? []).map(t => ({
          ...t,
          avatar: resolveUrl(t.avatar?.url ?? t.avatar),
        })),
      }
      : null,
    servicesSection: zona.servicesSection ?? null,
    whyChooseNew: zona.whyChooseNew
      ? {
        ...zona.whyChooseNew,
        image: zona.whyChooseNew.image?.url
          ? `${STRAPI_URL}${zona.whyChooseNew.image.url}`
          : null,
        altImage: zona.whyChooseNew.altImage ?? '',
        alternativeText: zona.whyChooseNew.image?.alternativeText ?? '',
        features: (zona.whyChooseNew.features ?? []).map(f => ({
          icon: f.icon,
          title: f.title,
        })),
        button: zona.whyChooseNew.button ?? null,
      }
      : null,
    blogSection: zona.blogSection ?? null,
    cta: zona.cta ?? null,
    faqSection: zona.faqSection ?? null,
    contactBanner: zona.contactBanner
      ? {
        ...zona.contactBanner,
        altImage: zona.contactBanner.altImage ?? '',
        image: zona.contactBanner.image
          ? {
            src: resolveUrl(zona.contactBanner.image.url) ?? null,
            alt: zona.contactBanner.image.alternativeText ?? '',
          }
          : null,
      }
      : null,
    advantagesSection: zona.advantagesSection ?? null,
    brandSlider: zona.brandSlider
      ? {
        ...zona.brandSlider,
        brands: (zona.brandSlider.brands ?? []).map(b => ({
          name: b.name,
          altImage: b.altImage ?? '',
          img: resolveUrl(b.img?.url) ?? (typeof b.img === 'string' ? b.img : null),
        })),
      }
      : null,
    areasMapSection: zona.areasMapSection
      ? {
        subtitle: zona.areasMapSection.subtitle ?? null,
        title: zona.areasMapSection.title ?? null,
        areas: (zona.areasMapSection.areas ?? []).map(a => ({
          label: a.label,
          url: a.url,
        })),
        mapEmbedUrl: zona.areasMapSection.mapEmbedUrl ?? null,
      }
      : null,
  }))
}

function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url;
  return `${STRAPI_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function getBlogs() {
  const params = [
    `filters[site][$eq]=${SITE_SLUG}`,
    `sort[0]=publishedAt:desc`,
    `populate=*`,
  ].join('&')
  const data = await strapiGet(`blogs?${params}`)
  if (!data) return [];

  return data.map(post => {
    let coverImg = null;
    let coverImgWidth = null;
    let coverImgHeight = null;
    if (post.coverImg) {
      if (typeof post.coverImg === 'string') {
        coverImg = resolveUrl(post.coverImg);
      } else if (post.coverImg.url) {
        coverImg = resolveUrl(post.coverImg.url);
        coverImgWidth = post.coverImg.width || null;
        coverImgHeight = post.coverImg.height || null;
      }
    }

    // Resolve author avatar
    // Local asset default — no external avatar service (audit: external no-response)
    let authorAvatar = "/assets/logo.webp";
    if (post.authorAvatar) {
      if (typeof post.authorAvatar === 'string') {
        authorAvatar = resolveUrl(post.authorAvatar);
      } else if (post.authorAvatar.url) {
        authorAvatar = resolveUrl(post.authorAvatar.url);
      }
    }
    // Placeholder avatars stored in old CMS entries — drop so the UI falls
    // back to the generated initials avatar instead of a fake face.
    if (authorAvatar && authorAvatar.includes('pravatar.cc')) authorAvatar = '';

    // Map sections. Map id to sectionId if it exists
    const sections = (post.sections ?? []).map(sec => ({
      id: sec.sectionId || String(sec.id),
      heading: sec.heading,
      body: sec.body,
    }));

    // Map inline image
    let inlineImage = null;
    if (post.inlineImageAfterSection) {
      let inlineImgSrc = null;
      if (post.inlineImageFile) {
        if (typeof post.inlineImageFile === 'string') {
          inlineImgSrc = resolveUrl(post.inlineImageFile);
        } else if (post.inlineImageFile.url) {
          inlineImgSrc = resolveUrl(post.inlineImageFile.url);
        }
      }
      if (inlineImgSrc) {
        inlineImage = {
          afterSection: post.inlineImageAfterSection,
          src: inlineImgSrc,
          alt: post.inlineImageAlt || '',
        };
      }
    }

    const ogImageUrl = post.ogImage?.url ? resolveUrl(post.ogImage.url) : null

    return {
      id: post.id,
      slug: post.slug,
      date: post.date,
      readTime: post.readTime,
      category: post.category,
      authorName: post.authorName,
      authorRole: post.authorRole,
      authorAvatar,
      title: post.title,
      excerpt: post.excerpt,
      coverImg,
      coverImgWidth,
      coverImgHeight,
      content: post.content ?? [],
      tags: post.tags ?? null,
      sections,
      inlineImage,
      site: post.site,
      coverImgAlt: post.coverImgAlt,
      coverImgCaption: post.coverImgCaption,
      // Both the human string the card shows and a machine-readable form of it.
      // `dateISO` is what schema.org needs; `publishedAt`/`updatedAt` are the
      // CMS timestamps, kept as a last-resort fallback for ordering.
      dateISO: toIsoDate(post.date) ?? toIsoDate(post.publishedAt),
      publishedAt: post.publishedAt ?? null,
      updatedAt: post.updatedAt ?? null,
      jsonLd: post.jsonLd ?? null,
      metaTitle: post.metaTitle ?? null,
      metaDescription: post.metaDescription ?? null,
      metaKeywords: post.metaKeywords ?? null,
      canonicalUrl: post.canonicalUrl ?? null,
      ogTitle: post.ogTitle ?? null,
      ogDescription: post.ogDescription ?? null,
      ogImage: ogImageUrl,
    };
  })
  // Ordered by the date the post actually shows, descending.
  //
  // The Strapi query sorts on `publishedAt` — when the entry was published in
  // the CMS — which has nothing to do with the `date` field rendered on the
  // card. Posts were arriving Mar, Sep, Aug, Oct 2024: not wrong so much as
  // unordered, with the newest article buried. `date` is a free-text Spanish
  // string, so it cannot be sorted by the API and has to be parsed here.
  .sort((a, b) => {
    const diff = blogDateSortKey(b.date) - blogDateSortKey(a.date)
    if (diff) return diff
    // Same day, or both undated: fall back to the CMS timestamp so the order is
    // at least stable between requests rather than however Strapi returned them.
    return String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? ''))
  });
}

export { STRAPI_URL, SITE_SLUG }
