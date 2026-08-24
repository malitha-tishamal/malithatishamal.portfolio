'use client'

import { useState, useEffect } from 'react'
import { getImgPath } from '@/utils/image'
import Image from 'next/image'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { HeroContent, defaultHeroContent } from '@/types/hero'

const Hero = () => {
  const [heroData, setHeroData] = useState<HeroContent>(defaultHeroContent)
  const [isCvModalOpen, setIsCvModalOpen] = useState(false)

  // Real-time Firestore sync with defaultHeroContent fallback
  useEffect(() => {
    try {
      const docRef = doc(db, 'siteContent', 'hero')
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setHeroData({
              ...defaultHeroContent,
              ...(docSnap.data() as HeroContent),
            })
          }
        },
        (error) => {
          // Gracefully keep defaultHeroContent without throwing uncaught errors
          console.warn('Firestore hero listener notice:', error.message)
        }
      )
      return () => unsubscribe()
    } catch (err) {
      console.error('Error setting up hero listener:', err)
    }
  }, [])

  const handleDownloadCv = (url?: string, fileName?: string) => {
    if (!url || url === '#' || url === '') {
      alert('CV document will be uploaded shortly by administrator. Please contact directly.')
      return
    }
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.download = fileName || 'Malitha_Tishamal_CV.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setIsCvModalOpen(false)
  }

  return (
    <section className='relative md:pt-44 pt-28 bg-white dark:bg-darklight bg-cover text-white transition-colors'>
      <div className='container mx-auto max-w-6xl px-4 grid grid-cols-12 gap-6 relative z-10 items-center'>
        {/* Left Column: Headlines, Buttons, Signature & Contact Note */}
        <div
          className='md:col-span-6 col-span-12 p-4 md:px-4 px-0 space-y-5 flex flex-col items-start justify-center'
          data-aos='fade-right'
          data-aos-delay='200'
          data-aos-duration='1000'>
          {/* Badge */}
          <div className='flex gap-2 items-center'>
            <span className='w-3 h-3 rounded-full bg-success animate-pulse'></span>
            <span className='font-medium text-midnight_text text-sm dark:text-white/70'>
              {heroData.badgeText || 'build everything'}
            </span>
          </div>

          {/* Main Title */}
          <h1 className='text-midnight_text font-bold dark:text-white text-4xl md:text-5xl md:leading-[1.15]'>
            {heroData.title || 'Unveiling My Professional Odyssey: Portfolio Highlights'}
          </h1>

          {/* Subtitle / Description */}
          <p className='text-grey dark:text-white/70 text-lg sm:text-xl font-medium'>
            {heroData.description || 'A brief introduction about myself and my professional objectives.'}
          </p>

          {/* Action Buttons: Get Started & Download CV */}
          <div className='flex flex-wrap items-center gap-3.5 pt-2'>
            <a
              href={heroData.getStartedLink || '#contact-section'}
              className='py-3.5 px-8 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition duration-300 shadow-md shadow-blue-500/20 hover:shadow-lg'>
              {heroData.getStartedText || 'Get Started'}
            </a>

            <button
              type='button'
              onClick={() => setIsCvModalOpen(true)}
              className='py-3.5 px-6 rounded-xl border border-primary text-primary hover:bg-primary hover:text-white dark:border-blue-400 dark:text-blue-400 dark:hover:bg-primary dark:hover:text-white transition duration-300 font-semibold flex items-center gap-2 cursor-pointer shadow-xs'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
              </svg>
              <span>Download CV</span>
            </button>
          </div>

          {/* Signature & Need Help section */}
          <div className='flex flex-wrap sm:flex-nowrap items-center mt-6 gap-4 pt-2'>
            {/* Signature Image (Balanced and Scaled) */}
            <div className='shrink-0 bg-transparent flex items-center'>
              <Image
                src={getImgPath(heroData.signatureImageUrl || '/images/hero/signature.png')}
                alt='Malitha Tishan Signature'
                width={170}
                height={55}
                quality={100}
                unoptimized
                className='h-11 w-auto object-contain dark:invert opacity-90 hover:opacity-100 transition-all'
              />
            </div>

            <div className='hidden sm:block h-10 w-px bg-border dark:bg-dark_border'></div>

            {/* Need Help text */}
            <div>
              <p className='text-sm font-normal text-grey dark:text-gray-300 max-w-56 leading-snug'>
                Need help?{' '}
                <a href='#contact-section' className='text-primary hover:text-blue-700 font-semibold underline'>
                  Contact Me
                </a>{' '}
                Tell about your project
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Portrait Image */}
        <div className="md:col-span-6 col-span-12 relative flex justify-center items-center before:absolute before:content-[''] before:bg-[url('/images/hero/line-leyar.svg')] before:bg-no-repeat before:left-1/2 before:top-0 before:h-24 before:w-52 before:-z-10 before:translate-x-70% before:-translate-y-40% lg:before:inline-block before:hidden after:absolute after:content-[''] after:bg-[url('/images/hero/round-leyar.svg')] after:bg-no-repeat xl:after:inline-block after:hidden after:left-0 after:bottom-0 after:h-6.25 after:w-6.25 after:-z-10 after:-translate-x-1/2 after:translate-y-1/2">
          <div className="overflow-hidden rounded-3xl max-w-[460px] w-full aspect-square shadow-2xl border-4 border-white/10 dark:border-white/5 relative">
            <Image
              src={getImgPath(heroData.heroImageUrl || '/images/hero/malitha-hero.png')}
              alt='Malitha Tishamal'
              width={460}
              height={460}
              quality={100}
              priority
              unoptimized
              className="w-full h-full object-cover object-top rounded-3xl"
            />
          </div>
        </div>
      </div>

      {/* DOWNLOAD CV MODAL */}
      {isCvModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCvModalOpen(false)
          }}
          className='fixed inset-0 top-0 left-0 w-full h-full bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-opacity'>
          <div className='relative mx-auto w-full max-w-lg rounded-2xl bg-white p-7 text-left shadow-2xl dark:bg-darklight border border-border/50 dark:border-dark_border/50 animate-in fade-in zoom-in duration-150'>
            {/* Close Button */}
            <button
              onClick={() => setIsCvModalOpen(false)}
              className='hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-dark dark:text-gray-300 dark:hover:text-white transition'
              aria-label='Close CV Modal'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>

            {/* Modal Header */}
            <div className='mb-6'>
              <div className='w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold mb-3'>
                📄
              </div>
              <h3 className='text-xl font-bold text-dark dark:text-white'>
                Download Curriculum Vitae (CV)
              </h3>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                Select the format that best suits your evaluation or hiring workflow.
              </p>
            </div>

            {/* CV Format Option Cards */}
            <div className='space-y-4'>
              {/* Option 1: ATS CV */}
              <div
                onClick={() => handleDownloadCv(heroData.atsCvUrl, heroData.atsCvFileName || 'Malitha_Tishamal_ATS_CV.pdf')}
                className='group p-5 rounded-xl border border-border dark:border-dark_border hover:border-blue-500 dark:hover:border-blue-500 bg-gray-50/50 dark:bg-darkmode/50 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition cursor-pointer flex items-start justify-between gap-4'>
                <div className='space-y-1 flex-1'>
                  <div className='flex items-center gap-2'>
                    <h4 className='text-base font-bold text-dark dark:text-white group-hover:text-primary transition'>
                      ATS CV
                    </h4>
                    <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'>
                      Recommended
                    </span>
                  </div>
                  <p className='text-xs font-semibold text-primary dark:text-blue-400'>
                    → LinkedIn / Job portals / Company applications
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-400 pt-1'>
                    Clean, single-column format optimized for applicant tracking systems, ATS scanners, and corporate recruitment.
                  </p>
                </div>
                <div className='w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-110 transition-transform shadow-xs'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                  </svg>
                </div>
              </div>

              {/* Option 2: Graphical / Creative CV */}
              <div
                onClick={() => handleDownloadCv(heroData.creativeCvUrl, heroData.creativeCvFileName || 'Malitha_Tishamal_Creative_CV.pdf')}
                className='group p-5 rounded-xl border border-border dark:border-dark_border hover:border-purple-500 dark:hover:border-purple-500 bg-gray-50/50 dark:bg-darkmode/50 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition cursor-pointer flex items-start justify-between gap-4'>
                <div className='space-y-1 flex-1'>
                  <div className='flex items-center gap-2'>
                    <h4 className='text-base font-bold text-dark dark:text-white group-hover:text-purple-600 transition'>
                      CV 02 — Graphical/Creative CV
                    </h4>
                    <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'>
                      Visual
                    </span>
                  </div>
                  <p className='text-xs font-semibold text-purple-600 dark:text-purple-400'>
                    → Creative / Portfolio / Direct presentation
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-400 pt-1'>
                    Modern visual layout showcasing full stack development, UI design, tech stacks, and project highlights.
                  </p>
                </div>
                <div className='w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-110 transition-transform shadow-xs'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Hero
