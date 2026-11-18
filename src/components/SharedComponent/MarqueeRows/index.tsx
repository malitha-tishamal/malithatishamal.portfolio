'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { splitMarqueeRows } from './layout'
import { formatRelativeTime, toDateValue, type DateLike } from '@/utils/relativeTime'

/**
 * Two-row, always-moving marquee. The first half of the (date-sorted) items
 * scrolls left; the second half starts at the last card and scrolls right.
 * Duplicated tracks guarantee a seamless loop; cloning only ever happens
 * inside one row, so a card can never show up in both rows.
 */

export interface MarqueeItemContext {
  latest: boolean
  latestLabel?: string
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
  emptyState?: React.ReactNode
  ariaLabel?: string
  className?: string
}

const FADE_MASK =
  'linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)'

/** Keep a translate offset inside (-width, 0] so the loop never jumps. */
function wrapOffset(value: number, width: number): number {
  if (width <= 0) return value
  const wrapped = ((value % width) + width) % width
  return wrapped === 0 ? 0 : wrapped - width
}

const SkeletonCard: React.FC = () => (
  <div
    data-content-card=''
    className='flex h-[520px] w-[85vw] shrink-0 animate-pulse flex-col rounded-3xl border border-border/40 bg-gray-100 p-4 sm:w-[320px] sm:p-5 xl:w-[380px] dark:border-dark_border/40 dark:bg-darklight'>
    <div className='mb-3 aspect-[16/10] w-full shrink-0 rounded-2xl bg-gray-200 dark:bg-darkmode' />
    <div className='h-5 w-3/4 rounded-md bg-gray-200 dark:bg-darkmode' />
    <div className='mt-2 h-5 w-1/2 rounded-md bg-gray-200 dark:bg-darkmode' />
    <div className='mt-4 space-y-2'>
      <div className='h-3 w-full rounded-md bg-gray-200 dark:bg-darkmode' />
      <div className='h-3 w-full rounded-md bg-gray-200 dark:bg-darkmode' />
      <div className='h-3 w-2/3 rounded-md bg-gray-200 dark:bg-darkmode' />
    </div>
    <div className='mt-auto flex items-center justify-between border-t border-border/40 pt-3 dark:border-dark_border/40'>
      <div className='h-3 w-16 rounded-md bg-gray-200 dark:bg-darkmode' />
      <div className='h-8 w-24 rounded-xl bg-gray-200 dark:bg-darkmode' />
    </div>
  </div>
)

interface MarqueeRowProps<T> {
  items: T[]
  renderCard: (item: T, ctx: MarqueeItemContext) => React.ReactNode
  getKey: (item: T) => string
  latestIndices: number[]
  latestCount: number
  dates: (Date | null)[]
  reverse: boolean
  speed: number
  reduced: boolean
  rowIndex: number
  ariaLabel: string
}

