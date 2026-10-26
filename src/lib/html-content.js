// Prepares the HTML written in Strapi's CKEditor field (blog `contentHtml`) for
// rendering: sanitizes it (the editor output is trusted-ish, but it ends up in
// dangerouslySetInnerHTML on a public page), gives each heading a stable anchor
// id for the sticky TOC, and resolves relative image URLs against Strapi.
// Runs at build/SSR time inside getBlogs(), so no sanitizer ships to the browser.

import sanitizeHtml from 'sanitize-html'
import { slugifyHeading } from './blocks.jsx'
import { tiptapJsonToHtml } from './tiptap-json.js'

const SIZE_STYLE = [/^\d+(\.\d+)?(px|%|em|rem)$/]

const SANITIZE_OPTIONS = {
  allowedTags: [
    'h2', 'h3', 'h4', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
    'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    'figure', 'figcaption', 'img',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    p: ['style'],
    h2: ['style'],
    h3: ['style'],
    h4: ['style'],
    th: ['colspan', 'rowspan', 'style'],
    td: ['colspan', 'rowspan', 'style'],
    col: ['style'],
    table: ['style'],
    figure: ['class', 'style'],
  },
  allowedClasses: { figure: ['table', 'image', 'media'] },
  allowedStyles: {
    '*': { width: SIZE_STYLE, height: SIZE_STYLE },
    p: { 'text-align': [/^(left|right|center|justify)$/] },
    h2: { 'text-align': [/^(left|right|center|justify)$/] },
    h3: { 'text-align': [/^(left|right|center|justify)$/] },
    h4: { 'text-align': [/^(left|right|center|justify)$/] },
    th: { 'text-align': [/^(left|right|center|justify)$/] },
    td: { 'text-align': [/^(left|right|center|justify)$/] },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    // The page already renders the post title as <h1>.
    h1: 'h2',
  },
}

function stripTags(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

/**
 * @param {string} html raw CKEditor HTML
 * @param {(url: string) => string|null} resolveUrl turns /uploads/... into an absolute URL
 * @returns {{ html: string, headings: {id: string, heading: string}[] }}
 */
export function prepareHtmlContent(html, resolveUrl = u => u) {
  if (typeof html !== 'string' || !html.trim()) return { html: '', headings: [] }

  // The TipTap editor saves a JSON document; anything else is already HTML.
  html = tiptapJsonToHtml(html) ?? html

  const clean = sanitizeHtml(html, {
    ...SANITIZE_OPTIONS,
    transformTags: {
      ...SANITIZE_OPTIONS.transformTags,
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, src: resolveUrl(attribs.src) || attribs.src, loading: 'lazy' },
      }),
      a: (tagName, attribs) => ({
        tagName,
        attribs: /^https?:/i.test(attribs.href || '') ? { ...attribs, rel: 'noopener noreferrer' } : attribs,
      }),
    },
    // `loading` is added by the transform above, so it has to be allowed here.
    allowedAttributes: { ...SANITIZE_OPTIONS.allowedAttributes, img: ['src', 'alt', 'width', 'height', 'loading'] },
  })

  const seen = new Map()
  const headings = []
  const withIds = clean.replace(/<h([2-4])((?:\s[^>]*)?)>([\s\S]*?)<\/h\1>/g, (_m, level, attrs, inner) => {
    const text = stripTags(inner)
    const base = slugifyHeading(text)
    const n = (seen.get(base) ?? 0) + 1
    seen.set(base, n)
    const id = n === 1 ? base : `${base}-${n}`
    // Only h2 feeds the TOC, matching the Blocks path where every heading does
    // but authors use h2 for sections; h3/h4 still get anchors.
    if (level === '2') headings.push({ id, heading: text })
    return `<h${level} id="${id}"${attrs}>${inner}</h${level}>`
  })

  return { html: withIds, headings }
}
