'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import { ProjectItem } from '@/types/project'
import { PortfolioMediaCrop, isVideoUrl } from '@/types/portfolio'
import { getImgPath } from '@/utils/image'

interface ProjectCardItemProps {
  project: ProjectItem
  onClick?: () => void
}

export const ProjectCardItem: React.FC<ProjectCardItemProps> = ({
  project,
  onClick,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [thumbPlayStarted, setThumbPlayStarted] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)

  // Format date helper
  const formatDate = (val: any): string => {
    if (!val) return 'Recently'
    if (typeof val === 'string') return val
    if (val?.toDate) {
      return val.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
    }
    return 'Recently'
  }

  const images = project.images && project.images.length > 0 ? project.images : (project.coverImage ? [project.coverImage] : [])
  const cover =
    project.coverImage ||
    (images.length > 0 ? images[0] : '/images/portfolio/cozycasa.png')

  const layout = project.imageLayout || 'single'
  const fit = project.imageFit || 'cover'
  const crop = project.coverCrop
  const zoom = crop?.zoom || 1
  const ox = crop?.ox ?? 50
  const oy = crop?.oy ?? 50
  const isContain = (crop?.fit || fit) === 'contain'

  // Video media detection
  const isVideo =
    project.mediaType === 'video' ||
    !!project.videoUrl ||
    (images.length === 1 && isVideoUrl(images[0]))

  const videoSrc = project.videoUrl || (images.find((img) => isVideoUrl(img)) || '')
  const videoThumb = project.videoThumbnail || (cover && !isVideoUrl(cover) ? cover : '')
  const playbackMode = project.videoPlaybackMode || 'autoplay_loop'
  const trimStart = project.videoTrim?.start || 0
  const trimEnd = project.videoTrim?.end || 0
  const videoCrop = project.videoCrop

  const cropWrapStyle = (c?: PortfolioMediaCrop | null) =>
    c && c.zoom > 1
      ? { transform: `scale(${c.zoom})`, transformOrigin: `${c.ox}% ${c.oy}%` }
      : undefined

  const cardAspectClass =
    fit === 'portrait_tall'
      ? 'aspect-[3/4]'
      : 'aspect-[16/10]'

  const renderMediaSlot = (src: string, alt: string, idx: number) => {
    const slotCrop = idx === 0 ? (crop || project.imageCrops?.[idx]) : project.imageCrops?.[idx]
    const wrapStyle = cropWrapStyle(slotCrop)
    const slotFit = slotCrop?.fit || fit

    return isVideoUrl(src) ? (
      <div className='absolute inset-0' style={wrapStyle}>
        <video
          src={getImgPath(src)}
          muted
          loop
          autoPlay
          playsInline
          preload='metadata'
          className={`w-full h-full ${slotFit === 'contain' ? 'object-contain bg-black' : 'object-cover'}`}
        />
      </div>
    ) : (
      <div className='absolute inset-0' style={wrapStyle}>
        <Image
          src={getImgPath(src)}
          alt={alt}
          fill
          unoptimized
          style={{
            objectPosition: `${slotCrop?.ox ?? 50}% ${slotCrop?.oy ?? 50}%`,
          }}
          className={`${
            slotFit === 'contain'
              ? 'object-contain p-1 bg-black/90'
              : 'object-cover object-top'
          } group-hover:scale-105 transition-transform duration-500`}
        />
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className='w-full group cursor-pointer bg-white dark:bg-darklight rounded-3xl border border-border/70 dark:border-dark_border p-4 sm:p-5 shadow-xs hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between'>
      <div>
        {/* Main Media Frame */}
        <div className={`relative w-full ${cardAspectClass} rounded-2xl overflow-hidden ${isContain ? 'bg-black/90 dark:bg-black/95' : 'bg-gray-100 dark:bg-darkmode'} border border-border/40 dark:border-dark_border/40 shadow-xs mb-4`}>
          {isVideo && videoSrc ? (
            /* Video Media Player */
            <div className='relative w-full h-full overflow-hidden'>
              <div
                className='absolute inset-0'
                style={cropWrapStyle(videoCrop)}>
                <video
                  ref={videoRef}
                  src={getImgPath(videoSrc)}
                  poster={videoThumb ? getImgPath(videoThumb) : undefined}
                  muted
                  loop={playbackMode === 'autoplay_loop'}
                  autoPlay={playbackMode === 'autoplay_loop'}
                  playsInline
                  preload='metadata'
                  style={{
                    objectPosition: `${videoCrop?.ox ?? 50}% ${videoCrop?.oy ?? 50}%`,
                  }}
                  className={`w-full h-full ${
                    videoCrop?.fit === 'contain' ? 'object-contain bg-black' : 'object-cover'
                  }`}
                />
              </div>

              {/* Video Badge */}
              <div className='absolute top-3 right-3 z-10'>
                <span className='px-2 py-0.5 rounded-lg bg-black/75 text-white text-[10px] font-bold flex items-center gap-1 shadow-md'>
                  <span className='w-2 h-2 rounded-full bg-red-500 animate-pulse'></span>
                  <span>VIDEO</span>
                </span>
              </div>
            </div>
          ) : layout === 'grid_4' && images.length >= 4 ? (
            /* 4 Quadrants */
            <div className='grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5 bg-border/40 dark:bg-dark_border/60'>
              {images.slice(0, 4).map((img, qi) => (
                <div key={qi} className='relative w-full h-full overflow-hidden bg-gray-900'>
                  {renderMediaSlot(img, `${project.title} ${qi + 1}`, qi)}
                </div>
              ))}
            </div>
          ) : layout === 'split_vertical_2' && images.length >= 2 ? (
            /* 2 Columns Side-by-Side */
            <div className='grid grid-cols-2 w-full h-full gap-0.5 bg-border/40 dark:bg-dark_border/60'>
              {[0, 1].map((ci) => (
                <div key={ci} className='relative w-full h-full overflow-hidden bg-gray-900'>
                  {renderMediaSlot(images[ci], `${project.title} ${ci + 1}`, ci)}
                </div>
              ))}
            </div>
          ) : layout === 'split_horizontal_2' && images.length >= 2 ? (
            /* 2 Rows Stacked */
            <div className='grid grid-rows-2 w-full h-full gap-0.5 bg-border/40 dark:bg-dark_border/60'>
              {[0, 1].map((ri) => (
                <div key={ri} className='relative w-full h-full overflow-hidden bg-gray-900'>
                  {renderMediaSlot(images[ri], `${project.title} ${ri + 1}`, ri)}
                </div>
              ))}
            </div>
          ) : (
            /* Single Image with Zoom & Focus */
            <div
              className='absolute inset-0 w-full h-full'
              style={
                zoom > 1
                  ? {
                      transform: `scale(${zoom})`,
                      transformOrigin: `${ox}% ${oy}%`,
                    }
                  : undefined
              }>
              <Image
                src={getImgPath(cover)}
                alt={project.altText || `${project.title} – Software & Engineering by Malitha Tishamal`}
                fill
                unoptimized
                style={{
                  objectPosition: `${ox}% ${oy}%`,
                }}
                className={`${
                  isContain
                    ? 'object-contain'
                    : 'object-cover object-top'
                } group-hover:scale-105 transition-transform duration-500`}
              />
            </div>
          )}

          {/* Category Pill Badge on top-left */}
          <div className='absolute top-3 left-3 z-10'>
            <span className='px-3 py-1 rounded-xl bg-primary text-white text-[11px] font-bold shadow-md shadow-primary/30 tracking-wide uppercase'>
              {project.subtitle || 'Project'}
            </span>
          </div>

          {/* Multi-image count indicator on bottom-right if >1 photos */}
          {images.length > 1 && !isVideo && (
            <div className='absolute bottom-2.5 right-2.5 z-10'>
              <span className='px-2.5 py-0.5 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1'>
                <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                </svg>
                <span>+{images.length} Photos</span>
              </span>
            </div>
          )}
        </div>

        {/* Project Title */}
        <h3 className='text-lg sm:text-xl font-bold text-midnight_text dark:text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2'>
          {project.title}
        </h3>

        {/* Project Summary / Short Description */}
        {(project.summary || project.description) && (
          <p className='text-xs sm:text-sm text-grey dark:text-gray-300 font-normal line-clamp-2 leading-relaxed mb-3'>
            {project.summary || project.description?.replace(/<[^>]+>/g, '')}
          </p>
        )}

        {/* Tech Stack Tags Chips */}
        {project.tags && project.tags.length > 0 && (
          <div className='flex flex-wrap gap-1.5 mb-2'>
            {project.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className='text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50'>
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className='text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-darkmode text-gray-500'>
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Date & View Details Link */}
      <div className='mt-4 pt-3 border-t border-border/40 dark:border-dark_border/40 flex items-center justify-between text-xs font-semibold'>
        <span className='text-[11px] text-gray-400 dark:text-gray-500 font-normal'>
          {formatDate(project.updatedAt || project.createdAt)}
        </span>

        <span className='text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold'>
          <span>View Details</span>
          <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M14 5l7 7m0 0l-7 7m7-7H3' />
          </svg>
        </span>
      </div>
    </div>
  )
}

export default ProjectCardItem
