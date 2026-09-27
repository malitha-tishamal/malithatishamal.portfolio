'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { PortfolioItem, isVideoUrl } from '@/types/portfolio'
import { getImgPath } from '@/utils/image'

interface PortfolioCardItemProps {
  item: PortfolioItem
  index?: number
  isStaggered?: boolean
  onClick?: () => void
}

export const PortfolioCardItem: React.FC<PortfolioCardItemProps> = ({
  item,
  index = 0,
  isStaggered = true,
  onClick,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const images = item.images || []
  const layout =
    item.imageLayout ||
    (images.length >= 4 ? 'grid_4' : images.length >= 2 ? 'split_horizontal_2' : 'single')
  const fit = item.imageFit || 'cover'

  // Detect video media
  const isVideo =
    item.mediaType === 'video' ||
    !!item.videoUrl ||
    (images.length > 0 && isVideoUrl(images[0]))

  const videoSrc = item.videoUrl || (images.find((img) => isVideoUrl(img)) || '')
  const videoThumb =
    item.videoThumbnail || (!isVideoUrl(images[0]) ? images[0] : '')
  const playbackMode = item.videoPlaybackMode || 'autoplay_loop'

  // Image object-fit class
  const imgFitClass =
    fit === 'contain'
      ? 'object-contain p-1 bg-gray-50/50 dark:bg-black/20'
      : 'object-cover object-top'

  // Card Aspect Ratio
  const cardAspectClass =
    fit === 'portrait_tall'
      ? 'aspect-[3/4]'
      : fit === 'contain'
      ? 'aspect-[4/4]'
      : 'aspect-[4/3.5]'

  // Format date helper
  const formatDate = (val: any): string => {
    if (!val) return 'Recently'
    if (typeof val === 'string') return val
    if (val?.toDate) {
      return val.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    }
    return 'Recently'
  }

  // Strip rich HTML for clean card text preview
  const plainDesc = (item.description || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const handleMouseEnter = () => {
    if (isVideo && playbackMode === 'hover_play' && videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }

  const handleMouseLeave = () => {
    if (isVideo && playbackMode === 'hover_play' && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`w-full group cursor-pointer flex flex-col justify-between bg-white dark:bg-darklight p-4 rounded-3xl border border-border/60 dark:border-dark_border/60 shadow-xs hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 ${
        isStaggered && index % 2 !== 0 ? 'lg:mt-12 md:mt-8' : ''
      }`}>
      <div>
        {/* CARD MEDIA FRAME */}
        <div
          className={`relative w-full ${cardAspectClass} rounded-2xl overflow-hidden bg-gray-100 dark:bg-darkmode shadow-xs group-hover:shadow-lg transition-all duration-500 border border-border/40 dark:border-dark_border/40`}>
          {isVideo && videoSrc ? (
            /* ── VIDEO MEDIA DISPLAY ───────────────────────── */
            <div className='relative w-full h-full overflow-hidden bg-black flex items-center justify-center'>
              {playbackMode === 'thumbnail_only' && videoThumb ? (
                <div className='relative w-full h-full'>
                  <Image
                    src={getImgPath(videoThumb)}
                    alt={item.title}
                    fill
                    unoptimized
                    className='object-cover'
                  />
                  {/* Play badge overlay */}
                  <div className='absolute inset-0 bg-black/30 flex items-center justify-center'>
                    <div className='w-12 h-12 rounded-full bg-white/90 dark:bg-darklight/90 shadow-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform'>
                      <svg className='w-5 h-5 ml-0.5' fill='currentColor' viewBox='0 0 24 24'>
                        <path d='M8 5v14l11-7z' />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  src={getImgPath(videoSrc)}
                  poster={videoThumb ? getImgPath(videoThumb) : undefined}
                  autoPlay={playbackMode === 'autoplay_loop'}
                  muted
                  loop
                  playsInline
                  preload='metadata'
                  className='w-full h-full object-cover'
                />
              )}

              {/* Video Badge */}
              <div className='absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 border border-white/20 z-10'>
                <svg className='w-2.5 h-2.5 text-red-500 fill-current' viewBox='0 0 24 24'>
                  <path d='M8 5v14l11-7z' />
                </svg>
                <span>VIDEO</span>
              </div>
            </div>
          ) : images.length === 0 ? (
            <div className='w-full h-full flex items-center justify-center text-xs text-gray-400'>
              No Media
            </div>
          ) : layout === 'split_vertical_2' && images.length >= 2 ? (
            /* OPTION 2B: 2 Images Side-by-Side (Left & Right columns) */
            <div className='grid grid-cols-2 w-full h-full gap-0.5 bg-border/40 dark:bg-dark_border/60'>
              <div className='relative w-full h-full overflow-hidden'>
                <Image
                  src={getImgPath(images[0])}
                  alt={item.altText ? `${item.altText} - Part 1` : `${item.title} (Left) – Showcase by Malitha Tishamal`}
                  fill
                  unoptimized
                  className={`${imgFitClass} group-hover:scale-105 transition-transform duration-500`}
                />
              </div>
              <div className='relative w-full h-full overflow-hidden'>
                <Image
                  src={getImgPath(images[1])}
                  alt={item.altText ? `${item.altText} - Part 2` : `${item.title} (Right) – Showcase by Malitha Tishamal`}
                  fill
                  unoptimized
                  className={`${imgFitClass} group-hover:scale-105 transition-transform duration-500`}
                />
              </div>
            </div>
          ) : layout === 'split_horizontal_2' && images.length >= 2 ? (
            /* OPTION 2A: 2 Images Stacked (Top Half & Bottom Half) */
            <div className='grid grid-rows-2 w-full h-full gap-0.5 bg-border/40 dark:bg-dark_border/60'>
              <div className='relative w-full h-full overflow-hidden'>
                <Image
                  src={getImgPath(images[0])}
                  alt={item.altText ? `${item.altText} - Part 1` : `${item.title} – Showcase by Malitha Tishamal`}
                  fill
                  unoptimized
                  className={`${imgFitClass} group-hover:scale-105 transition-transform duration-500`}
                />
              </div>
              <div className='relative w-full h-full overflow-hidden'>
                <Image
                  src={getImgPath(images[1])}
                  alt={item.altText ? `${item.altText} - Part 2` : `${item.title} – Showcase by Malitha Tishamal`}
                  fill
                  unoptimized
                  className={`${imgFitClass} group-hover:scale-105 transition-transform duration-500`}
                />
              </div>
            </div>
          ) : layout === 'grid_4' && images.length >= 3 ? (
            /* OPTION 3: 4 Images (2x2 Quadrants / Cross Split) */
            <div className='grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5 bg-border/40 dark:bg-dark_border/60'>
              {images.slice(0, 4).map((img, i) => (
                <div key={i} className='relative w-full h-full overflow-hidden'>
                  <Image
                    src={getImgPath(img)}
                    alt={item.altText ? `${item.altText} - Photo ${i + 1}` : `${item.title} (Photo ${i + 1}) by Malitha Tishamal`}
                    fill
                    unoptimized
                    className={`${imgFitClass} group-hover:scale-105 transition-transform duration-500`}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* OPTION 1: 1 Single Image occupying full card */
            <div className='relative w-full h-full overflow-hidden'>
              <Image
                src={getImgPath(images[0])}
                alt={item.altText || `${item.title} – Portfolio Showcase by Malitha Tishamal`}
                fill
                unoptimized
                className={`${imgFitClass} group-hover:scale-105 transition-transform duration-500`}
              />
            </div>
          )}
        </div>

        {/* Category Pill & Date */}
        <div className='flex items-center justify-between gap-2 mt-4 mb-1.5'>
          <span className='text-[11px] font-bold text-primary dark:text-blue-400 uppercase tracking-wider line-clamp-1'>
            {item.subtitle || 'Events'}
          </span>
          <span className='text-[10px] font-medium text-gray-400 dark:text-gray-500 shrink-0'>
            Updated: {formatDate(item.updatedAt || item.createdAt)}
          </span>
        </div>

        {/* Title — Full title visible with slightly reduced font size */}
        <h4 className='group-hover:text-primary text-[15px] sm:text-[16px] font-bold text-midnight_text dark:text-white transition-colors leading-snug line-clamp-2 min-h-[2.5rem] flex items-center'>
          {item.title}
        </h4>

        {/* Description — more lines shown, rich HTML stripped */}
        {plainDesc && (
          <p className='text-xs sm:text-[13px] text-grey dark:text-gray-300 font-normal mt-1.5 line-clamp-3 leading-relaxed'>
            {plainDesc}
          </p>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className='flex flex-wrap gap-1.5 mt-3'>
            {item.tags.slice(0, 3).map((t, ti) => (
              <span
                key={ti}
                className='text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50'>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Action Link */}
      <div className='mt-4 pt-3 border-t border-border/40 dark:border-dark_border/40 flex items-center justify-between text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform'>
        <span>View Details</span>
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M14 5l7 7m0 0l-7 7m7-7H3' />
        </svg>
      </div>
    </div>
  )
}

export default PortfolioCardItem
