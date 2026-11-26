'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export interface FitTitleProps {
  title: string
  className?: string
  as?: 'h3' | 'h2' | 'h4' | 'div' | 'span'
  titleTooltip?: string
}

/**
 * Shared auto-fitting title component for marquee and grid content cards.
 * - Base font: desktop 20px, tablet 18px, mobile 17px, line-height 1.3.
 * - Reserved height: exactly 3 lines (min-height: calc(3 * 1.3em)).
 * - Auto-fits extra-long titles step-by-step down to 15px until it fits in 3 lines.
 * - Clamps at 3 lines with ellipsis if still overflowing at 15px.
 * - Shows full title in tooltip (title attribute).
 * - No layout shift: measures synchronously in layoutEffect & attaches ResizeObserver.
 */
export const FitTitle: React.FC<FitTitleProps> = ({
  title,
  className = '',
  as: Component = 'h3',
  titleTooltip,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLElement>(null)
  const [fontSize, setFontSize] = useState<number | null>(null)
  const [isClamped, setIsClamped] = useState(false)

  const fitText = () => {
    const container = containerRef.current
    const textEl = textRef.current
    if (!container || !textEl) return

    const width = window.innerWidth
    const baseSize = width >= 1024 ? 20 : width >= 640 ? 18 : 17
    const lineHeightRatio = 1.3

    // Temporarily reset styles for accurate measurement
    textEl.style.display = 'block'
    textEl.style.webkitLineClamp = 'unset'
    textEl.style.webkitBoxOrient = 'unset'
    textEl.style.overflow = 'visible'

    let currentSize = baseSize
    textEl.style.fontSize = `${currentSize}px`
    textEl.style.lineHeight = `${lineHeightRatio}`

    // Max height budget for 3 lines at currentSize
    // Allow small 2px buffer for font metric rounding
    while (currentSize > 15) {
      const maxThreeLineHeight = currentSize * lineHeightRatio * 3 + 2.5
      if (textEl.scrollHeight <= maxThreeLineHeight) {
        break
      }
      currentSize -= 1
      textEl.style.fontSize = `${currentSize}px`
    }

    const finalMaxHeight = currentSize * lineHeightRatio * 3 + 2.5
    const stillOverflows = textEl.scrollHeight > finalMaxHeight

    if (stillOverflows) {
      textEl.style.display = '-webkit-box'
      textEl.style.webkitBoxOrient = 'vertical'
      textEl.style.webkitLineClamp = '3'
      textEl.style.overflow = 'hidden'
      setIsClamped(true)
    } else {
      textEl.style.display = 'block'
      textEl.style.webkitLineClamp = 'unset'
      textEl.style.webkitBoxOrient = 'unset'
      textEl.style.overflow = 'visible'
      setIsClamped(false)
    }

    setFontSize(currentSize)
  }

  useIsomorphicLayoutEffect(() => {
    fitText()
  }, [title])

  useEffect(() => {
    fitText()

    // Re-check after webfonts are finished loading
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => fitText())
    }

    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return

    const ro = new ResizeObserver(() => {
      fitText()
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [title])

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col justify-start w-full min-h-[calc(3*1.3em)] h-[calc(3*1.3em)] overflow-hidden"
      style={{
        lineHeight: 1.3,
      }}
    >
      <Component
        ref={textRef as any}
        title={titleTooltip || title}
        className={`break-words font-bold tracking-tight transition-colors ${className}`}
        style={{
          lineHeight: 1.3,
          fontSize: fontSize ? `${fontSize}px` : undefined,
          display: isClamped ? '-webkit-box' : undefined,
          WebkitBoxOrient: isClamped ? 'vertical' : undefined,
          WebkitLineClamp: isClamped ? 3 : undefined,
          overflow: isClamped ? 'hidden' : undefined,
        }}
      >
        {title}
      </Component>
    </div>
  )
}

export default FitTitle
