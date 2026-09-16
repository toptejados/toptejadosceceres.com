// Shared renderer for Strapi's "blocks" rich-text field (the WordPress-like
// WYSIWYG editor). Used by LegalContent.jsx (legal/privacy/cookies pages) and
// BlogContent.jsx (blog post `content`) so both stay in sync with whatever
// node shapes the Strapi Blocks editor produces.

import { optimizedImageUrl } from './site.js'

export function slugifyHeading(text) {
  const noDiacritics = String(text || '')
    .normalize('NFD')
    .split('')
    .filter(ch => { const c = ch.charCodeAt(0); return c < 0x0300 || c > 0x036f })
    .join('')
  return noDiacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'seccion'
}

const DEFAULT_CLASSES = {
  paragraph: 'text-[15px] text-slate-600 leading-relaxed mb-5',
  heading: 'font-semibold text-[#0E0C29] mt-10 mb-4',
  list: 'mb-5 pl-6 text-[15px] text-slate-600 leading-relaxed',
  listItem: 'mb-2',
  quote: 'border-l-4 border-brand-blue pl-4 italic text-slate-600 my-5',
  link: 'text-brand-blue underline hover:no-underline',
  image: 'mb-6',
}

// headingId(text, index) => anchor id string, and if given also sets the
// heading's font-size (callers rendering a TOC need this; legal pages don't
// pass it and get the plain Tailwind classes above).
export function renderBlocks(blocks, { classNames = {}, headingId, headingSize } = {}) {
  const cls = { ...DEFAULT_CLASSES, ...classNames }
  let headingIndex = 0
  return (blocks || []).map((block, i) => {
    if (block.type === 'paragraph') {
      const children = block.children ?? []
      if (children.length === 1 && children[0]?.type === undefined && !(children[0]?.text ?? '').trim()) return null
      return (
        <p key={i} className={cls.paragraph}>
          {children.map((c, j) => renderInline(c, j, cls))}
        </p>
      )
    }
    if (block.type === 'heading') {
      const Tag = `h${block.level ?? 2}`
      const text = (block.children ?? []).map(c => c.text ?? '').join('')
      const id = headingId ? headingId(text, headingIndex++) : undefined
      return (
        <Tag
          key={i}
          id={id}
          className={cls.heading}
          style={id ? { scrollMarginTop: 110, fontSize: headingSize } : undefined}
        >
          {(block.children ?? []).map((c, j) => renderInline(c, j, cls))}
        </Tag>
      )
    }
    if (block.type === 'list') {
      const Tag = block.format === 'ordered' ? 'ol' : 'ul'
      return (
        <Tag key={i} className={`${cls.list} ${block.format === 'ordered' ? 'list-decimal' : 'list-disc'}`}>
          {(block.children ?? []).map((item, j) => (
            <li key={j} className={cls.listItem}>
              {(item.children ?? []).map((c, k) => renderInline(c, k, cls))}
            </li>
          ))}
        </Tag>
      )
    }
    if (block.type === 'quote') {
      return (
        <blockquote key={i} className={cls.quote}>
          {(block.children ?? []).map((c, j) => renderInline(c, j, cls))}
        </blockquote>
      )
    }
    if (block.type === 'image' && block.image?.url) {
      const img = block.image
      return (
        <div key={i} className={cls.image}>
          <img
            src={optimizedImageUrl(img.url)}
            alt={img.alternativeText || ''}
            width={img.width || undefined}
            height={img.height || undefined}
            loading="lazy"
            style={{ width: '100%', height: 'auto', borderRadius: 12, display: 'block' }}
          />
          {img.caption && (
            <p className="text-[13px] text-slate-400 mt-2 text-center">{img.caption}</p>
          )}
        </div>
      )
    }
    return null
  })
}

function renderInline(node, key, cls) {
  if (node.type === 'link') {
    return (
      <a key={key} href={node.url} className={cls.link}>
        {(node.children ?? []).map((c, j) => renderInline(c, j, cls))}
      </a>
    )
  }
  let text = node.text ?? ''
  if (node.bold) text = <strong>{text}</strong>
  if (node.italic) text = <em>{text}</em>
  if (node.underline) text = <u>{text}</u>
  if (node.strikethrough) text = <s>{text}</s>
  return <span key={key}>{text}</span>
}

// Heading blocks only, in document order — the source for a blog TOC.
export function headingsOf(blocks) {
  return (blocks || [])
    .filter(b => b.type === 'heading')
    .map(b => (b.children ?? []).map(c => c.text ?? '').join(''))
}
