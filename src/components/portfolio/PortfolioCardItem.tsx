'use client'

import React, { memo } from 'react'
import Image from 'next/image'
import { PortfolioItem, PortfolioMediaCrop, isVideoUrl } from '@/types/portfolio'
import { ContentCard } from '@/components/SharedComponent/MarqueeRows/ContentCard'
import { getImgPath } from '@/utils/image'

interface PortfolioCardItemProps {
  item: PortfolioItem
  /** Kept for older call sites; layout is fixed now. */
  index?: number
  isStaggered?: boolean
  onClick?: () => void
  /** Stable handler (preferred — keeps the card memoized). */
  onOpen?: (item: PortfolioItem) => void
  latestLabel?: string
  widthClass?: string
  className?: string
}

const IMAGE_SIZES = '(max-width: 640px) 85vw, (max-width: 1280px) 320px, 380px'

const formatDate = (value: any): string => {
  if (!value) return 'Recently'
  if (typeof value === 'string') return value
  if (typeof value === 'number') {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  if (typeof value?.toDate === 'function') {
    return value.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  if (typeof value?.seconds === 'number') {
    return new Date(value.seconds * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  return 'Recently'
}

const stripHtml = (value?: string): string =>
  (value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const cropStyle = (crop?: PortfolioMediaCrop | null): React.CSSProperties | undefined =>
  crop && crop.zoom && crop.zoom !== 1
    ? { transform: `scale(${crop.zoom})`, transformOrigin: `${crop.ox}% ${crop.oy}%` }
    : undefined

const VideoMedia: React.FC<{ item: PortfolioItem; src: string; thumb: string }> = ({
  item,
  src,
  thumb,
}) => {
  const mode = item.videoPlaybackMode || 'autoplay_loop'
  const trimStart = item.videoTrim?.start || 0
  const trimEnd = item.videoTrim?.end || 0
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const crop = item.videoCrop
  const contain = (crop?.fit || item.imageFit) === 'contain'
  const staticThumb = thumb && (mode === 'thumbnail_only' || mode === 'hover_play')

  if (staticThumb) {
    return (
      <div className='relative h-full w-full'>
        <Image
          src={getImgPath(thumb)}
          alt={item.altText || item.title}
          fill
          unoptimized
          sizes={IMAGE_SIZES}
          className='object-cover object-top'
        />
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25'>
          <span className='flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-primary shadow-xl dark:bg-darklight/90'>
            <svg className='ml-0.5 h-5 w-5' fill='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
              <path d='M8 5v14l11-7z' />
            </svg>
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className='absolute inset-0' style={cropStyle(crop)}>
      <video
        ref={videoRef}
        src={getImgPath(src)}
        poster={thumb ? getImgPath(thumb) : undefined}
        autoPlay
        muted
        loop
        playsInline
        preload='metadata'
        onLoadedMetadata={(event) => {
          if (trimStart > 0) event.currentTarget.currentTime = trimStart
        }}
        onTimeUpdate={(event) => {
          const el = event.currentTarget
          if (trimEnd > 0 && el.currentTime >= trimEnd) el.currentTime = trimStart
          else if (trimStart > 0 && el.currentTime < trimStart - 0.15) el.currentTime = trimStart
        }}
        style={crop ? { objectPosition: `${crop.ox}% ${crop.oy}%` } : undefined}
        className={`h-full w-full ${contain ? 'bg-black object-contain' : 'object-cover'}`}
      />
      <span className='absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs'>
        <svg className='h-2.5 w-2.5 fill-current text-red-500' viewBox='0 0 24 24' aria-hidden='true'>
          <path d='M8 5v14l11-7z' />
        </svg>
        VIDEO
      </span>
    </div>
  )
}

const PortfolioMedia: React.FC<{ item: PortfolioItem }> = memo(function PortfolioMedia({ item }) {
  const images = item.images || []
  const videoSrc = item.videoUrl || images.find((src) => isVideoUrl(src)) || ''
  const isVideo =
    item.mediaType === 'video' || !!item.videoUrl || (images.length === 1 && isVideoUrl(images[0]))
  const thumb =
    item.videoThumbnail ||
    (isVideo && images.length === 1 && !isVideoUrl(images[0]) ? images[0] : '')

  if (isVideo && videoSrc) {
    return <VideoMedia item={item} src={videoSrc} thumb={thumb} />
  }

  if (images.length === 0) {
    return (
      <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-primary via-blue-600 to-indigo-700'>
        <span className='text-xs font-bold text-white/80'>{item.subtitle || 'Portfolio'}</span>
      </div>
    )
  }

  const baseFit = item.imageFit || 'cover'

  const renderSlot = (src: string, slotIndex: number, label: string) => {
    const crop = item.imageCrops?.[slotIndex] || null
    const slotFit = crop?.fit || baseFit
    const contain = slotFit === 'contain'
    const positions = crop ? { objectPosition: contain ? 'center center' : `${crop.ox}% ${crop.oy}%` } : undefined

    if (isVideoUrl(src)) {
      return (
        <div className='absolute inset-0' style={cropStyle(crop)}>
          <video
            src={getImgPath(src)}
            muted
            loop
            autoPlay
            playsInline
            preload='metadata'
            className={`h-full w-full ${contain ? 'bg-black object-contain' : 'object-cover'}`}
          />
        </div>
      )
    }

    return (
      <div className={`absolute inset-0 ${contain ? 'bg-gray-50 dark:bg-black/40' : ''}`} style={cropStyle(crop)}>
        <Image
          src={getImgPath(src)}
          alt={label}
          fill
          unoptimized
          loading='lazy'
          sizes={IMAGE_SIZES}
          style={positions}
          className={contain ? 'object-contain p-3' : 'object-cover object-top'}
        />
      </div>
    )
  }

  const layout =
    item.imageLayout ||
    (images.length >= 4 ? 'grid_4' : images.length >= 2 ? 'split_horizontal_2' : 'single')

  if (layout === 'grid_4' && images.length >= 3) {
    return (
      <div className='grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5 bg-border/40 dark:bg-dark_border/60'>
        {images.slice(0, 4).map((src, index) => (
          <div key={`${src}-${index}`} className='relative h-full w-full overflow-hidden'>
            {renderSlot(src, index, `${item.title} photo ${index + 1}`)}
          </div>
        ))}
      </div>
    )
  }

  if (layout === 'split_vertical_2' && images.length >= 2) {
    return (
      <div className='grid h-full w-full grid-cols-2 gap-0.5 bg-border/40 dark:bg-dark_border/60'>
        {images.slice(0, 2).map((src, index) => (
          <div key={`${src}-${index}`} className='relative h-full w-full overflow-hidden'>
            {renderSlot(src, index, `${item.title} photo ${index + 1}`)}
          </div>
        ))}
      </div>
    )
  }

  if (layout === 'split_horizontal_2' && images.length >= 2) {
    return (
      <div className='grid h-full w-full grid-rows-2 gap-0.5 bg-border/40 dark:bg-dark_border/60'>
        {images.slice(0, 2).map((src, index) => (
          <div key={`${src}-${index}`} className='relative h-full w-full overflow-hidden'>
            {renderSlot(src, index, `${item.title} photo ${index + 1}`)}
          </div>
        ))}
      </div>
    )
  }

  return <div className='relative h-full w-full'>{renderSlot(images[0], 0, item.altText || item.title)}</div>
})

export const PortfolioCardItem: React.FC<PortfolioCardItemProps> = memo(function PortfolioCardItem({
  item,
  onClick,
  onOpen,
  latestLabel,
  widthClass = 'w-[85vw] sm:w-[320px] xl:w-[380px]',
  className = '',
}) {
  const description = stripHtml(item.description)
  const updatedLabel = `Updated: ${formatDate(item.updatedAt || item.createdAt)}`

  return (
    <ContentCard
      media={<PortfolioMedia item={item} />}
      latestLabel={latestLabel}
      latestPosition='top-left'
      photoChip={
        item.mediaType === 'video' || !!item.videoUrl
          ? undefined
          : (item.images?.length || 0) > 1
            ? `+${item.images.length} Photos`
            : undefined
      }
      categoryLabel={item.subtitle || 'Portfolio'}
      metaDateLabel={updatedLabel}
      title={item.title}
      description={description}
      emptyDescription='Open this portfolio entry for the full story.'
      descriptionLines={3}
      tags={item.tags || []}
      onOpen={() => {
        if (onOpen) onOpen(item)
        else onClick?.()
      }}
      openHint={`View portfolio details for ${item.title}`}
      widthClass={widthClass}
      className={className}
    />
  )
})

export default PortfolioCardItem
