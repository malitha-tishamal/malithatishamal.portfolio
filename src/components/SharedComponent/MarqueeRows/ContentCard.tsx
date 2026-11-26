'use client'

import React, { memo } from 'react'
import {
  RelativeTimePill,
  type RelativeVerb,
} from '@/components/SharedComponent/RelativeTimePill'
import type { DateLike } from '@/utils/relativeTime'
import { FitTitle } from '@/components/SharedComponent/FitTitle'

/**
 * Shared fixed-size content card for marquee sections (projects, certifications,
 * portfolio, …). The height is fixed and every text block reserves its clamped
 * space, so footers always line up regardless of content.
 */

export interface ContentCardProps {
  /** Media area content (image, video, gallery…). Rendered inside a 16:10 frame. */
  media: React.ReactNode
  /** Top-left category pill, e.g. "FULL STACK WEB". */
  typeLabel?: string
  /** Real date the relative pill is computed from (updatedAt, issueDate, …). */
  relativeDate?: DateLike
  /** Noun used by the pill's aria label. */
  relativeVerb?: RelativeVerb
  /** Marks one of the six newest cards → blue "Latest · 3 days ago" pill. */
  latest?: boolean
  /** Corner that carries the pill (defaults to top-right). */
  latestPosition?: 'top-left' | 'top-right'
  /** Bottom-right chip, e.g. "+5 Photos". */
  photoChip?: string
  /** Category label rendered in a meta row above the title. */
  categoryLabel?: string
  /** Date text rendered next to the category (replaces the footer date). */
  metaDateLabel?: string
  title: string
  description?: string
  emptyDescription?: string
  /** Description clamp; capped at 3 so every card keeps the same height. */
  descriptionLines?: number
  tags?: string[]
  /** Upper bound on visible tags; the rest collapse into "+N". */
  tagsShown?: number
  dateLabel?: string
  visitHref?: string | null
  visitLabel?: string
  onOpen?: () => void
  openHint?: string
  /** Width override (the admin preview uses `w-full`). */
  widthClass?: string
  className?: string
}

const TAG_CHAR_BUDGET = 60
const TAG_HIDDEN_RESERVE = 5
const MAX_DESCRIPTION_LINES = 3

/** Fit tag chips into the two-row budget; the rest go to the "+N" chip. */
export function splitVisibleTags(
  tags: string[],
  tagsShown = 8,
  budget = TAG_CHAR_BUDGET
): { visible: string[]; hidden: string[] } {
  const visible: string[] = []
  let used = 0
  for (const tag of tags) {
    if (visible.length >= tagsShown) break
    const cost = tag.length + 2
    const reserve = visible.length + 1 < tags.length ? TAG_HIDDEN_RESERVE : 0
    if (visible.length > 0 && used + cost + reserve > budget) break
    visible.push(tag)
    used += cost
  }
  return { visible, hidden: tags.slice(visible.length) }
}

