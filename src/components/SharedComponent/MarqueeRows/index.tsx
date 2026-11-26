'use client'

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { splitMarqueeRows } from './layout'
import { MARQUEE_LANE } from './lane'
import { toDateValue, type DateLike } from '@/utils/relativeTime'

/**
 * Two-row, always-moving marquee. The first half of the (date-sorted) items
 * scrolls left; the second half starts at the last card and scrolls right.
 * Duplicated tracks guarantee a seamless loop; cloning only ever happens
 * inside one row, so a card can never show up in both rows.
 *
 * The rows are laid out edge to edge with a white side lane that reserves room
 * for the blue arrow buttons: `--gutter` is clamp(56px, 7vw, 104px) from 768px
 * up (12px below), and each arrow is centred in that gutter. The track is
 * clipped inside the lane, so cards always fade out before they reach an arrow.
 */

export interface MarqueeItemContext {
  latest: boolean
  /** Position inside this row (used for eager-loading the first images). */
  index: number
  /** Which row this card belongs to. */
  rowIndex: number
}

export interface MarqueeRowsProps<T> {
  items: T[]
  renderCard: (item: T, ctx: MarqueeItemContext) => React.ReactNode
  getKey: (item: T) => string
  getUpdatedAt?: (item: T) => DateLike
  latestCount?: number
  /** Pixels per second. */
  speed?: number
  rowCount?: number
  minForTwoRows?: number
  loading?: boolean
  skeletonCount?: number
  /** Reserve the category/date meta row inside skeleton cards too. */
  metaRow?: boolean
  /** Section-specific skeleton card (same size as the real card). */
  renderSkeleton?: () => React.ReactNode
  emptyState?: React.ReactNode
  ariaLabel?: string
  previousLabel?: string
  nextLabel?: string
  /** Shorthand for the arrow labels: `posts` → "Previous posts", "Next posts". */
  labelPrefix?: string
  /** CSS length that overrides the shared `--gutter` for this section. */
  gutter?: string
  /** Section-level pause (Pause / Play control owned by the section). */
  externalPaused?: boolean
  /** Below `minForTwoRows`, render one static, manually scrollable row. */
  staticSingleRow?: boolean
  className?: string
}

/** 40px soft edge so cards fade out well before the arrow lane. */
const FADE_MASK =
  'linear-gradient(to right, transparent 0, black 40px, black calc(100% - 40px), transparent 100%)'

/** Keep a translate offset inside (-width, 0] so the loop never jumps. */
function wrapOffset(value: number, width: number): number {
  if (width <= 0) return value
  const wrapped = ((value % width) + width) % width
  return wrapped === 0 ? 0 : wrapped - width
}

const SkeletonCard: React.FC<{ metaRow?: boolean }> = ({ metaRow = false }) => (
  <div
    data-content-card=''
    className='flex w-[85vw] shrink-0 animate-pulse flex-col rounded-3xl border border-border/40 bg-gray-100 p-4 sm:w-[320px] sm:p-5 xl:w-[380px] dark:border-dark_border/40 dark:bg-darklight'>
    <div className='mb-3 aspect-[16/10] w-full shrink-0 rounded-2xl bg-gray-200 dark:bg-darkmode' />
    {metaRow && (
      <div className='mb-1.5 flex h-[1.125rem] shrink-0 items-center justify-between gap-2'>
        <div className='h-3 w-1/3 rounded-md bg-gray-200 dark:bg-darkmode' />
        <div className='h-3 w-1/4 rounded-md bg-gray-200 dark:bg-darkmode' />
      </div>
    )}
    <div className='mb-2 flex min-h-[calc(3*1.3em)] h-[calc(3*1.3em)] shrink-0 flex-col justify-center gap-2 text-[17px] sm:text-[18px] lg:text-[20px]'>
      <div className='h-4 w-3/4 rounded-md bg-gray-200 dark:bg-darkmode' />
      <div className='h-4 w-1/2 rounded-md bg-gray-200 dark:bg-darkmode' />
    </div>
    <div className='mb-2 flex min-h-[4.25rem] shrink-0 flex-col gap-2'>
      <div className='h-3 w-full rounded-md bg-gray-200 dark:bg-darkmode' />
      <div className='h-3 w-full rounded-md bg-gray-200 dark:bg-darkmode' />
      <div className='h-3 w-2/3 rounded-md bg-gray-200 dark:bg-darkmode' />
    </div>
    <div className='h-[50px] shrink-0' />
    <div className='mt-auto flex items-center justify-between border-t border-border/40 pt-3 dark:border-dark_border/40'>
      <div className='h-3 w-16 rounded-md bg-gray-200 dark:bg-darkmode' />
      <div className='h-11 w-28 rounded-xl bg-gray-200 dark:bg-darkmode' />
    </div>
  </div>
)

