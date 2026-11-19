'use client'

import React from 'react'
import Image from 'next/image'
import { ProjectItem } from '@/types/project'
import { PortfolioMediaCrop, isVideoUrl } from '@/types/portfolio'
import { getImgPath, getVideoSrc, PLACEHOLDER_COVER, isDefaultPlaceholder } from '@/utils/image'
import { LazyVideo } from '@/components/SharedComponent/LazyVideo'
import { getVisitSiteTarget } from '@/types/landingPage'
import {
  FEATURED_PROJECTS_DEFAULTS,
} from '@/types/featuredProjects'
import { ContentCard } from '@/components/SharedComponent/MarqueeRows/ContentCard'

interface ProjectCardItemProps {
  project: ProjectItem
  onClick?: () => void
  /** Card copy limits; the admin live preview overrides individual values. */
  tagsShown?: number
  descriptionLines?: number
  showVisitSite?: boolean
  /** One of the six newest projects → blue "Latest · …" pill. */
  latest?: boolean
  /** Width override (cards are fixed-width in the marquee, `w-full` in admin). */
  widthClass?: string
  className?: string
  /** Above-the-fold card: load its cover eagerly so it can be the LCP image. */
  priority?: boolean
}

const formatDate = (val: unknown): string => {
  if (!val) return 'Recently'
  if (typeof val === 'string') return val
  const candidate = val as { toDate?: () => Date }
  if (typeof candidate.toDate === 'function') {
    return candidate.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    })
  }
  return 'Recently'
}

/** First sentence of the long description, used when `summary` is empty. */
const firstSentence = (html?: string): string => {
  const plain = (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!plain) return ''
  const match = plain.match(/^[^.!?]+[.!?]?/)
  return (match ? match[0] : plain).trim()
}

const PlaceholderMedia: React.FC<{ label?: string }> = ({ label }) => (
  <div className='absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white'>
    <svg
      className='h-10 w-10 opacity-90'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
      aria-hidden='true'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.8'
        d='M8 9l-3 3 3 3m8-6l3 3-3 3M13.5 6l-3 12'
      />
    </svg>
    <span className='px-4 text-center text-[11px] font-bold tracking-[0.18em] uppercase opacity-90'>
      {label || 'Project'}
    </span>
  </div>
)

