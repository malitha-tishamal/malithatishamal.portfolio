'use client'

import React from 'react'
import Image from 'next/image'
import { ProjectItem } from '@/types/project'
import { getImgPath } from '@/utils/image'

interface ProjectCardItemProps {
  project: ProjectItem
  onClick?: () => void
}

export const ProjectCardItem: React.FC<ProjectCardItemProps> = ({
  project,
  onClick,
}) => {
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

  const cover =
    project.coverImage ||
    (project.images && project.images.length > 0 ? project.images[0] : '/images/portfolio/cozycasa.png')

  const fit = project.imageFit || 'cover'
  const imgFitClass =
    fit === 'contain'
      ? 'object-contain p-2 bg-gray-100 dark:bg-darkmode'
      : 'object-cover object-top'

  return (
    <div
      onClick={onClick}
      className='w-full group cursor-pointer bg-white dark:bg-darklight rounded-3xl border border-border/70 dark:border-dark_border p-4 sm:p-5 shadow-xs hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between'>
      <div>
        {/* Main Image Frame with Category Pill Badge */}
        <div className='relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100 dark:bg-darkmode border border-border/40 dark:border-dark_border/40 shadow-xs mb-4'>
          <Image
            src={getImgPath(cover)}
            alt={project.title}
            fill
            unoptimized
            className={`${imgFitClass} group-hover:scale-105 transition-transform duration-500`}
          />

          {/* Category Pill Badge on top-left (as shown in reference image!) */}
          <div className='absolute top-3 left-3 z-10'>
            <span className='px-3 py-1 rounded-xl bg-primary text-white text-[11px] font-bold shadow-md shadow-primary/30 tracking-wide uppercase'>
              {project.subtitle || 'Project'}
            </span>
          </div>

          {/* Multi-image count indicator on bottom-right if >1 photos */}
          {project.images && project.images.length > 1 && (
            <div className='absolute bottom-2.5 right-2.5 z-10'>
              <span className='px-2.5 py-0.5 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1'>
                <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                </svg>
                <span>+{project.images.length} Photos</span>
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
            {project.summary || project.description}
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
