'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { TestimonialItem, defaultTestimonials } from '@/types/testimonial'
import { getImgPath } from '@/utils/image'
import { AddReviewModal } from './AddReviewModal'

const Testimonial: React.FC = () => {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(defaultTestimonials)
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
            setTestimonials(fetched.length > 0 ? fetched : defaultTestimonials)
          } else {
            setTestimonials(defaultTestimonials)
          }
        },
        (error) => {
          console.warn('Firestore testimonials listener notice:', error.message)
          setTestimonials(defaultTestimonials)
        }
      )
      return () => unsubscribe()
    } catch (err) {
      console.error('Error setting up testimonials listener:', err)
      setTestimonials(defaultTestimonials)
    }
  }, [])

  // Calculate average rating
  const avgRating =
    testimonials.length > 0
      ? (
          testimonials.reduce((sum, item) => sum + (Number(item.rating) || 5), 0) /
          testimonials.length
        ).toFixed(1)
      : '5.0'

  const sliderSettings = {
    autoplay: true,
    autoplaySpeed: 5000,
    dots: true,
    arrows: false,
    infinite: testimonials.length > 1,
    speed: 600,
    slidesToShow: Math.min(testimonials.length, 2),
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  }

  return (
    <section
      id='testimonials'
      className='scroll-mt-24 py-16 sm:py-24 bg-[#F8FAFC] dark:bg-darklight transition-colors relative overflow-hidden'>
      {/* Background Decorative Blur */}
      <div className='absolute top-0 right-0 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl pointer-events-none'></div>
      <div className='absolute bottom-0 left-0 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl pointer-events-none'></div>

      <div className='container mx-auto max-w-6xl px-4 sm:px-6 relative z-10'>
        {/* Section Header */}
        <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12'>
          <div>
            <div className='flex items-center gap-3 mb-2'>
              <h2 className='text-3xl sm:text-4xl font-extrabold text-midnight_text dark:text-white'>
                Testimonials
              </h2>
              <div className='h-1 w-16 bg-primary rounded-full'></div>
            </div>
            <p className='text-sm sm:text-base text-grey dark:text-gray-300 font-medium max-w-xl'>
              What my clients and partners say about our collaboration and results.
            </p>
          </div>

          {/* Action Buttons: View All & Add Testimonial */}
          <div className='shrink-0 flex items-center gap-3'>
            <Link
              href='/testimonials'
              className='px-4 py-2.5 rounded-xl border border-primary text-primary hover:bg-primary hover:text-white dark:border-blue-400 dark:text-blue-400 dark:hover:bg-primary dark:hover:text-white transition duration-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs'>
              <span>View All</span>
              <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M14 5l7 7m0 0l-7 7m7-7H3' />
              </svg>
            </Link>

            <button
              type='button'
              onClick={() => setIsAddModalOpen(true)}
              className='px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition flex items-center gap-2 cursor-pointer'>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M12 4v16m8-8H4' />
              </svg>
              <span>Write a Review</span>
            </button>
          </div>
        </div>

        {/* Testimonials Showcase Grid / Slider */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
          {/* Main Slider (Left/Center Column) */}
          <div className='lg:col-span-8 space-y-6'>
            {testimonials.length === 1 ? (
              /* Single Testimonial Card */
              <div className='p-6 sm:p-8 rounded-3xl bg-white dark:bg-darkmode border border-border/70 dark:border-dark_border shadow-lg hover:shadow-xl transition-all duration-300 relative'>
                {/* Accent Top Border */}
                <div className='absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-primary to-blue-400 rounded-b-md'></div>

                {/* Star Rating */}
                <div className='flex items-center gap-1 mb-4 pt-1'>
                  {[...Array(testimonials[0].rating || 5)].map((_, si) => (
                    <span key={si} className='text-amber-400 text-lg leading-none'>
                      ★
                    </span>
                  ))}
                </div>

                {/* Review Quote Text */}
                <p className='text-sm sm:text-base text-midnight_text dark:text-gray-200 leading-relaxed italic mb-6'>
                  &ldquo;{testimonials[0].content}&rdquo;
                </p>

                {/* Client Profile Info */}
                <div className='flex items-center gap-3.5 pt-4 border-t border-border/40 dark:border-dark_border/40'>
                  {testimonials[0].avatarUrl ? (
                    <div className='relative w-12 h-12 rounded-full overflow-hidden border border-border dark:border-dark_border shrink-0'>
                      <Image
                        src={getImgPath(testimonials[0].avatarUrl)}
                        alt={testimonials[0].name}
                        fill
                        unoptimized
                        className='object-cover'
                      />
                    </div>
                  ) : (
                    <div className='w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs'>
                      {testimonials[0].name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h4 className='text-sm sm:text-base font-bold text-midnight_text dark:text-white'>
                      {testimonials[0].name}
                    </h4>
                    <p className='text-xs text-grey dark:text-gray-400 font-medium line-clamp-1'>
                      {testimonials[0].role}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Multi Testimonials Slider */
              <div className='testimonial-slider-container'>
                <Slider {...sliderSettings}>
                  {testimonials.map((item) => (
                    <div key={item.id} className='px-2.5 py-2'>
                      <div className='p-6 sm:p-8 rounded-3xl bg-white dark:bg-darkmode border border-border/70 dark:border-dark_border shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between relative min-h-[300px]'>
                        {/* Accent Top Border */}
                        <div className='absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-primary to-blue-400 rounded-b-md'></div>

                        <div>
                          {/* Star Rating */}
                          <div className='flex items-center gap-1 mb-4 pt-1'>
                            {[...Array(item.rating || 5)].map((_, si) => (
                              <span key={si} className='text-amber-400 text-lg leading-none'>
                                ★
                              </span>
                            ))}
                          </div>

                          {/* Review Quote Text */}
                          <p className='text-xs sm:text-sm text-midnight_text dark:text-gray-200 leading-relaxed italic mb-6 line-clamp-6'>
                            &ldquo;{item.content}&rdquo;
                          </p>
                        </div>

                        {/* Client Profile Info */}
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
                    </div>
                  ))}
                </Slider>
              </div>
            )}
          </div>

          {/* Overall Rating Summary Card (Right Column Widget) */}
          <div className='lg:col-span-4 flex flex-col items-center justify-center'>
            <div className='w-full max-w-sm p-6 sm:p-8 rounded-3xl bg-white dark:bg-darkmode border border-border/70 dark:border-dark_border shadow-lg text-center space-y-4'>
              {/* Rating Big Number */}
              <div className='text-5xl sm:text-6xl font-black text-midnight_text dark:text-white tracking-tight'>
                {avgRating}
              </div>

              {/* Star row */}
              <div className='flex items-center justify-center gap-1.5'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className='text-amber-400 text-2xl leading-none'>
                    ★
                  </span>
                ))}
              </div>

              {/* Count note */}
              <p className='text-xs font-semibold text-grey dark:text-gray-300'>
                Based on <span className='font-bold text-midnight_text dark:text-white'>{testimonials.length}+</span> client reviews
              </p>

              {/* Verified Badge */}
              <div className='pt-2'>
                <span className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-xs font-bold border border-blue-200/60 dark:border-blue-900/60'>
                  <svg className='w-3.5 h-3.5 text-blue-600 dark:text-blue-400' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                  </svg>
                  <span>100% Verified Clients</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* USER SUBMISSION MODAL */}
      <AddReviewModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </section>
  )
}

export default Testimonial
