'use client'

import React, { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  ProjectItem,
  defaultProjects,
  PROJECT_CATEGORIES,
} from '@/types/project'
import { ProjectCardItem } from './ProjectCardItem'
import { ProjectDetailModal } from './ProjectDetailModal'

export const ProjectsList: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>(defaultProjects)
  const [activeCategory, setActiveCategory] = useState<string>('All Projects')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null)

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
        },
        (error) => {
          console.warn('Firestore projects listener notice:', error.message)
          setProjects(defaultProjects)
        }
      )
      return () => unsubscribe()
    } catch (err) {
      console.error('Error setting up projects listener:', err)
      setProjects(defaultProjects)
    }
  }, [])

  // Dynamic Categories from database
  const dynamicCategories = Array.from(
    new Set([
      ...PROJECT_CATEGORIES,
      ...projects.map((p) => p.subtitle).filter(Boolean),
    ])
  )

  // Filtered projects
  const filteredProjects = projects.filter((project) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      project.title?.toLowerCase().includes(q) ||
      project.subtitle?.toLowerCase().includes(q) ||
      project.summary?.toLowerCase().includes(q) ||
      project.tags?.some((t) => t.toLowerCase().includes(q))

    const matchesCategory =
      activeCategory === 'All Projects' || activeCategory === 'All'
        ? true
        : project.subtitle?.toLowerCase() === activeCategory.toLowerCase() ||
          project.tags?.some((t) => t.toLowerCase() === activeCategory.toLowerCase())

    return matchesSearch && matchesCategory
  })

  return (
    <section id='projects' className='py-12 sm:py-16 dark:bg-darkmode bg-white transition-colors'>
      <div className='container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10'>
        {/* Category Filter Pills & Search */}
        <div className='space-y-6'>
          {/* Category Filter Pills */}
          <div className='flex flex-wrap items-center justify-center gap-2.5'>
            {dynamicCategories.map((cat) => (
              <button
                key={cat}
                type='button'
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-primary text-white shadow-md shadow-primary/25 scale-105 ring-2 ring-primary/30'
                    : 'bg-gray-100 dark:bg-darklight text-midnight_text dark:text-gray-300 border border-border/60 dark:border-dark_border hover:border-primary'
                }`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Search Bar & Result Count */}
          <div className='flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 dark:bg-darklight p-4 rounded-2xl border border-border/60 dark:border-dark_border shadow-xs'>
            <div className='relative w-full sm:w-80'>
              <input
                type='text'
                placeholder='Search projects by title, stack, keyword...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border dark:border-dark_border bg-white dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary'
              />
              <svg
                className='w-4 h-4 text-gray-400 absolute left-3.5 top-3'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
              </svg>
            </div>

            <div className='text-xs text-gray-500 dark:text-gray-400 font-medium'>
              Showing <span className='font-bold text-dark dark:text-white'>{filteredProjects.length}</span> of {projects.length} projects
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className='text-center py-20 bg-gray-50 dark:bg-darklight rounded-3xl border border-dashed border-border dark:border-dark_border p-8'>
            <p className='text-base font-bold text-dark dark:text-white'>No projects match your search</p>
            <p className='text-xs text-gray-400 mt-1 mb-4'>Try selecting a different category or search term.</p>
            <button
              onClick={() => {
                setActiveCategory('All Projects')
                setSearchQuery('')
              }}
              className='px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl'>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7'>
            {filteredProjects.map((project) => (
              <ProjectCardItem
                key={project.id}
                project={project}
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </div>
        )}
      </div>

      {/* PROJECT DETAIL MODAL */}
      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  )
}

export default ProjectsList
