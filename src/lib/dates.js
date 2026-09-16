// Blog dates arrive from Strapi as a human-written Spanish string — "5 de agosto
// de 2024" — in a plain text field, not a date field. Two things broke on that:
//
//   * schema.org `datePublished` was emitted with that literal string. It is not
//     ISO 8601, so the Article/BlogPosting markup fails validation and the post
//     is not eligible for any date-bearing rich result.
//   * the blog listing could not be sorted by it. The Strapi query sorts on
//     `publishedAt` (when the CMS entry was published) which has no relation to
//     the date shown on the card, so posts rendered in an order that looked
//     random: Mar 2024, Sep 2024, Aug 2024, Oct 2024.
//
// Parsing is done here, once, so both the schema and the ordering read the same
// value. Anything unparseable returns null and the caller falls back rather than
// inventing a date.

const MONTHS = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9,
  noviembre: 10, diciembre: 11,
}

// "5 de agosto de 2024", "05 de Agosto de 2024", "1 de setiembre de 2023".
const ES_LONG = /^(\d{1,2})\s+de\s+([a-zá-úñ]+)\s+de\s+(\d{4})$/i

/**
 * Parse a Strapi blog date into a Date, accepting both the Spanish long form and
 * anything Date already understands (ISO strings, in case the field is ever
 * migrated to a real date type).
 *
 * @returns {Date|null}
 */
export function parseBlogDate(value) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const raw = String(value).trim()
  if (!raw) return null

  const m = raw.toLowerCase().match(ES_LONG)
  if (m) {
    const day = Number(m[1])
    const month = MONTHS[m[2]]
    const year = Number(m[3])
    if (month !== undefined && day >= 1 && day <= 31) {
      // UTC noon, not midnight: a midnight timestamp shifts to the previous day
      // in any negative-offset timezone, which would silently backdate posts.
      const d = new Date(Date.UTC(year, month, day, 12, 0, 0))
      // Rejects impossible dates that Date would otherwise roll over
      // (31 de febrero -> 2 March).
      if (d.getUTCMonth() === month && d.getUTCDate() === day) return d
    }
    return null
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * ISO 8601 date (YYYY-MM-DD) for schema.org, or null when the input cannot be
 * parsed. Date-only on purpose: the CMS never captured a time, and inventing
 * one would be asserting precision that does not exist.
 */
export function toIsoDate(value) {
  const d = parseBlogDate(value)
  return d ? d.toISOString().slice(0, 10) : null
}

/**
 * Sort key: milliseconds since epoch, or -Infinity when undated so those posts
 * sort last instead of jumping to the top.
 */
export function blogDateSortKey(value) {
  const d = parseBlogDate(value)
  return d ? d.getTime() : -Infinity
}
