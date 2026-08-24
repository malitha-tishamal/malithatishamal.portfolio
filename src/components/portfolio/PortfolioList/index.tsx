'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { PortfolioItem, defaultPortfolioItems } from '@/types/portfolio'
import { PortfolioCardItem } from '@/components/portfolio/PortfolioCardItem'
import { getImgPath } from '@/utils/image'

const PortfolioList: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[]>(defaultPortfolioItems)
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('All')

  // Real-time Firestore sync
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'portfolio'),
        (snapshot) => {
          if (!snapshot.empty) {
            const fetched: PortfolioItem[] = []
            snapshot.forEach((docSnap) => {
              fetched.push({
                ...(docSnap.data() as PortfolioItem),
                id: docSnap.id,
              })
            })
            fetched.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
            setItems(fetched)
          } else {
            setItems(defaultPortfolioItems)
          }
        },
        (error) => {
          console.warn('Firestore portfolio listener notice:', error.message)
          setItems(defaultPortfolioItems)
        }
      )
      return () => unsubscribe()
    } catch (err) {
      console.error('Error setting up portfolio listener:', err)
      setItems(defaultPortfolioItems)
    }
  }, [])

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

  // Extract distinct categories
  const categories = ['All', ...Array.from(new Set(items.map((i) => i.subtitle).filter(Boolean)))]

  // Filter items
  const filteredItems =
    activeCategory === 'All'
      ? items
      : items.filter((i) => i.subtitle?.toLowerCase() === activeCategory.toLowerCase())

  return (
    <section id='portfolio' className='md:pb-28 pb-16 pt-8 dark:bg-darkmode bg-white transition-colors'>
      <div className='container mx-auto max-w-[120rem] px-4 sm:px-6 lg:px-8'>
        {/* Category Filter Pills */}
        {categories.length > 2 && (
          <div className='flex flex-wrap items-center justify-center gap-2 mb-14'>
            {categories.map((cat) => (
              <button
                key={cat}
                type='button'
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                    : 'bg-gray-100 dark:bg-darklight text-midnight_text dark:text-gray-300 border border-border/60 dark:border-dark_border hover:border-primary'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Portfolio Cards Grid (Preserves the beautiful staggered layout) */}
        <div className='flex flex-wrap gap-8 lg:gap-12 justify-center items-start m-auto'>
          {filteredItems.map((item, index) => (
            <PortfolioCardItem
              key={item.id || index}
              item={item}
              index={index}
              isStaggered={true}
              onClick={() => setSelectedItem(item)}
            />
          ))}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedItem(null)
          }}
          className='fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200'>
          <div className='relative w-full max-w-3xl bg-white dark:bg-darklight rounded-3xl p-6 sm:p-8 border border-border/60 dark:border-dark_border shadow-2xl my-8 text-midnight_text dark:text-white max-h-[90vh] overflow-y-auto'>
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className='absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-darkmode cursor-pointer'
              aria-label='Close Modal'>
              ✕
            </button>

            {/* Modal Header */}
            <div className='mb-4'>
              <span className='px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20'>
                {selectedItem.subtitle || 'Portfolio Project'}
              </span>
              <h2 className='text-2xl sm:text-3xl font-bold text-midnight_text dark:text-white mt-2'>
                {selectedItem.title}
              </h2>
              <div className='flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1'>
                <span>Last Updated: {formatDate(selectedItem.updatedAt || selectedItem.createdAt)}</span>
                {selectedItem.displayOrder && <span>Priority: #{selectedItem.displayOrder}</span>}
              </div>
            </div>

            {/* Images Showcase in Modal */}
            <div className='space-y-3 mb-6'>
              {selectedItem.images && selectedItem.images.length > 0 ? (
                <div
                  className={`grid gap-3 ${
                    selectedItem.images.length === 1
                      ? 'grid-cols-1'
                      : selectedItem.images.length === 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-2'
                  }`}>
                  {selectedItem.images.map((img, i) => (
                    <div key={i} className='relative h-60 rounded-2xl overflow-hidden border border-border/60 dark:border-dark_border bg-gray-100 dark:bg-darkmode'>
                      <Image
                        src={getImgPath(img)}
                        alt={`${selectedItem.title} ${i + 1}`}
                        fill
                        unoptimized
                        className='object-cover hover:scale-105 transition duration-300'
                      />
                      <span className='absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full'>
                        #{i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Description */}
            {selectedItem.description && (
              <div className='mb-6'>
                <h4 className='text-sm font-bold uppercase tracking-wider text-gray-400 mb-1.5'>
                  Overview
                </h4>
                <p className='text-sm sm:text-base text-grey dark:text-gray-300 leading-relaxed'>
                  {selectedItem.description}
                </p>
              </div>
            )}

            {/* Tech Stack Tags */}
            {selectedItem.tags && selectedItem.tags.length > 0 && (
              <div className='mb-6'>
                <h4 className='text-sm font-bold uppercase tracking-wider text-gray-400 mb-2'>
                  Technologies & Skills
                </h4>
                <div className='flex flex-wrap gap-2'>
                  {selectedItem.tags.map((t, ti) => (
                    <span
                      key={ti}
                      className='text-xs font-semibold px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50'>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* External Links */}
            <div className='flex flex-wrap items-center gap-3 pt-4 border-t border-border/40 dark:border-dark_border/40'>
              {selectedItem.projectUrl && (
                <a
                  href={selectedItem.projectUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' />
                  </svg>
                  <span>Live Project Demo</span>
                </a>
              )}

              {selectedItem.githubUrl && (
                <a
                  href={selectedItem.githubUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-gray-800 dark:hover:bg-gray-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2'>
                  <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                    <path fillRule='evenodd' clipRule='evenodd' d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z' />
                  </svg>
                  <span>Source Code</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PortfolioList