interface ArrowButtonProps {
  direction: 'prev' | 'next'
  label: string
  onClick: () => void
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
  ariaControls?: string
}

const ArrowButton: React.FC<ArrowButtonProps> = ({
  direction,
  label,
  onClick,
  disabled = false,
  className = '',
  style,
  ariaControls,
}) => (
  <button
    type='button'
    onClick={onClick}
    aria-label={label}
    aria-controls={ariaControls}
    disabled={disabled}
    style={style}
    className={`h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-[0_6px_16px_rgba(37,99,235,0.35)] transition-all duration-200 hover:enabled:scale-[1.06] hover:enabled:bg-[#1D4ED8] active:scale-[0.96] focus-visible:ring-[3px] focus-visible:ring-[#93C5FD] focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-40 dark:ring-2 dark:ring-white/30 ${className}`}>
    <svg
      className='h-[22px] w-[22px]'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      aria-hidden='true'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2.5'
        d={direction === 'prev' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
      />
    </svg>
  </button>
)

interface MarqueeRowProps<T> {
  items: T[]
  renderCard: (item: T, ctx: MarqueeItemContext) => React.ReactNode
  getKey: (item: T) => string
  latestIndices: number[]
  latestCount: number
  reverse: boolean
  speed: number
  reduced: boolean
  rowIndex: number
  rowId: string
  ariaLabel: string
  previousLabel: string
  nextLabel: string
  disabled: boolean
  gutter?: string
  externalPaused: boolean
  /** One-row fallback: no autoplay, no clones — only manual scrolling. */
  staticMode: boolean
}

function MarqueeRow<T>({
  items,
  renderCard,
  getKey,
  latestIndices,
  latestCount,
  reverse,
  speed,
  reduced,
  rowIndex,
  rowId,
  ariaLabel,
  previousLabel,
  nextLabel,
  disabled,
  gutter,
  externalPaused,
  staticMode,
}: MarqueeRowProps<T>) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const shiftRef = useRef<HTMLDivElement | null>(null)
  const copyRef = useRef<HTMLDivElement | null>(null)
  const cloneRef = useRef<HTMLDivElement | null>(null)

  /**
   * Autoplay is a compositor-only CSS animation (`mq-track`); JS never writes
   * a frame. `shift` is a static phase offset applied by an inner wrapper for
   * drag / wheel / arrow nudges, kept inside (-width, 0] so folding it can
   * never reveal the seam between the two copies.
   */
  const [copyWidth, setCopyWidth] = useState(0)
  const [shift, setShift] = useState(0)
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(true)
  const shiftValueRef = useRef(0)
  const widthRef = useRef(0)

  const engine = useRef({
    resumeTimer: undefined as number | undefined,
    dragging: false,
    dragStartX: 0,
    dragStartShift: 0,
    moved: false,
  })

  const direction = reverse ? 1 : -1
  // Reduced motion and the one-row fallback both mean "manual scrolling only".
  const motionOff = reduced || staticMode

  const makeContext = (index: number): MarqueeItemContext => {
    const latest = (latestIndices[index] ?? index) < latestCount
    return {
      latest,
      index,
      rowIndex,
    }
  }

  const applyShift = useCallback((next: number) => {
    shiftValueRef.current = next
    setShift(next)
  }, [])

  useEffect(() => {
    if (motionOff) return
    cloneRef.current?.setAttribute('inert', '')
  }, [motionOff, items.length])

  useEffect(() => {
    const element = viewportRef.current
    if (!element || motionOff) return

    // Seed from real geometry so a silent observer never leaves the row frozen.
    const rect = element.getBoundingClientRect()
    setInView(rect.top < window.innerHeight && rect.bottom > 0)

    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry) setInView(entry.isIntersecting)
      },
      { rootMargin: '0px 0px -10% 0px' }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [motionOff])

  useEffect(() => {
    const copy = copyRef.current
    if (!copy || motionOff) return

    const measure = () => {
      const width = copy.offsetWidth
      widthRef.current = width
      setCopyWidth(width)
      if (width > 0) applyShift(wrapOffset(shiftValueRef.current, width))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(copy)
    document.fonts?.ready.then(measure).catch(() => undefined)

    return () => observer.disconnect()
  }, [motionOff, applyShift, items.length])

  const clearResume = () => {
    if (engine.current.resumeTimer) {
      window.clearTimeout(engine.current.resumeTimer)
      engine.current.resumeTimer = undefined
    }
  }

  const pause = useCallback(() => {
    clearResume()
    setPaused(true)
  }, [])

  const scheduleResume = useCallback((delay = 1000) => {
    clearResume()
    engine.current.resumeTimer = window.setTimeout(() => {
      if (!engine.current.dragging) setPaused(false)
      engine.current.resumeTimer = undefined
    }, delay)
  }, [])

  const dragCleanupRef = useRef<(() => void) | null>(null)

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (motionOff) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const state = engine.current
    state.dragging = true
    state.dragStartX = event.clientX
    state.dragStartShift = shiftValueRef.current
    pause()

    const onMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - state.dragStartX
      if (Math.abs(dx) > 6) state.moved = true
      applyShift(wrapOffset(state.dragStartShift + dx, widthRef.current))
    }
    const onUp = () => {
      state.dragging = false
      dragCleanupRef.current?.()
      window.setTimeout(() => {
        state.moved = false
      }, 250)
      scheduleResume()
    }

    dragCleanupRef.current = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      dragCleanupRef.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  useEffect(() => () => dragCleanupRef.current?.(), [])

  const suppressClickIfDragged = (event: React.MouseEvent) => {
    if (engine.current.moved) {
      event.preventDefault()
      event.stopPropagation()
      engine.current.moved = false
    }
  }

  const cardStep = () => {
    const card = copyRef.current?.firstElementChild as HTMLElement | null
    return (card?.getBoundingClientRect().width || 380) + 24
  }

  /**
   * One-card arrow nudge. Runs on the Web Animations API so the travel is
   * compositor-driven; a wrap jump lands instantly because it is exactly one
   * copy wide and therefore invisible.
   */
  const nudge = useCallback(
    (forward: boolean) => {
      const step = cardStep()
      if (motionOff) {
        viewportRef.current?.scrollBy({
          left: forward ? step : -step,
          behavior: 'smooth',
        })
        return
      }
      // Row 2 travels the other way, so "next" follows each row's own direction.
      const from = shiftValueRef.current
      const to = wrapOffset(from + (forward ? direction : -direction) * step, widthRef.current)
      applyShift(to)
      const element = shiftRef.current
      if (
        element &&
        typeof element.animate === 'function' &&
        Math.abs(to - from) < widthRef.current / 2
      ) {
        element.animate(
          [
            { transform: `translate3d(${from}px, 0, 0)` },
            { transform: `translate3d(${to}px, 0, 0)` },
          ],
          { duration: 420, easing: 'cubic-bezier(.22,.61,.36,1)' }
        )
      }
      pause()
      scheduleResume(1000)
    },
    [applyShift, direction, motionOff, pause, scheduleResume]
  )

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (motionOff) return
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
    applyShift(wrapOffset(shiftValueRef.current - event.deltaX, widthRef.current))
    pause()
    scheduleResume(1000)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      nudge(false)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      nudge(true)
    }
  }

  return (
    <div className='relative' data-marquee-row={rowIndex}>
      <div
        className={`${MARQUEE_LANE} relative`}
        style={gutter ? ({ '--gutter': gutter } as React.CSSProperties) : undefined}>
        {/* Phones / small tablets: each row carries its own compact pair above it */}
        <div className='mb-3 flex items-center justify-end gap-3 min-[900px]:hidden'>
          <ArrowButton
            direction='prev'
            label={previousLabel}
            onClick={() => nudge(false)}
            disabled={disabled}
            ariaControls={rowId}
            className='flex'
          />
          <ArrowButton
            direction='next'
            label={nextLabel}
            onClick={() => nudge(true)}
            disabled={disabled}
            ariaControls={rowId}
            className='flex'
          />
        </div>

        <div
          id={rowId}
          ref={viewportRef}
          role='region'
          aria-label={ariaLabel}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onFocus={() => pause()}
          onBlur={() => scheduleResume()}
          onPointerEnter={(event) => {
            if (event.pointerType === 'mouse') pause()
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === 'mouse') scheduleResume()
          }}
          onPointerDown={startDrag}
          onWheel={handleWheel}
          onClickCapture={suppressClickIfDragged}
          className={`focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden ${
            motionOff ? 'overflow-x-auto pb-2' : 'overflow-clip'
          }`}
          style={{
            maskImage: FADE_MASK,
            WebkitMaskImage: FADE_MASK,
            touchAction: motionOff ? 'pan-x' : 'pan-y',
          }}>
          <div
            className={`flex w-max ${
              motionOff ? '' : `mq-track ${direction < 0 ? 'mq-forward' : 'mq-reverse'}`
            }`}
            style={
              motionOff
                ? undefined
                : ({
                    '--mq-w': `${copyWidth}px`,
                    '--mq-duration': copyWidth > 0 ? `${(copyWidth / speed).toFixed(2)}s` : '60s',
                    animationPlayState: paused || !inView || externalPaused ? 'paused' : 'running',
                  } as React.CSSProperties)
            }>
            <div
              ref={shiftRef}
              className='flex w-max'
              style={motionOff ? undefined : { transform: `translate3d(${shift.toFixed(2)}px,0,0)` }}>
              <div ref={copyRef} className='flex gap-6 pr-6'>
                {items.map((item, index) => (
                  <div
                    key={`${getKey(item)}-${index}`}
                    data-marquee-card=''
                    data-card-key={getKey(item)}>
                    {renderCard(item, makeContext(index))}
                  </div>
                ))}
              </div>
              {!motionOff && (
                <div ref={cloneRef} aria-hidden='true' inert={'' as any} className='flex gap-6 pr-6'>
                  {items.map((item, index) => (
                    <div
                      key={`clone-${getKey(item)}-${index}`}
                      data-marquee-card=''
                      data-card-key={getKey(item)}>
                      {renderCard(item, makeContext(index))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop: each row gets its own pair, centred in the shared gutter */}
        <ArrowButton
          direction='prev'
          label={previousLabel}
          onClick={() => nudge(false)}
          disabled={disabled}
          ariaControls={rowId}
          className='absolute top-1/2 z-30 hidden -translate-y-1/2 min-[900px]:flex'
          style={{ left: 'calc((var(--gutter) - 48px) / 2)' }}
        />
        <ArrowButton
          direction='next'
          label={nextLabel}
          onClick={() => nudge(true)}
          disabled={disabled}
          ariaControls={rowId}
          className='absolute top-1/2 z-30 hidden -translate-y-1/2 min-[900px]:flex'
          style={{ right: 'calc((var(--gutter) - 48px) / 2)' }}
        />
      </div>
    </div>
  )
}

export function MarqueeRows<T>({
  items,
  renderCard,
  getKey,
  getUpdatedAt,
  latestCount = 6,
  speed = 50,
  rowCount = 2,
  minForTwoRows = 6,
  loading = false,
  skeletonCount = 8,
  metaRow = false,
  renderSkeleton,
  emptyState,
  ariaLabel = 'Content carousel',
  previousLabel,
  nextLabel,
  labelPrefix,
  gutter,
  externalPaused = false,
  staticSingleRow = false,
  className = '',
}: MarqueeRowsProps<T>) {
  const [reduced, setReduced] = useState(false)
  const instanceId = useId().replace(/:/g, '')
  const previousText = previousLabel ?? (labelPrefix ? `Previous ${labelPrefix}` : 'Previous items')
  const nextText = nextLabel ?? (labelPrefix ? `Next ${labelPrefix}` : 'Next items')

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(query.matches)
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [])

  const ordered = useMemo(() => {
    if (!getUpdatedAt) return items
    return items
      .map((item, index) => ({ item, index, date: toDateValue(getUpdatedAt(item)) }))
      .sort((a, b) => {
        const aTime = a.date?.getTime() ?? 0
        const bTime = b.date?.getTime() ?? 0
        return bTime - aTime || a.index - b.index
      })
      .map((entry) => entry.item)
  }, [items, getUpdatedAt])

  const rows = useMemo(
    () => splitMarqueeRows(ordered, rowCount, minForTwoRows),
    [ordered, rowCount, minForTwoRows]
  )

  if (loading) {
    const skeletonRows = splitMarqueeRows(
      Array.from({ length: skeletonCount }, (_, index) => index),
      2,
      minForTwoRows
    )
    return (
      <div className={className} aria-busy='true' aria-label={`Loading ${ariaLabel}`}>
        <div className='space-y-6'>
          {skeletonRows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={`${MARQUEE_LANE} relative`}
              style={gutter ? ({ '--gutter': gutter } as React.CSSProperties) : undefined}>
              {/* Reserve each row's mobile control strip so cards do not jump */}
              <div className='mb-3 h-12 min-[900px]:hidden' aria-hidden='true' />
              <div
                className='flex gap-6 overflow-clip py-1'
                style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}>
                {row.map((key) =>
                  renderSkeleton ? (
                    <React.Fragment key={`${rowIndex}-${key}`}>{renderSkeleton()}</React.Fragment>
                  ) : (
                    <SkeletonCard key={`${rowIndex}-${key}`} metaRow={metaRow} />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className={className}>
        <div className={`mx-auto w-full max-w-[1280px] ${MARQUEE_LANE}`}>
          <div className='rounded-3xl border border-dashed border-border bg-gray-50 py-16 text-center dark:border-dark_border dark:bg-darklight'>
            {emptyState || (
              <p className='text-sm font-semibold text-gray-500 dark:text-gray-400'>
                Nothing to show yet.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  const multiRow = rows.length > 1
  const staticMode = staticSingleRow && !multiRow

  return (
    <div className={`relative ${className}`} role='group' aria-label={ariaLabel}>
      <div className='space-y-6'>
        {rows.map((row, rowIndex) => {
          const suffix = multiRow ? `, row ${rowIndex + 1}` : ''
          return (
            <MarqueeRow
              key={rowIndex}
              items={row}
              renderCard={renderCard}
              getKey={getKey}
              latestIndices={row.map((item) => ordered.indexOf(item))}
              latestCount={latestCount}
              reverse={rowIndex > 0}
              speed={speed}
              reduced={reduced}
              rowIndex={rowIndex}
              rowId={`${instanceId}-row-${rowIndex}`}
              ariaLabel={`${ariaLabel}${multiRow ? ` row ${rowIndex + 1}` : ''}`}
              previousLabel={`${previousText}${suffix}`}
              nextLabel={`${nextText}${suffix}`}
              disabled={row.length < 2}
              gutter={gutter}
              externalPaused={externalPaused}
              staticMode={staticMode}
            />
          )
        })}
      </div>
    </div>
  )
}

export default MarqueeRows
