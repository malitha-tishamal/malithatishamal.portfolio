'use client'

import React, { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  PortfolioItem,
  defaultPortfolioItems,
  PORTFOLIO_CATEGORIES,
} from '@/types/portfolio'
import { PortfolioCardItem } from '@/components/portfolio/PortfolioCardItem'
import { PortfolioDetailModal } from '@/components/portfolio/PortfolioDetailModal'

const normalizeCategory = (cat: string): string => {
  const c = cat.trim()
  if (c === 'Health & Lifestyle Community' || c === 'Events & wins' || c === 'Events , wins & Achivements') {
    return 'Events'
  }
  return c
}

const PortfolioList: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('All Photos')

  // Real-time Firestore sync
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'portfolio'),
        (snapshot) => {
          if (!snapshot.empty) {
            const fetched: PortfolioItem[] = []
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as PortfolioItem
              fetched.push({
                ...data,
                id: docSnap.id,
                subtitle: normalizeCategory(data.subtitle || 'Events'),
              })
            })
            fetched.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
            setItems(fetched)
          } else {
            setItems([])
          }
          setLoading(false)
        },
        (error) => {
          console.warn('Firestore portfolio listener notice:', error.message)
          setItems([])
          setLoading(false)
        }
      )
      return () => unsubscribe()
    } catch (err) {
      console.error('Error setting up portfolio listener:', err)
      setItems([])
      setLoading(false)
    }
  }, [])

  // Excluded obsolete categories
  const excludedCategories = new Set([
    'health & lifestyle community',
    'events & wins',
    'events , wins & achivements',
    'designation',
  ])

  // Combine standard categories and any valid custom categories in database
  const dynamicCategories = Array.from(
    new Set([
      ...PORTFOLIO_CATEGORIES,
      ...items
        .map((i) => normalizeCategory(i.subtitle || ''))
        .filter((cat) => cat && !excludedCategories.has(cat.toLowerCase())),
    ])
  )

  // Filter items based on active category
  const filteredItems =
    activeCategory === 'All Photos' || activeCategory === 'All'
      ? items
      : items.filter((i) => {
          const cat = normalizeCategory(i.subtitle || '').toLowerCase()
          const target = activeCategory.toLowerCase().trim()
          return (
            cat === target ||
            cat.includes(target) ||
            i.tags?.some((t) => t.toLowerCase() === target)
          )
        })

  return (
    <section id='portfolio' className='md:pb-20 pb-12 pt-2 dark:bg-darkmode bg-white transition-colors'>
      <div className='container mx-auto max-w-[120rem] px-4 sm:px-6 lg:px-8'>
        {/* Category Filter Pills (All Photos, Events, Wins & Achivements, Office, Training Programs, Travel) */}
        <div className='flex flex-wrap items-center justify-center gap-2.5 mb-10'>
          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              type='button'
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105 ring-2 ring-primary/30'
                  : 'bg-gray-100 dark:bg-darklight text-midnight_text dark:text-gray-300 border border-border/60 dark:border-dark_border hover:border-primary'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Portfolio Cards Grid */}
        {loading ? (
          <div className='flex flex-wrap gap-6 lg:gap-10 justify-center items-start m-auto'>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className='rounded-3xl bg-gray-100 dark:bg-darklight p-5 w-72 h-96 animate-pulse border border-border/40 dark:border-dark_border/40 flex flex-col justify-between'
              >
                <div className='h-52 bg-gray-200 dark:bg-darkmode rounded-2xl w-full' />
                <div className='space-y-3 mt-4'>
                  <div className='h-4 bg-gray-200 dark:bg-darkmode rounded-md w-3/4' />
                  <div className='h-3 bg-gray-200 dark:bg-darkmode rounded-md w-1/2' />
                  <div className='h-3 bg-gray-200 dark:bg-darkmode rounded-md w-1/3' />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className='flex flex-wrap gap-6 lg:gap-10 justify-center items-start m-auto'>
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
        ) : (
          <div className='text-center py-20 bg-gray-50 dark:bg-darklight rounded-3xl border border-dashed border-border dark:border-dark_border p-8 max-w-lg mx-auto'>
            <div className='w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl'>
              📷
            </div>
            <p className='text-base font-bold text-dark dark:text-white'>No portfolio items found</p>
            <p className='text-xs text-gray-400 mt-1 mb-4'>No photos found under the &quot;{activeCategory}&quot; category.</p>
            <button
              onClick={() => setActiveCategory('All Photos')}
              className='px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition'>
              Show All Photos
            </button>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      <PortfolioDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </section>
  )
}

export default PortfolioList
