'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ProjectItem, defaultProjects } from '@/types/project'
import { ProjectCardItem } from '@/components/Projects/ProjectCardItem'
import { ProjectDetailModal } from '@/components/Projects/ProjectDetailModal'
import { MarqueeRows } from '@/components/SharedComponent/MarqueeRows'
import { useFeaturedProjectsSettings } from '@/hooks/useFeaturedProjectsSettings'

const LATEST_COUNT = 6

const getProjectKey = (project: ProjectItem) => project.id
const getProjectUpdatedAt = (project: ProjectItem) => project.updatedAt || project.createdAt

const ProjectsSection: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null)
  const settings = useFeaturedProjectsSettings()

  // Real-time Firestore sync
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'projects'),
        (snapshot) => {
          if (!snapshot.empty) {
            const fetched: ProjectItem[] = []
            snapshot.forEach((docSnap) => {
              fetched.push({
                ...(docSnap.data() as ProjectItem),
                id: docSnap.id,
              })
            })
            fetched.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
            setProjects(fetched)
          } else {
            setProjects(defaultProjects)
          }
          setLoading(false)
        },
        (error) => {
          console.warn('Firestore projects listener notice:', error.message)
          setProjects(defaultProjects)
          setLoading(false)
        }
      )
      return () => unsubscribe()
    } catch (err) {
      console.error('Error setting up projects listener:', err)
      setProjects(defaultProjects)
      setLoading(false)
    }
  }, [])

  return (
    <section id='projects' className='py-16 sm:py-24 scroll-mt-24 bg-white dark:bg-darkmode transition-colors'>
      <div className='container mx-auto max-w-6xl px-4 sm:px-6'>
        {/* Section Header (Matching Reference Style with View More Link) */}
        <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10'>
          <div>
            <div className='flex items-center gap-2 mb-2'>
              <span className='w-3 h-3 rounded-full bg-primary'></span>
              <span className='font-bold text-xs uppercase tracking-wider text-primary'>
                Engineering &amp; Innovation
              </span>
            </div>
            <h2 className='text-3xl sm:text-4xl font-extrabold text-midnight_text dark:text-white'>
              {settings.sectionTitle}
            </h2>
            <p className='text-sm sm:text-base text-grey dark:text-gray-300 font-medium mt-1 max-w-xl'>
              {settings.sectionSubtitle}
            </p>
          </div>

          {/* View More Link on Header (Matching Reference Design!) */}
          <div className='shrink-0'>
            <Link
              href='/projects'
              className='group inline-flex items-center gap-2 text-sm font-bold text-midnight_text dark:text-white hover:text-primary dark:hover:text-primary transition-colors'>
              <span>View All Projects</span>
              <svg
                className='w-4 h-4 group-hover:translate-x-1 transition-transform'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M14 5l7 7m0 0l-7 7m7-7H3' />
              </svg>
            </Link>
          </div>
        </div>

        {/* Two-row endless marquee — equal-size cards, no card in both rows */}
        <MarqueeRows<ProjectItem>
          items={projects}
          getKey={getProjectKey}
          getUpdatedAt={getProjectUpdatedAt}
          latestCount={LATEST_COUNT}
          speed={50}
          rowCount={2}
          loading={loading}
          skeletonCount={8}
          ariaLabel='Featured projects'
          emptyState={
            <p className='text-sm font-semibold text-gray-500 dark:text-gray-400'>
              No projects published yet.
            </p>
          }
          renderCard={(project, { latestLabel }) => (
            <ProjectCardItem
              project={project}
              tagsShown={settings.tagsShown}
              showVisitSite={settings.showVisitSite}
              latestLabel={latestLabel}
              onClick={() => setSelectedProject(project)}
            />
          )}
        />

        {/* Bottom View All Button */}
        <div className='text-center pt-10'>
          <Link
            href='/projects'
            className='inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-primary hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer'>
            <span>Explore All Projects</span>
            <svg
              className='w-4 h-4 group-hover:translate-x-1 transition-transform'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M14 5l7 7m0 0l-7 7m7-7H3' />
            </svg>
          </Link>
        </div>
      </div>

      {/* PROJECT DETAIL MODAL */}
      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  )
}

export default ProjectsSection