export const ContentCard: React.FC<ContentCardProps> = memo(function ContentCard({
  media,
  typeLabel,
  relativeDate,
  relativeVerb = 'updated',
  latest = false,
  latestPosition = 'top-right',
  photoChip,
  categoryLabel,
  metaDateLabel,
  title,
  description,
  emptyDescription = 'No description yet',
  descriptionLines = 3,
  tags = [],
  tagsShown = 8,
  dateLabel,
  visitHref,
  visitLabel = 'Visit Site',
  onOpen,
  openHint,
  widthClass = 'w-[85vw] sm:w-[320px] xl:w-[380px]',
  className = '',
}) {
  const text = (description || '').trim() || emptyDescription
  const interactive = typeof onOpen === 'function'
  const { visible, hidden } = splitVisibleTags(tags, tagsShown)
  const clampLines = Math.min(MAX_DESCRIPTION_LINES, Math.max(1, Math.round(descriptionLines)))

  return (
    <article
      data-content-card=''
      className={`group relative flex shrink-0 flex-col overflow-hidden rounded-3xl border border-border/70 bg-white p-4 shadow-xs transition-shadow duration-300 hover:shadow-2xl sm:p-5 dark:border-dark_border dark:bg-darklight ${widthClass} ${className}`}>
      {/* Stretched primary action: one real control per card, nested links and
          buttons sit above it instead of inside it. */}
      {interactive && (
        <button
          type='button'
          onClick={() => onOpen?.()}
          aria-label={openHint || `View details for ${title}`}
          className='absolute inset-0 z-10 cursor-pointer rounded-3xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-hidden'
        />
      )}

      {/* Media */}
      <div className='relative mb-3 aspect-[16/10] w-full shrink-0 overflow-hidden rounded-2xl border border-border/40 bg-gray-100 dark:border-dark_border/40 dark:bg-darkmode'>
        {media}

        {typeLabel && (
          <span className='absolute top-3 left-3 z-10 max-w-[48%] truncate rounded-xl bg-primary px-3 py-1 text-[11px] font-bold tracking-wide text-white uppercase shadow-md shadow-primary/30'>
            {typeLabel}
          </span>
        )}

        {relativeDate && (
          <RelativeTimePill
            date={relativeDate}
            latest={latest}
            verb={relativeVerb}
            className={`absolute top-2.5 ${latestPosition === 'top-left' ? 'left-2.5' : 'right-2.5'}`}
          />
        )}

        {photoChip && (
          <span className='absolute right-2.5 bottom-2.5 z-10 rounded-lg bg-black/70 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs'>
            {photoChip}
          </span>
        )}
      </div>

      {/* Meta row — category and "Updated:" stay on a single line */}
      {(categoryLabel || metaDateLabel) && (
        <div className='mb-1.5 flex min-h-[1.125rem] shrink-0 items-center justify-between gap-2'>
          {categoryLabel ? (
            <span className='truncate text-[11px] font-bold tracking-wider whitespace-nowrap text-primary uppercase dark:text-blue-400'>
              {categoryLabel}
            </span>
          ) : null}
          {metaDateLabel ? (
            <span className='shrink-0 text-[11px] font-medium whitespace-nowrap text-gray-500 dark:text-gray-400'>
              {metaDateLabel}
            </span>
          ) : null}
        </div>
      )}

      {/* Title — up to 3 lines, auto-fit, reserved 3-line height */}
      <div className='mb-2 min-h-[calc(3*1.3em)] h-[calc(3*1.3em)] shrink-0 text-[17px] sm:text-[18px] lg:text-[20px] leading-[1.3] font-bold text-midnight_text transition-colors group-hover:text-primary dark:text-white'>
        <FitTitle
          title={title}
          as='h3'
          className='text-midnight_text transition-colors group-hover:text-primary dark:text-white'
        />
      </div>

      {/* Description — three lines reserved so footers stay aligned */}
      <p
        title={text}
        style={{
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: clampLines,
          overflow: 'hidden',
        }}
        className='mb-2 min-h-[4.25rem] shrink-0 text-xs leading-relaxed font-normal break-words text-grey sm:text-sm dark:text-gray-300'>
        {text}
      </p>

      {/* Tags — exactly two rows reserved; the +N chip carries the rest */}
      <div
        aria-hidden={tags.length === 0 ? true : undefined}
        className='flex h-[50px] shrink-0 flex-wrap content-start gap-1.5 overflow-hidden'>
        {visible.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            title={tag}
            className='max-w-full truncate rounded-md border border-blue-200/50 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 sm:text-xs dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300'>
            {tag}
          </span>
        ))}
        {hidden.length > 0 && (
          <span
            title={hidden.join(' · ')}
            className='rounded-md border border-border/50 bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 sm:text-xs dark:border-dark_border dark:bg-darkmode dark:text-gray-300'>
            +{hidden.length}
          </span>
        )}
      </div>

      {/* Footer — pinned, one line, identical across cards */}
      <div className='relative z-20 mt-auto flex items-center justify-between gap-2 border-t border-border/40 pt-3 text-xs font-semibold dark:border-dark_border/40'>
        {dateLabel && !metaDateLabel ? (
          <span className='shrink-0 text-[11px] font-normal text-gray-500 dark:text-gray-400'>
            {dateLabel}
          </span>
        ) : null}

        <div className='ml-auto flex items-center gap-2'>
          {visitHref ? (
            <a
              href={visitHref}
              target='_blank'
              rel='noopener noreferrer'
              onClick={(event) => event.stopPropagation()}
              aria-label={`${visitLabel}: ${title}`}
              className='inline-flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-primary/25 bg-primary/10 px-3 text-[11px] font-bold text-blue-700 transition-colors hover:bg-blue-700 hover:text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-hidden sm:text-xs dark:bg-primary/15 dark:text-blue-300'>
              <span>{visitLabel}</span>
              <svg
                className='h-3.5 w-3.5 shrink-0'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                aria-hidden='true'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2.2'
                  d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                />
              </svg>
            </a>
          ) : null}

          <span className='flex min-h-[44px] items-center gap-1 font-bold text-primary'>
            <span>View Details</span>
            <svg
              className='h-3.5 w-3.5 transition-transform group-hover:translate-x-1'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              aria-hidden='true'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2.5'
                d='M14 5l7 7m0 0l-7 7m7-7H3'
              />
            </svg>
          </span>
        </div>
      </div>
    </article>
  )
})

export default ContentCard