export const ProjectCardItem: React.FC<ProjectCardItemProps> = ({
  project,
  onClick,
  tagsShown = FEATURED_PROJECTS_DEFAULTS.tagsShown,
  descriptionLines = FEATURED_PROJECTS_DEFAULTS.descriptionLines,
  showVisitSite = FEATURED_PROJECTS_DEFAULTS.showVisitSite,
  latest = false,
  widthClass,
  className,
  priority = false,
}) => {
  const cov = project.coverImage?.trim() || ''
  const nonPlaceholderCover = !isDefaultPlaceholder(cov) ? cov : ''
  const validImages = (project.images || [])
    .map((img) => img?.trim() || '')
    .filter((img) => !isDefaultPlaceholder(img))

  const primaryCover =
    nonPlaceholderCover ||
    (validImages.length > 0 ? validImages[0] : '') ||
    cov ||
    (project.images && project.images[0]) ||
    PLACEHOLDER_COVER

  const images = validImages.length > 0
    ? Array.from(new Set([primaryCover, ...validImages]))
    : [primaryCover]
  const cover = primaryCover
  const hasCover = !isDefaultPlaceholder(cover)

  const layout = project.imageLayout || 'single'
  const fit = project.imageFit || 'cover'
  const crop = project.coverCrop
  const zoom = crop?.zoom || 1
  const ox = crop?.ox ?? 50
  const oy = crop?.oy ?? 50
  const isContain = (crop?.fit || fit) === 'contain'

  const isVideo =
    project.mediaType === 'video' ||
    !!project.videoUrl ||
    (images.length === 1 && isVideoUrl(images[0]))

  const visitSite = showVisitSite ? getVisitSiteTarget(project) : null
  const visitHref = visitSite ? getImgPath(visitSite.url) : null

  const tagList = project.tags || []
  const descriptionText =
    (project.summary || '').trim() || firstSentence(project.description)

  const videoSrc = project.videoUrl || images.find((img) => isVideoUrl(img)) || ''
  const videoThumb = project.videoThumbnail || (cover && !isVideoUrl(cover) ? cover : '')
  const playbackMode = project.videoPlaybackMode || 'autoplay_loop'
  const videoCrop = project.videoCrop

  const cropWrapStyle = (c?: PortfolioMediaCrop | null) =>
    c && c.zoom && c.zoom !== 1
      ? { transform: `scale(${c.zoom})`, transformOrigin: `${c.ox}% ${c.oy}%` }
      : undefined

  const renderMediaSlot = (src: string, alt: string, idx: number) => {
    const slotCrop = idx === 0 ? crop || project.imageCrops?.[idx] : project.imageCrops?.[idx]
    const wrapStyle = cropWrapStyle(slotCrop)
    const slotFit = slotCrop?.fit || fit
    const isSlotContain = slotFit === 'contain' && (!slotCrop?.zoom || slotCrop.zoom <= 1)

    return isVideoUrl(src) ? (
      <div className='absolute inset-0' style={wrapStyle}>
        <LazyVideo
          src={getVideoSrc(src)}
          className={`h-full w-full ${slotFit === 'contain' ? 'bg-black object-contain' : 'object-cover'}`}
        />
      </div>
    ) : (
      <div className='absolute inset-0' style={wrapStyle}>
        <Image
          src={getImgPath(src)}
          alt={alt}
          fill
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          sizes='(max-width: 640px) 85vw, (max-width: 1280px) 320px, 380px'
          style={{
            objectPosition: isSlotContain
              ? 'center center'
              : `${slotCrop?.ox ?? 50}% ${slotCrop?.oy ?? 50}%`,
          }}
          className={`${
            isSlotContain ? 'object-contain' : 'object-cover object-top'
          } transition-transform duration-500 group-hover:scale-105`}
        />
      </div>
    )
  }

  let media: React.ReactNode

  if (isVideo && videoSrc) {
    media = (
      <div className='relative h-full w-full overflow-hidden'>
        <div className='absolute inset-0' style={cropWrapStyle(videoCrop)}>
          <LazyVideo
            src={getVideoSrc(videoSrc)}
            poster={videoThumb ? getImgPath(videoThumb) : undefined}
            loop={playbackMode === 'autoplay_loop'}
            style={{ objectPosition: `${videoCrop?.ox ?? 50}% ${videoCrop?.oy ?? 50}%` }}
            className={`h-full w-full ${
              videoCrop?.fit === 'contain' ? 'bg-black object-contain' : 'object-cover'
            }`}
          />
        </div>
        {/* Bottom-left so the type/Latest pills keep the top corners */}
        <span className='absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 rounded-lg bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white shadow-md'>
          <span className='h-2 w-2 animate-pulse rounded-full bg-red-500' />
          <span>VIDEO</span>
        </span>
      </div>
    )
  } else if (!hasCover && !isVideo) {
    media = <PlaceholderMedia label={project.subtitle} />
  } else if (layout === 'grid_4' && images.length >= 4) {
    media = (
      <div className='grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5 bg-border/40 dark:bg-dark_border/60'>
        {images.slice(0, 4).map((img, qi) => (
          <div key={qi} className='relative h-full w-full overflow-hidden bg-gray-900'>
            {renderMediaSlot(img, `${project.title} ${qi + 1}`, qi)}
          </div>
        ))}
      </div>
    )
  } else if (layout === 'split_vertical_2' && images.length >= 2) {
    media = (
      <div className='grid h-full w-full grid-cols-2 gap-0.5 bg-border/40 dark:bg-dark_border/60'>
        {[0, 1].map((ci) => (
          <div key={ci} className='relative h-full w-full overflow-hidden bg-gray-900'>
            {renderMediaSlot(images[ci], `${project.title} ${ci + 1}`, ci)}
          </div>
        ))}
      </div>
    )
  } else if (layout === 'split_horizontal_2' && images.length >= 2) {
    media = (
      <div className='grid h-full w-full grid-rows-2 gap-0.5 bg-border/40 dark:bg-dark_border/60'>
        {[0, 1].map((ri) => (
          <div key={ri} className='relative h-full w-full overflow-hidden bg-gray-900'>
            {renderMediaSlot(images[ri], `${project.title} ${ri + 1}`, ri)}
          </div>
        ))}
      </div>
    )
  } else {
    media = (
      <div
        className='absolute inset-0 h-full w-full'
        style={
          zoom > 1
            ? { transform: `scale(${zoom})`, transformOrigin: `${ox}% ${oy}%` }
            : undefined
        }>
        <Image
          src={getImgPath(cover)}
          alt={project.altText || `${project.title} – Software & Engineering by Malitha Tishamal`}
          fill
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          sizes='(max-width: 640px) 85vw, (max-width: 1280px) 320px, 380px'
          style={{ objectPosition: `${ox}% ${oy}%` }}
          className={`${
            isContain ? 'object-contain' : 'object-cover object-top'
          } transition-transform duration-500 group-hover:scale-105`}
        />
      </div>
    )
  }

  return (
    <ContentCard
      media={media}
      typeLabel={project.subtitle || 'Project'}
      relativeDate={project.updatedAt || project.createdAt}
      relativeVerb='updated'
      latest={latest}
      photoChip={images.length > 1 && !isVideo ? `+${images.length} Photos` : undefined}
      title={project.title}
      description={descriptionText}
      descriptionLines={Math.min(descriptionLines, 3)}
      tags={tagList}
      tagsShown={tagsShown}
      dateLabel={formatDate(project.updatedAt || project.createdAt)}
      visitHref={visitHref}
      onOpen={onClick}
      openHint={`View details for ${project.title}`}
      widthClass={widthClass}
      className={className}
    />
  )
}

export default ProjectCardItem
