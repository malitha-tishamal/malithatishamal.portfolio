'use client'

import React, { useState, useEffect } from 'react'
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

  // Real-time Firestore sync for portfolio items
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

  const settings = {
    autoplay: sliderSettings.autoplay,
    autoplaySpeed: sliderSettings.autoplaySpeed,
    speed: sliderSettings.transitionSpeed,
    pauseOnHover: sliderSettings.pauseOnHover,
    dots: false,
    arrows: false,
    infinite: items.length > 3,
    slidesToShow: Math.min(items.length, 5),
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1320,
        settings: {
          slidesToShow: Math.min(items.length, 4),
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(items.length, 3),
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: Math.min(items.length, 2),
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
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
      <div className='lg:px-9 m-auto px-0 max-w-[1600px] slider-container pb-12'>
        <Slider {...settings}>
          {items.map((item, index) => (
            <div key={item.id || index} className='px-3.5 py-4'>
              <PortfolioCardItem
                item={item}
                index={index}
                isStaggered={true}
                onClick={() => setSelectedItem(item)}
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
