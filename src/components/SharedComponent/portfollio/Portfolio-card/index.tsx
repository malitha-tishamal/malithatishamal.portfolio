'use client'

import React, { useState, useEffect } from 'react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { PortfolioItem, defaultPortfolioItems } from '@/types/portfolio'
import { PortfolioCardItem } from '@/components/portfolio/PortfolioCardItem'
import { PortfolioDetailModal } from '@/components/portfolio/PortfolioDetailModal'

const PortfolioCard: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[]>(defaultPortfolioItems)
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)

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
          console.warn('Homepage portfolio listener notice:', error.message)
          setItems(defaultPortfolioItems)
        }
      )
      return () => unsubscribe()
    } catch (err) {
      console.error('Error setting up homepage portfolio listener:', err)
      setItems(defaultPortfolioItems)
    }
  }, [])

  const settings = {
    autoplay: true,
    dots: false,
    arrows: false,
    infinite: items.length > 3,
    speed: 600,
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