function MarqueeRow<T>({
  items,
  renderCard,
  getKey,
  latestIndices,
  latestCount,
  dates,
  reverse,
  speed,
  reduced,
  rowIndex,
  ariaLabel,
}: MarqueeRowProps<T>) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const copyRef = useRef<HTMLDivElement | null>(null)
  const cloneRef = useRef<HTMLDivElement | null>(null)

  const engine = useRef({
    offset: 0,
    width: 0,
    paused: false,
    dragging: false,
    hidden: false,
    target: null as number | null,
    resumeTimer: undefined as number | undefined,
    dragStartX: 0,
    dragStartOffset: 0,
    moved: false,
  })

  const direction = reverse ? 1 : -1

  const makeContext = (index: number): MarqueeItemContext => {
    const latest = (latestIndices[index] ?? index) < latestCount
    const date = dates[index]
    return {
      latest,
      latestLabel: latest && date ? formatRelativeTime(date) : undefined,
    }
  }

  useEffect(() => {
    if (reduced) return
    cloneRef.current?.setAttribute('inert', '')
  }, [reduced, items.length])

  useEffect(() => {
    const onVisibility = () => {
      engine.current.hidden = document.hidden
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    const copy = copyRef.current
    if (!track || !copy) return

    if (reduced) {
      track.style.transform = ''
      return
    }

    const state = engine.current
    let frame = 0
    let last = 0

    const measure = () => {
      state.width = copy.offsetWidth
      if (state.width <= 0) return
      state.offset = wrapOffset(state.offset, state.width)
    }

    measure()
    state.offset = direction < 0 ? 0 : -state.width
    track.style.transform = `translate3d(${state.offset}px,0,0)`

    const tick = (now: number) => {
      const delta = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      const width = state.width

      if (width > 0 && !state.hidden) {
        if (state.target !== null) {
          const remaining = state.target - state.offset
          const step = Math.sign(remaining) * 1600 * delta
          if (Math.abs(remaining) <= Math.abs(step)) {
            state.offset = state.target
            state.target = null
          } else {
            state.offset += step
          }
        } else if (!state.paused && !state.dragging) {
          state.offset += direction * speed * delta
        }

        state.offset = wrapOffset(state.offset, width)
        track.style.transform = `translate3d(${state.offset.toFixed(2)}px,0,0)`
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    const observer = new ResizeObserver(measure)
    observer.observe(copy)
    document.fonts?.ready.then(measure).catch(() => undefined)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [reduced, speed, direction, items.length])

  const clearResume = () => {
    if (engine.current.resumeTimer) {
      window.clearTimeout(engine.current.resumeTimer)
      engine.current.resumeTimer = undefined
    }
  }

  const pause = useCallback(() => {
    clearResume()
    engine.current.paused = true
  }, [])

  const scheduleResume = useCallback((delay = 1000) => {
    clearResume()
    engine.current.resumeTimer = window.setTimeout(() => {
      if (!engine.current.dragging) engine.current.paused = false
      engine.current.resumeTimer = undefined
    }, delay)
  }, [])

  const dragCleanupRef = useRef<(() => void) | null>(null)

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const state = engine.current
    state.dragging = true
    state.dragStartX = event.clientX
    state.dragStartOffset = state.offset
    pause()

    const onMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - state.dragStartX
      if (Math.abs(dx) > 6) state.moved = true
      state.offset = state.dragStartOffset + dx
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

  const nudge = (arrowDirection: -1 | 1) => {
    const state = engine.current
    if (reduced) {
      viewportRef.current?.scrollBy({
        left: arrowDirection * cardStep(),
        behavior: 'smooth',
      })
      return
    }
    let target = (state.target ?? state.offset) + arrowDirection * cardStep()
    if (state.width > 0) target = wrapOffset(target, state.width)
    state.target = target
    pause()
    scheduleResume(1200)
  }

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (reduced) return
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
    engine.current.offset -= event.deltaX
    pause()
    scheduleResume(1200)
  }

  return (
    <div className='relative' data-marquee-row={rowIndex}>
      <div
        ref={viewportRef}
        role='region'
        aria-label={ariaLabel}
        tabIndex={0}
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
          reduced ? 'overflow-x-auto pb-2' : 'overflow-hidden'
        }`}
        style={{
          maskImage: FADE_MASK,
          WebkitMaskImage: FADE_MASK,
          touchAction: reduced ? 'pan-x' : 'pan-y',
        }}>
        <div
          ref={trackRef}
          className='flex w-max will-change-transform'
          style={reduced ? undefined : { transform: 'translate3d(0,0,0)' }}>
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
          {!reduced && (
            <div ref={cloneRef} aria-hidden='true' className='flex gap-6 pr-6'>
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

      {!reduced && (
        <>
          <button
            type='button'
            onClick={() => nudge(-1)}
            aria-label={`Scroll ${ariaLabel} left`}
            className='absolute top-1/2 left-1 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-white/90 text-lg text-midnight_text shadow-lg backdrop-blur-xs transition hover:bg-white sm:flex dark:border-dark_border dark:bg-darklight/90 dark:text-white'>
            ‹
          </button>
          <button
            type='button'
            onClick={() => nudge(1)}
            aria-label={`Scroll ${ariaLabel} right`}
            className='absolute top-1/2 right-1 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-white/90 text-lg text-midnight_text shadow-lg backdrop-blur-xs transition hover:bg-white sm:flex dark:border-dark_border dark:bg-darklight/90 dark:text-white'>
            ›
          </button>
        </>
      )}
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
  emptyState,
  ariaLabel = 'Content carousel',
  className = '',
}: MarqueeRowsProps<T>) {
  const [reduced, setReduced] = useState(false)

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

  const dates = useMemo(
    () => ordered.map((item) => (getUpdatedAt ? toDateValue(getUpdatedAt(item)) : null)),
    [ordered, getUpdatedAt]
  )

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
      <div
        className={`space-y-6 ${className}`}
        aria-busy='true'
        aria-label={`Loading ${ariaLabel}`}>
        {skeletonRows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className='flex gap-6 overflow-hidden px-1 py-1'
            style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}>
            {row.map((key) => (
              <SkeletonCard key={`${rowIndex}-${key}`} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div
        className={`rounded-3xl border border-dashed border-border bg-gray-50 py-16 text-center dark:border-dark_border dark:bg-darklight ${className}`}>
        {emptyState || (
          <p className='text-sm font-semibold text-gray-500 dark:text-gray-400'>
            Nothing to show yet.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`} aria-label={ariaLabel}>
      {rows.map((row, rowIndex) => (
        <MarqueeRow
          key={rowIndex}
          items={row}
          renderCard={renderCard}
          getKey={getKey}
          latestIndices={row.map((item) => ordered.indexOf(item))}
          latestCount={latestCount}
          dates={row.map((item) => dates[ordered.indexOf(item)] ?? null)}
          reverse={rowIndex > 0}
          speed={speed}
          reduced={reduced}
          rowIndex={rowIndex}
          ariaLabel={`${ariaLabel} row ${rowIndex + 1}`}
        />
      ))}
    </div>
  )
}

export default MarqueeRows
