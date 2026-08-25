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
  const [items, setItems] = useState<PortfolioItem[]>(defaultPortfolioItems)
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
