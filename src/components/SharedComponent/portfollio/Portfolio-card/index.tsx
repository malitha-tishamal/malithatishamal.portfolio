'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  PortfolioItem,
  defaultPortfolioItems,
  PortfolioSliderSettings,
  defaultPortfolioSliderSettings,
} from '@/types/portfolio'
import { MarqueeRows } from '@/components/SharedComponent/MarqueeRows'
import { PortfolioCardItem } from '@/components/portfolio/PortfolioCardItem'
import { PortfolioDetailModal } from '@/components/portfolio/PortfolioDetailModal'

const LATEST_COUNT = 6
const MIN_SPEED = 40
const MAX_SPEED = 60

const getPortfolioKey = (item: PortfolioItem) => item.id
const getPortfolioUpdatedAt = (item: PortfolioItem) => item.updatedAt || item.createdAt

const PortfolioCard: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)
  const [speed, setSpeed] = useState<number>(defaultPortfolioSliderSettings.speed)

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

  // Admin-controlled continuous scroll speed (clamped to the 40–60 px/s band)
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        doc(db, 'siteContent', 'portfolio'),
        (snap) => {
          if (!snap.exists()) return
          const data = snap.data() as Partial<PortfolioSliderSettings>
          const next = Number(data.speed)
          if (Number.isFinite(next)) {
            setSpeed(Math.min(MAX_SPEED, Math.max(MIN_SPEED, next)))
          }
        },
        (err) => console.warn('Portfolio marquee settings listener:', err.message)
      )
      return () => unsubscribe()
    } catch (err) {
      console.warn('Portfolio marquee settings error:', err)
    }
  }, [])

  const handleOpen = useCallback((item: PortfolioItem) => {
    setSelectedItem(item)
  }, [])

  return (
    <div className='dark:bg-darkmode'>
      <div className='relative m-auto max-w-[1600px] pb-2 sm:px-4 lg:px-8'>
        <MarqueeRows<PortfolioItem>
          items={items}
          renderCard={(item, ctx) => (
            <PortfolioCardItem item={item} latestLabel={ctx.latestLabel} onOpen={handleOpen} />
          )}
          getKey={getPortfolioKey}
          getUpdatedAt={getPortfolioUpdatedAt}
          latestCount={LATEST_COUNT}
          speed={speed}
          loading={loading}
          skeletonCount={8}
          metaRow
          ariaLabel='Portfolio showcase'
          emptyState={
            <div className='px-6'>
              <p className='text-base font-bold text-dark dark:text-white'>No portfolio items yet</p>
              <p className='mt-1 text-xs text-gray-400'>New work will appear here automatically.</p>
            </div>
          }
        />
      </div>

      <PortfolioDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  )
}

export default PortfolioCard
