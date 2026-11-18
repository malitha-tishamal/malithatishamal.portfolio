/**
 * One formatter for every certificate date.
 *
 * The CMS stores dates as text, so each value is parsed back into a real Date
 * before it is shown. Month names are only ever produced by Intl.DateTimeFormat
 * (never typed by hand), so a misspelled month in the source data — e.g.
 * "Sepeember 2026" — still renders as "September 2026".
 */
import { toDateValue, type DateLike } from './relativeTime'

export type CertificateDatePrecision = 'day' | 'month' | 'year'

export interface ParsedCertificateDate {
  date: Date
  precision: CertificateDatePrecision
}

/** Long English month names, generated so nothing is hand-written. */
const MONTH_LONG = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2021, month, 1))
)

const monthYearFormat = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' })
const fullDateFormat = new Intl.DateTimeFormat('en', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

const NO_EXPIRY = /^(no\s*expiration|never|none|lifetime|n\/?a|—|–|-)$/i

/**
 * Resolve a month token by longest common prefix ("sep", "sept", "Sepeember" →
 * September). Requires at least three matching letters and a unique winner, so
 * "jun"/"jul" and "mar"/"may" stay unambiguous.
 */
function matchMonth(token: string): number | null {
  const clean = token.toLowerCase().replace(/[^a-z]/g, '')
  if (clean.length < 3) return null

  let best = -1
  let bestScore = 0
  let tied = false

  MONTH_LONG.forEach((name, index) => {
    const lower = name.toLowerCase()
    let score = 0
    while (score < clean.length && score < lower.length && clean[score] === lower[score]) {
      score += 1
    }
    if (score > bestScore) {
      bestScore = score
      best = index
      tied = false
    } else if (score === bestScore && score > 0) {
      tied = true
    }
  })

  return bestScore >= 3 && !tied ? best : null
}

function buildDate(year: number, monthIndex: number, day: number): Date | null {
  if (year < 1900 || year > 2200) return null
  if (monthIndex < 0 || monthIndex > 11) return null
  if (day < 1 || day > 31) return null
  const date = new Date(year, monthIndex, day)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Parse ISO strings, epoch numbers, Firestore timestamps and "Mar 2026" text. */
export function parseCertificateDate(value: DateLike): ParsedCertificateDate | null {
  if (value === null || value === undefined) return null

  if (value instanceof Date || typeof value === 'number' || typeof value === 'object') {
    const date = toDateValue(value)
    return date ? { date, precision: 'day' } : null
  }

  const text = value.trim()
  if (!text) return null

  const iso = text.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/)
  if (iso) {
    const date = buildDate(Number(iso[1]), Number(iso[2]) - 1, iso[3] ? Number(iso[3]) : 1)
    if (date) return { date, precision: iso[3] ? 'day' : 'month' }
  }

  const yearOnly = text.match(/^(\d{4})$/)
  if (yearOnly) {
    const date = buildDate(Number(yearOnly[1]), 0, 1)
    if (date) return { date, precision: 'year' }
  }

  const numericMonth = text.match(/^(\d{1,2})\s*[/.-]\s*(\d{4})$/)
  if (numericMonth) {
    const date = buildDate(Number(numericMonth[2]), Number(numericMonth[1]) - 1, 1)
    if (date) return { date, precision: 'month' }
  }

  const monthYear = text.match(/^([A-Za-z][A-Za-z.]*)[\s,./-]*(\d{4})$/)
  if (monthYear) {
    const month = matchMonth(monthYear[1])
    if (month !== null) {
      const date = buildDate(Number(monthYear[2]), month, 1)
      if (date) return { date, precision: 'month' }
    }
  }

  const monthDayYear = text.match(/^([A-Za-z][A-Za-z.]*)[\s,./-]*(\d{1,2})(?:st|nd|rd|th)?[\s,./-]*(\d{4})$/)
  if (monthDayYear) {
    const month = matchMonth(monthDayYear[1])
    if (month !== null) {
      const date = buildDate(Number(monthDayYear[3]), month, Number(monthDayYear[2]))
      if (date) return { date, precision: 'day' }
    }
  }

  const dayMonthYear = text.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s,./-]*([A-Za-z][A-Za-z.]*)[\s,./-]*(\d{4})$/)
  if (dayMonthYear) {
    const month = matchMonth(dayMonthYear[2])
    if (month !== null) {
      const date = buildDate(Number(dayMonthYear[3]), month, Number(dayMonthYear[1]))
      if (date) return { date, precision: 'day' }
    }
  }

  // ISO date-time strings only; anything looser would let junk like "Mid 2026"
  // be read as January 1st.
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    const fallback = new Date(text)
    if (!Number.isNaN(fallback.getTime())) return { date: fallback, precision: 'day' }
  }

  return null
}

/** "September 2026", "September 11, 2023" or "2026", formatted with Intl. */
export function formatCertificateDate(value: DateLike, fallback = ''): string {
  const parsed = parseCertificateDate(value)
  if (!parsed) return typeof value === 'string' ? value.trim() : fallback
  if (parsed.precision === 'year') return String(parsed.date.getFullYear())
  if (parsed.precision === 'month') return monthYearFormat.format(parsed.date)
  return fullDateFormat.format(parsed.date)
}

/** "No Expiration" for empty/lifetime values, otherwise a formatted date. */
export function formatCertificateExpiry(value?: string | null): string {
  const text = (value || '').trim()
  if (!text || NO_EXPIRY.test(text)) return 'No Expiration'
  return formatCertificateDate(text)
}

interface CertificateDateSource {
  issueDate?: string | null
  createdAt?: DateLike
  updatedAt?: DateLike
}

/** Issue date as a real Date, falling back to the record's created date. */
export function getCertificateIssueDate(item: CertificateDateSource): Date | null {
  return parseCertificateDate(item.issueDate)?.date ?? toDateValue(item.createdAt ?? item.updatedAt)
}
