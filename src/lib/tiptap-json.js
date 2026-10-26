// Converts the TipTap document JSON saved by the Strapi TipTap editor plugin
// (blog `contentHtml`) into HTML. The output still goes through the sanitizer
// in html-content.js, so this only has to be structurally right, not safe.

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const align = (node) => {
  const a = node.attrs?.textAlign
  return a && a !== 'left' ? ` style="text-align:${esc(a)}"` : ''
}

function applyMarks(html, marks = []) {
  return marks.reduce((out, mark) => {
    switch (mark.type) {
      case 'bold': return `<strong>${out}</strong>`
      case 'italic': return `<em>${out}</em>`
      case 'underline': return `<u>${out}</u>`
      case 'strike': return `<s>${out}</s>`
      case 'code': return `<code>${out}</code>`
      case 'superscript': return `<sup>${out}</sup>`
      case 'subscript': return `<sub>${out}</sub>`
      case 'link': return `<a href="${esc(mark.attrs?.href)}">${out}</a>`
      default: return out // highlight / textStyle colours are dropped
    }
  }, html)
}

function children(node) {
  return (node.content ?? []).map(render).join('')
}

function cell(tag, node) {
  const span = (name) => (node.attrs?.[name] > 1 ? ` ${name}="${node.attrs[name]}"` : '')
  return `<${tag}${span('colspan')}${span('rowspan')}>${children(node)}</${tag}>`
}

function render(node) {
  switch (node.type) {
    case 'text': return applyMarks(esc(node.text), node.marks)
    case 'paragraph': return `<p${align(node)}>${children(node)}</p>`
    case 'heading': {
      const level = Math.min(Math.max(node.attrs?.level ?? 2, 2), 4) // h1 is the post title
      return `<h${level}${align(node)}>${children(node)}</h${level}>`
    }
    case 'bulletList': return `<ul>${children(node)}</ul>`
    case 'orderedList': return `<ol>${children(node)}</ol>`
    case 'listItem': return `<li>${children(node)}</li>`
    case 'blockquote': return `<blockquote>${children(node)}</blockquote>`
    case 'codeBlock': return `<pre><code>${children(node)}</code></pre>`
    case 'horizontalRule': return '<hr>'
    case 'hardBreak': return '<br>'
    case 'image':
      return node.attrs?.src
        ? `<img src="${esc(node.attrs.src)}" alt="${esc(node.attrs.alt)}">`
        : ''
    case 'table': return `<table><tbody>${children(node)}</tbody></table>`
    case 'tableRow': return `<tr>${children(node)}</tr>`
    case 'tableHeader': return cell('th', node)
    case 'tableCell': return cell('td', node)
    default: return children(node)
  }
}

/** Returns HTML, or null when `value` is not a TipTap document string. */
export function tiptapJsonToHtml(value) {
  if (typeof value !== 'string' || !value.trimStart().startsWith('{')) return null
  try {
    const doc = JSON.parse(value)
    if (doc?.type !== 'doc') return null
    return children(doc)
  } catch {
    return null
  }
}
