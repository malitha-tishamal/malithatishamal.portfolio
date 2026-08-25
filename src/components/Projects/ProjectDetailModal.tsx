'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { ProjectItem } from '@/types/project'
import { getImgPath } from '@/utils/image'

interface ProjectDetailModalProps {
  project: ProjectItem | null
  onClose: () => void
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState<number | null>(null)
  const [galleryFit, setGalleryFit] = useState<'contain' | 'cover'>('contain')

  if (!project) return null

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

  // Combine cover image and gallery images (up to 15+ images)
  const allImages = Array.from(
    new Set([
      ...(project.coverImage ? [project.coverImage] : []),
      ...(project.images || []),
    ])
  ).filter((img) => img && img.trim().length > 0)

  const hasLinks = !!(
    project.projectUrl ||
    project.githubUrl ||
    project.linkedinUrl ||
    project.facebookUrl ||
    project.instagramUrl ||
    project.youtubeUrl
  )

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200'>
      <div className='relative w-full max-w-4xl bg-white dark:bg-darklight rounded-3xl p-5 sm:p-8 border border-border/60 dark:border-dark_border shadow-2xl my-6 text-midnight_text dark:text-white max-h-[92vh] overflow-y-auto'>
        {/* Close Button */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-full text-gray-400 hover:text-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-darkmode cursor-pointer z-10 transition'
          aria-label='Close Project Modal'>
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
          </svg>
        </button>

        {/* Modal Header */}
        <div className='mb-5 pr-10'>
          <div className='flex flex-wrap items-center gap-2 mb-2'>
            <span className='px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide'>
              {project.subtitle || 'Project'}
            </span>
            {project.displayOrder && (
              <span className='px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-400'>
                Project #{project.displayOrder}
              </span>
            )}
          </div>
          <h2 className='text-2xl sm:text-3xl font-extrabold text-midnight_text dark:text-white leading-tight'>
            {project.title}
          </h2>
          <div className='flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1.5'>
            <span>Last Updated: {formatDate(project.updatedAt || project.createdAt)}</span>
          </div>
        </div>

        {/* Gallery Mode Switch & Count */}
        {allImages.length > 0 && (
          <div className='flex items-center justify-between gap-2 mb-3'>
            <span className='text-xs font-bold uppercase tracking-wider text-gray-400'>
              Screenshots &amp; Photos ({allImages.length})
            </span>
            <div className='flex items-center gap-1 bg-gray-100 dark:bg-darkmode p-0.5 rounded-lg border border-border/40 dark:border-dark_border/40 text-xs'>
              <button
                type='button'
                onClick={() => setGalleryFit('contain')}
                className={`px-2.5 py-1 rounded-md transition font-semibold cursor-pointer ${
                  galleryFit === 'contain'
                    ? 'bg-white dark:bg-darklight text-primary shadow-xs'
                    : 'text-gray-500 hover:text-dark dark:hover:text-white'
                }`}>
                Full View (No Crop)
              </button>
              <button
                type='button'
                onClick={() => setGalleryFit('cover')}
                className={`px-2.5 py-1 rounded-md transition font-semibold cursor-pointer ${
                  galleryFit === 'cover'
                    ? 'bg-white dark:bg-darklight text-primary shadow-xs'
                    : 'text-gray-500 hover:text-dark dark:hover:text-white'
                }`}>
                Fill Grid
              </button>
            </div>
          </div>
        )}

        {/* Multi-Image Gallery Showcase (Supports up to 15+ images!) */}
        {allImages.length > 0 && (
          <div className='mb-6'>
            <div
              className={`grid gap-3 ${
                allImages.length === 1
                  ? 'grid-cols-1'
                  : allImages.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : allImages.length === 3
                  ? 'grid-cols-1 sm:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}>
              {allImages.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setActivePhotoIdx(i)}
                  className={`relative rounded-2xl overflow-hidden border border-border/60 dark:border-dark_border bg-gray-100 dark:bg-darkmode group cursor-pointer ${
                    allImages.length === 1
                      ? 'h-80 sm:h-96'
                      : 'h-60 sm:h-64'
                  }`}>
                  <Image
                    src={getImgPath(img)}
                    alt={`${project.title} Screenshot ${i + 1}`}
                    fill
                    unoptimized
                    className={`${
                      galleryFit === 'contain'
                        ? 'object-contain p-2'
                        : 'object-cover object-top'
                    } group-hover:scale-105 transition-transform duration-300`}
                  />
                  <div className='absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100'>
                    <span className='px-3 py-1.5 rounded-xl bg-black/75 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 shadow-lg'>
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7' />
                      </svg>
                      <span>Click to Enlarge</span>
                    </span>
                  </div>
                  <span className='absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full'>
                    Photo #{i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Description Paragraph */}
        {(project.description || project.summary) && (
          <div className='mb-6 bg-gray-50 dark:bg-darkmode/50 p-5 rounded-2xl border border-border/40 dark:border-dark_border/40'>
            <h4 className='text-xs font-bold uppercase tracking-wider text-gray-400 mb-2'>
              Project Overview &amp; Architecture
            </h4>
            <div className='text-sm sm:text-base text-grey dark:text-gray-300 leading-relaxed whitespace-pre-line space-y-3 font-normal'>
              {project.description || project.summary}
            </div>
          </div>
        )}

        {/* Tech Stack & Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className='mb-6'>
            <h4 className='text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5'>
              Technologies &amp; Frameworks
            </h4>
            <div className='flex flex-wrap gap-2'>
              {project.tags.map((t, ti) => (
                <span
                  key={ti}
                  className='text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50'>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action & Social Media Links */}
        {hasLinks && (
          <div className='pt-4 border-t border-border/40 dark:border-dark_border/40'>
            <h4 className='text-xs font-bold uppercase tracking-wider text-gray-400 mb-3'>
              Project Links &amp; Repository
            </h4>
            <div className='flex flex-wrap items-center gap-2.5'>
              {/* 1. Live Project / Demo Button */}
              {project.projectUrl && project.projectUrl.trim().length > 0 && (
                <a
                  href={project.projectUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='px-4 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' />
                  </svg>
                  <span>Live Project Demo</span>
                </a>
              )}

              {/* 2. GitHub Repository Button */}
              {project.githubUrl && project.githubUrl.trim().length > 0 && (
                <a
                  href={project.githubUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='px-4 py-2.5 rounded-xl bg-[#24292e] hover:bg-black text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer'>
                  <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                    <path fillRule='evenodd' clipRule='evenodd' d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z' />
                  </svg>
                  <span>GitHub Repository</span>
                </a>
              )}

              {/* 3. LinkedIn Button */}
              {project.linkedinUrl && project.linkedinUrl.trim().length > 0 && (
                <a
                  href={project.linkedinUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='px-4 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer'>
                  <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z' />
                  </svg>
                  <span>LinkedIn</span>
                </a>
              )}

              {/* 4. Facebook Button */}
              {project.facebookUrl && project.facebookUrl.trim().length > 0 && (
                <a
                  href={project.facebookUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='px-4 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#0d65d9] text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer'>
                  <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                  </svg>
                  <span>Facebook</span>
                </a>
              )}

              {/* 5. Instagram Button */}
              {project.instagramUrl && project.instagramUrl.trim().length > 0 && (
                <a
                  href={project.instagramUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer'>
                  <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
                  </svg>
                  <span>Instagram</span>
                </a>
              )}

              {/* 6. YouTube Button */}
              {project.youtubeUrl && project.youtubeUrl.trim().length > 0 && (
                <a
                  href={project.youtubeUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='px-4 py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#d60000] text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer'>
                  <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' />
                  </svg>
                  <span>YouTube</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FULLSCREEN LIGHTBOX PHOTO MODAL */}
      {activePhotoIdx !== null && allImages[activePhotoIdx] && (
        <div
          onClick={() => setActivePhotoIdx(null)}
          className='fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200'>
          <button
            onClick={() => setActivePhotoIdx(null)}
            className='absolute top-5 right-5 text-white bg-white/20 hover:bg-white/30 p-3 rounded-full text-lg cursor-pointer transition z-10'>
            ✕
          </button>
          <div className='relative w-full max-w-5xl h-[80vh] flex items-center justify-center'>
            <Image
              src={getImgPath(allImages[activePhotoIdx])}
              alt='Enlarged Screenshot'
              fill
              unoptimized
              className='object-contain'
            />
          </div>
          {allImages.length > 1 && (
            <div className='flex items-center gap-2 mt-4'>
              {allImages.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  onClick={(e) => {
                    e.stopPropagation()
                    setActivePhotoIdx(dotIdx)
                  }}
                  className={`w-3 h-3 rounded-full transition cursor-pointer ${
                    activePhotoIdx === dotIdx ? 'bg-primary scale-125' : 'bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProjectDetailModal
