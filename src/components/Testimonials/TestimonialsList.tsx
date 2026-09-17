'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { TestimonialItem, defaultTestimonials } from '@/types/testimonial'
import { getImgPath } from '@/utils/image'
import { AddReviewModal } from '@/components/SharedComponent/Testimonial/AddReviewModal'

export const TestimonialsList: React.FC = () => {
  const [items, setItems] = useState<TestimonialItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Real-time Firestore sync
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'testimonials'),
        (snapshot) => {
          if (!snapshot.empty) {
            const fetched: TestimonialItem[] = []
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as TestimonialItem
              if (data.status !== 'rejected') {
                fetched.push({
                  ...data,
                  id: docSnap.id,
                })
              }
            })
            fetched.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
            setItems(fetched)
          } else {
            setItems([])
          }
          setLoading(false)
        },
        (error) => {
          console.warn('Firestore testimonials listener notice:', error.message)
          setItems([])
          setLoading(false)
        }
      )
      return () => unsubscribe()
    } catch (err) {
      console.error('Error setting up testimonials listener:', err)
      setItems([])
      setLoading(false)
    }
  }, [])

  // Calculate average rating
  const avgRating =
    items.length > 0
      ? (
          items.reduce((sum, item) => sum + (Number(item.rating) || 5), 0) /
          items.length
        ).toFixed(1)
      : '5.0'

  // Filtered items
  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      item.name?.toLowerCase().includes(q) ||
      item.role?.toLowerCase().includes(q) ||
      item.company?.toLowerCase().includes(q) ||
      item.content?.toLowerCase().includes(q)

    const matchesRating =
      ratingFilter === 'all'
        ? true
        : ratingFilter === 5
        ? (item.rating || 5) === 5
        : (item.rating || 5) >= ratingFilter

    return matchesSearch && matchesRating
  })

  return (
    <section className='py-12 sm:py-16 dark:bg-darkmode bg-white transition-colors'>
      <div className='container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10'>
        {/* Rating Overview Summary Banner */}
        <div className='bg-gradient-to-r from-blue-600 to-indigo-700 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6'>
          <div className='flex items-center gap-5'>
            <div className='text-5xl sm:text-6xl font-black tracking-tight'>
              {avgRating}
            </div>
            <div>
              <div className='flex items-center text-amber-300 text-xl'>
                {'★'.repeat(5)}
              </div>
              <p className='text-white/80 text-xs sm:text-sm font-medium mt-0.5'>
                Based on <span className='font-bold text-white'>{items.length}+ verified</span> client reviews
              </p>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <span className='px-3.5 py-1.5 rounded-full bg-white/20 text-xs font-bold backdrop-blur-xs'>
              ✓ 100% Client Satisfaction
            </span>
            <button
              type='button'
              onClick={() => setIsAddModalOpen(true)}
              className='px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer'>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M12 4v16m8-8H4' />
              </svg>
              <span>Write a Review</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className='flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 dark:bg-darklight p-4 rounded-2xl border border-border/60 dark:border-dark_border shadow-xs'>
          <div className='relative w-full sm:w-80'>
            <input
              type='text'
              placeholder='Search reviews by name, keyword...'
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

          {/* Rating Filters */}
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setRatingFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                ratingFilter === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white dark:bg-darkmode text-gray-600 dark:text-gray-300 border border-border dark:border-dark_border'
              }`}>
              All ({items.length})
            </button>
            <button
              type='button'
              onClick={() => setRatingFilter(5)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                ratingFilter === 5
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white dark:bg-darkmode text-gray-600 dark:text-gray-300 border border-border dark:border-dark_border'
              }`}>
              <span>5 Stars</span>
              <span className='text-amber-400'>★</span>
            </button>
          </div>
        </div>

        {/* Testimonials Grid */}
        {loading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className='p-6 sm:p-7 rounded-3xl bg-white dark:bg-darklight border border-border/70 dark:border-dark_border shadow-xs animate-pulse flex flex-col justify-between h-64'
              >
                <div>
                  <div className='flex gap-1 mb-4'>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} className='w-4 h-4 rounded-full bg-gray-200 dark:bg-darkmode' />
                    ))}
                  </div>
                  <div className='space-y-2'>
                    <div className='h-3.5 bg-gray-200 dark:bg-darkmode rounded-md w-full' />
                    <div className='h-3.5 bg-gray-200 dark:bg-darkmode rounded-md w-5/6' />
                    <div className='h-3.5 bg-gray-200 dark:bg-darkmode rounded-md w-3/4' />
                  </div>
                </div>
                <div className='flex items-center gap-3 pt-4 border-t border-border/40 dark:border-dark_border/40'>
                  <div className='w-11 h-11 rounded-full bg-gray-200 dark:bg-darkmode shrink-0' />
                  <div className='space-y-1.5 flex-1'>
                    <div className='h-3.5 bg-gray-200 dark:bg-darkmode rounded-md w-1/2' />
                    <div className='h-2.5 bg-gray-200 dark:bg-darkmode rounded-md w-1/3' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className='text-center py-20 bg-white dark:bg-darklight rounded-3xl border border-dashed border-border dark:border-dark_border p-8'>
            <p className='text-base font-bold text-dark dark:text-white'>No testimonials found</p>
            <p className='text-xs text-gray-400 mt-1 mb-4'>Try clearing filters or search terms.</p>
            <button
              onClick={() => {
                setRatingFilter('all')
                setSearchQuery('')
              }}
              className='px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl'>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredItems.map((item) => (
              <div
                key={item.id}
              className='p-6 sm:p-7 rounded-3xl bg-white dark:bg-darklight border border-border/70 dark:border-dark_border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group hover:-translate-y-1'>
              {/* Accent Top Border */}
              <div className='absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-primary to-blue-400 rounded-b-md'></div>

              <div>
                {/* Stars */}
                <div className='flex items-center gap-1 mb-4 pt-1'>
                  {[...Array(item.rating || 5)].map((_, si) => (
                    <span key={si} className='text-amber-400 text-lg leading-none'>
                      ★
                    </span>
                  ))}
                </div>

                {/* Review Text */}
                <p className='text-xs sm:text-sm text-midnight_text dark:text-gray-200 leading-relaxed italic mb-6'>
                  &ldquo;{item.content}&rdquo;
                </p>
              </div>

              {/* Client Profile */}
              <div className='flex items-center gap-3.5 pt-4 border-t border-border/40 dark:border-dark_border/40 mt-auto'>
                {item.avatarUrl ? (
                  <div className='relative w-11 h-11 rounded-full overflow-hidden border border-border dark:border-dark_border shrink-0'>
                    <Image
                      src={getImgPath(item.avatarUrl)}
                      alt={item.name}
                      fill
                      unoptimized
                      className='object-cover'
                    />
                  </div>
                ) : (
                  <div className='w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs'>
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className='overflow-hidden'>
                  <h4 className='text-sm font-bold text-midnight_text dark:text-white truncate'>
                    {item.name}
                  </h4>
                  <p className='text-[11px] text-grey dark:text-gray-400 font-medium truncate'>
                    {item.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* ADD REVIEW MODAL */}
      <AddReviewModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </section>
  )
}

export default TestimonialsList
