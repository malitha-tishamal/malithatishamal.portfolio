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
  const layout = item.imageLayout || (images.length >= 4 ? 'grid_4' : images.length >= 2 ? 'split_horizontal_2' : 'single')

  return (
    <div
      onClick={onClick}
      className={`w-full max-w-[20rem] sm:w-[18.5rem] group cursor-pointer ${
        isStaggered && index % 2 !== 0 ? 'lg:mt-24 md:mt-16' : ''
      }`}>
      {/* CARD IMAGE FRAME (Preserves exact aspect ratio & rounded corners) */}
      <div className='relative w-full aspect-[4/4.3] rounded-2xl overflow-hidden bg-gray-100 dark:bg-darklight shadow-md group-hover:shadow-2xl transition-all duration-500 group-hover:scale-[1.03] border border-border/40 dark:border-dark_border/40'>
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
                alt={`${item.title} Top`}
                fill
                unoptimized
                className='object-cover group-hover:scale-105 transition-transform duration-500'
              />
            </div>
            <div className='relative w-full h-full overflow-hidden'>
              <Image
                src={getImgPath(images[1])}
                alt={`${item.title} Bottom`}
                fill
                unoptimized
                className='object-cover group-hover:scale-105 transition-transform duration-500'
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
                  alt={`${item.title} ${i + 1}`}
                  fill
                  unoptimized
                  className='object-cover group-hover:scale-105 transition-transform duration-500'
                />
              </div>
            ))}
          </div>
        ) : (
          /* OPTION 1: 1 Single Image occupying full card */
          <div className='relative w-full h-full overflow-hidden'>
            <Image
              src={getImgPath(images[0])}
              alt={item.title}
              fill
              unoptimized
              className='object-cover group-hover:scale-110 transition-transform duration-500'
            />
          </div>
        )}
      </div>

      {/* Title & Subtitle */}
      <h4 className='pb-1 pt-6 group-hover:text-primary group-hover:cursor-pointer text-2xl text-midnight_text font-bold dark:text-white transition-colors line-clamp-1'>
        {item.title}
      </h4>
      <p className='text-secondary font-normal text-base group-hover:text-primary group-hover:cursor-pointer dark:text-white/60 transition-colors line-clamp-1'>
        {item.subtitle || 'Designation'}
      </p>
    </div>
  )
}

export default PortfolioCardItem
