'use client'

import React from 'react'
import Image from 'next/image'
import { PortfolioItem } from '@/types/portfolio'
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
  const images = item.images || []
  const layout =
    item.imageLayout ||
    (images.length >= 4 ? 'grid_4' : images.length >= 2 ? 'split_horizontal_2' : 'single')
  const fit = item.imageFit || 'cover'

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
      : 'aspect-[4/3.8]'

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

  return (
    <div
      onClick={onClick}
      className={`w-full max-w-[21rem] sm:w-[19.5rem] group cursor-pointer flex flex-col justify-between bg-white dark:bg-darklight p-4 rounded-3xl border border-border/60 dark:border-dark_border/60 shadow-xs hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 ${
        isStaggered && index % 2 !== 0 ? 'lg:mt-16 md:mt-10' : ''
      }`}>
      <div>
        {/* CARD IMAGE FRAME (Preserves exact aspect ratio & rounded corners) */}
        <div
          className={`relative w-full ${cardAspectClass} rounded-2xl overflow-hidden bg-gray-100 dark:bg-darkmode shadow-xs group-hover:shadow-lg transition-all duration-500 border border-border/40 dark:border-dark_border/40`}>
          {images.length === 0 ? (
            <div className='w-full h-full flex items-center justify-center text-xs text-gray-400'>
              No Image
            </div>
          ) : layout === 'split_horizontal_2' && images.length >= 2 ? (
            /* OPTION 2: 2 Images (Top Half & Bottom Half) */
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
                  alt={item.altText ? `${item.altText} - Part 2` : `${item.title} – Engineering Showcase by Malitha Tishamal`}
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
        <div className='flex items-center justify-between gap-2 mt-4 mb-1'>
          <span className='text-[11px] font-bold text-primary dark:text-blue-400 uppercase tracking-wider line-clamp-1'>
            {item.subtitle || 'Events'}
          </span>
          <span className='text-[10px] font-medium text-gray-400 dark:text-gray-500 shrink-0'>
            Updated: {formatDate(item.updatedAt || item.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h4 className='pb-1 group-hover:text-primary text-xl font-bold text-midnight_text dark:text-white transition-colors line-clamp-1'>
          {item.title}
        </h4>

        {/* Description */}
        {item.description && (
          <p className='text-xs sm:text-sm text-grey dark:text-gray-300 font-normal mt-1.5 line-clamp-2 leading-relaxed'>
            {item.description}
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
