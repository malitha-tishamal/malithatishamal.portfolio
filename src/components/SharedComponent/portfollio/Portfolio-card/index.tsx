'use client'

import React, { useState, useEffect, useRef } from 'react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  PortfolioItem,
  defaultPortfolioItems,
  PortfolioSliderSettings,
  defaultPortfolioSliderSettings,
} from '@/types/portfolio'
import { PortfolioCardItem } from '@/components/portfolio/PortfolioCardItem'
import { PortfolioDetailModal } from '@/components/portfolio/PortfolioDetailModal'

const PortfolioCard: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)
  const [sliderSettings, setSliderSettings] = useState<PortfolioSliderSettings>(defaultPortfolioSliderSettings)

  const sliderRef = useRef<Slider | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef<boolean>(false)
  const [isInView, setIsInView] = useState<boolean>(false)
  const hasEnteredViewRef = useRef<boolean>(false)

  // Real-time Firestore sync for portfolio items (sorted strictly by displayOrder)
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
            // Strict numerical ascending sort by displayOrder (#1 first)
            fetched.sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0))
            setItems(fetched)
          } else {
            setItems(defaultPortfolioItems)
          }
          setLoading(false)
        },
        (error) => {
          console.warn('Homepage portfolio listener notice:', error.message)
          setItems(defaultPortfolioItems)
          setLoading(false)
        }
      )
      return () => unsubscribe()
    } catch (err) {
      console.error('Error setting up homepage portfolio listener:', err)
      setItems(defaultPortfolioItems)
      setLoading(false)
    }
  }, [])

  // Real-time Firestore sync for slider settings
  useEffect(() => {
    try {
      const unsubSettings = onSnapshot(
        doc(db, 'siteContent', 'portfolio'),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as Partial<PortfolioSliderSettings>
            setSliderSettings({
              autoplay: data.autoplay !== undefined ? data.autoplay : defaultPortfolioSliderSettings.autoplay,
              autoplaySpeed: Number(data.autoplaySpeed) || defaultPortfolioSliderSettings.autoplaySpeed,
              transitionSpeed: Number(data.transitionSpeed) || defaultPortfolioSliderSettings.transitionSpeed,
              pauseOnHover: data.pauseOnHover !== undefined ? data.pauseOnHover : defaultPortfolioSliderSettings.pauseOnHover,
            })
          }
        },
        (err) => console.warn('Portfolio slider settings listener:', err.message)
      )
      return () => unsubSettings()
    } catch (err) {
      console.warn('Portfolio slider settings error:', err)
    }
  }, [])

  // IntersectionObserver: Ensure when the user scrolls down to portfolio section,
  // card order #1 is always displayed first and autoplay only starts when visible.
  useEffect(() => {
    const target = containerRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            if (!hasEnteredViewRef.current) {
              hasEnteredViewRef.current = true
              // Always show Order #1 when user reaches this section from above
              sliderRef.current?.slickGoTo(0, true)
            }
          } else {
            // Pause autoplay when section is scrolled out of view
            setIsInView(false)
          }
        })
      },
      { threshold: 0.15 }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [items.length])

  const settings = {
    autoplay: isInView && sliderSettings.autoplay,
    autoplaySpeed: sliderSettings.autoplaySpeed,
    speed: sliderSettings.transitionSpeed,
    pauseOnHover: sliderSettings.pauseOnHover,
    dots: false,
    arrows: false, // Using our prominent custom left/right arrow buttons
    infinite: items.length > 2,
    initialSlide: 0,
    slidesToShow: Math.min(items.length, 4),
    slidesToScroll: 1,
    swipe: true,             // Touch swipe enabled
    swipeToSlide: true,      // Free hand-drag / flicking to slide
    draggable: true,         // Mouse drag on desktop enabled
    touchMove: true,         // Touch move tracking
    touchThreshold: 8,       // Super responsive to finger drag
    cssEase: 'ease-out',
    waitForAnimate: false,
    accessibility: true,
    beforeChange: () => {
      isDraggingRef.current = true
    },
    afterChange: () => {
      setTimeout(() => {
        isDraggingRef.current = false
      }, 80)
    },
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: Math.min(items.length, 3),
          slidesToScroll: 1,
          swipeToSlide: true,
        },
      },
      {
        breakpoint: 840,
        settings: {
          slidesToShow: Math.min(items.length, 2),
          slidesToScroll: 1,
          swipeToSlide: true,
        },
      },
      {
        breakpoint: 540,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          swipeToSlide: true,
        },
      },
    ],
  }

  if (loading) {
    return (
      <div id='portfolio' className='dark:bg-darkmode'>
        <div className='lg:px-9 m-auto px-4 max-w-[1600px] pb-12'>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className='rounded-3xl bg-gray-100 dark:bg-darklight p-5 h-84 animate-pulse border border-border/40 dark:border-dark_border/40 flex flex-col justify-between'
              >
                <div className='h-44 bg-gray-200 dark:bg-darkmode rounded-2xl w-full' />
                <div className='space-y-2.5 mt-4'>
                  <div className='h-4 bg-gray-200 dark:bg-darkmode rounded-md w-3/4' />
                  <div className='h-3 bg-gray-200 dark:bg-darkmode rounded-md w-1/2' />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div id='portfolio' className='dark:bg-darkmode'>
      <div
        ref={containerRef}
        className='relative lg:px-12 md:px-10 sm:px-8 px-4 m-auto max-w-[1600px] slider-container pb-12 select-none group'
      >
        {/* LEFT SCROLL ARROW BUTTON */}
        <button
          type='button'
          onClick={() => sliderRef.current?.slickPrev()}
          aria-label='Scroll Left'
          className='absolute left-1 sm:left-2 md:left-3 lg:left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white dark:bg-darklight text-red-600 dark:text-red-500 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white border-2 border-red-500/40 hover:border-red-600 shadow-xl shadow-red-500/25 hover:shadow-2xl hover:shadow-red-500/50 transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-90 backdrop-blur-md'
          title='Scroll Left'
        >
          <svg
            className='w-6 h-6 sm:w-7 sm:h-7 stroke-current stroke-[3.5] -translate-x-0.5'
            fill='none'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M15 19l-7-7 7-7' />
          </svg>
        </button>

        {/* RIGHT SCROLL ARROW BUTTON */}
        <button
          type='button'
          onClick={() => sliderRef.current?.slickNext()}
          aria-label='Scroll Right'
          className='absolute right-1 sm:right-2 md:right-3 lg:right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white dark:bg-darklight text-red-600 dark:text-red-500 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white border-2 border-red-500/40 hover:border-red-600 shadow-xl shadow-red-500/25 hover:shadow-2xl hover:shadow-red-500/50 transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-90 backdrop-blur-md'
          title='Scroll Right'
        >
          <svg
            className='w-6 h-6 sm:w-7 sm:h-7 stroke-current stroke-[3.5] translate-x-0.5'
            fill='none'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
          </svg>
        </button>

        {/* SLIDER CAROUSEL */}
        <Slider ref={sliderRef} {...settings}>
          {items.map((item, index) => (
            <div key={item.id || index} className='px-2.5 sm:px-4 py-5'>
              <PortfolioCardItem
                item={item}
                index={index}
                isStaggered={false}
                onClick={() => {
                  if (!isDraggingRef.current) {
                    setSelectedItem(item)
                  }
                }}
              />
            </div>
          ))}
        </Slider>
      </div>

      {/* DETAIL MODAL ON CARD CLICK */}
      <PortfolioDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  )
}

export default PortfolioCard
