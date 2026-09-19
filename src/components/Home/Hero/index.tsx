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

  // Social Links List with Full Solid Brand Colors
  const socialLinks = [
    {
      id: 'linkedin',
      name: 'LinkedIn',
      url: heroData.linkedinUrl,
      icon: (
        <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
          <path d='M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z' />
        </svg>
      ),
      baseClass: 'bg-[#0A66C2] text-white shadow-md shadow-[#0A66C2]/30 hover:shadow-lg hover:shadow-[#0A66C2]/45 hover:-translate-y-1',
    },
    {
      id: 'github',
      name: 'GitHub',
      url: heroData.githubUrl,
      icon: (
        <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
          <path fillRule='evenodd' clipRule='evenodd' d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z' />
        </svg>
      ),
      baseClass: 'bg-[#24292e] text-white dark:bg-white dark:text-[#24292e] shadow-md shadow-gray-900/20 dark:shadow-white/20 hover:shadow-lg hover:-translate-y-1',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      url: heroData.instagramUrl,
      icon: (
        <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
          <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
        </svg>
      ),
      baseClass: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-md shadow-pink-500/30 hover:shadow-lg hover:shadow-pink-500/45 hover:-translate-y-1',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      url: heroData.facebookUrl,
      icon: (
        <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
          <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
        </svg>
      ),
      baseClass: 'bg-[#1877F2] text-white shadow-md shadow-[#1877F2]/30 hover:shadow-lg hover:shadow-[#1877F2]/45 hover:-translate-y-1',
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      url: heroData.twitterUrl,
      icon: (
        <svg className='w-4.5 h-4.5' fill='currentColor' viewBox='0 0 24 24'>
          <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
        </svg>
      ),
      baseClass: 'bg-black text-white dark:bg-white dark:text-black shadow-md shadow-black/20 dark:shadow-white/20 hover:shadow-lg hover:-translate-y-1',
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      url: heroData.whatsappUrl,
      icon: (
        <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
          <path d='M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z' />
        </svg>
      ),
      baseClass: 'bg-[#25D366] text-white shadow-md shadow-[#25D366]/30 hover:shadow-lg hover:shadow-[#25D366]/45 hover:-translate-y-1',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      url: heroData.youtubeUrl,
      icon: (
        <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
          <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' />
        </svg>
      ),
      baseClass: 'bg-[#FF0000] text-white shadow-md shadow-[#FF0000]/30 hover:shadow-lg hover:shadow-[#FF0000]/45 hover:-translate-y-1',
    },
  ].filter((s) => s.url && s.url.trim().length > 0 && s.url !== '#')

  return (
    <section className='relative md:pt-32 pt-20 bg-white dark:bg-darklight bg-cover text-midnight_text dark:text-white transition-colors'>
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
                alt='Malitha Tishamal signature - Software Developer and Network Engineer'
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

          {/* SOCIAL MEDIA ICONS BAR (Dynamic & Cloud Managed with Default Brand Colors) */}
          {socialLinks.length > 0 && (
            <div className='pt-4 flex items-center gap-3.5 sm:gap-4 flex-wrap'>
              <span className='text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mr-0.5'>
                Follow Me:
              </span>
              {socialLinks.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  title={item.name}
                  aria-label={item.name}
                  className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all duration-300 cursor-pointer transform hover:-translate-y-1 ${item.baseClass}`}>
                  {item.icon}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Hero Portrait Image */}
        <div className="md:col-span-6 col-span-12 relative flex justify-center items-center before:absolute before:content-[''] before:bg-[url('/images/hero/line-leyar.svg')] before:bg-no-repeat before:left-1/2 before:top-0 before:h-24 before:w-52 before:-z-10 before:translate-x-70% before:-translate-y-40% lg:before:inline-block before:hidden after:absolute after:content-[''] after:bg-[url('/images/hero/round-leyar.svg')] after:bg-no-repeat xl:after:inline-block after:hidden after:left-0 after:bottom-0 after:h-6.25 after:w-6.25 after:-z-10 after:-translate-x-1/2 after:translate-y-1/2">
          <div className="overflow-hidden rounded-3xl max-w-[460px] w-full aspect-square shadow-2xl border-4 border-white/10 dark:border-white/5 relative">
            <Image
              src={getImgPath(heroData.heroImageUrl || '/images/hero/malitha-hero.png')}
              alt='Malitha Tishamal - Expert Software Developer, DevOps Engineer and Network Specialist from Sri Lanka'
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
          <div className='relative mx-auto w-full max-w-lg rounded-2xl bg-white p-7 text-left shadow-2xl dark:bg-darklight border border-border/50 dark:border-dark_border/50 text-midnight_text dark:text-white animate-in fade-in zoom-in duration-150'>
            {/* Close Button */}
            <button
              onClick={() => setIsCvModalOpen(false)}
              className='hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full absolute top-4 right-4 cursor-pointer text-gray-500 hover:text-midnight_text dark:text-gray-300 dark:hover:text-white transition'
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
              <h3 className='text-xl font-bold text-midnight_text dark:text-white'>
                Download Curriculum Vitae (CV)
              </h3>
              <p className='text-xs text-grey dark:text-gray-300 mt-1 font-medium'>
                Select the format that best suits your evaluation or hiring workflow.
              </p>
            </div>

            {/* CV Format Option Cards */}
            <div className='space-y-4'>
              {/* Option 1: ATS CV */}
              <div
                onClick={() => handleDownloadCv(heroData.atsCvUrl, heroData.atsCvFileName || 'Malitha_Tishamal_ATS_CV.pdf')}
                className='group p-5 rounded-xl border border-border dark:border-dark_border hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-darkmode/50 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition cursor-pointer flex items-start justify-between gap-4'>
                <div className='space-y-1 flex-1'>
                  <div className='flex items-center gap-2'>
                    <h4 className='text-base font-bold text-midnight_text dark:text-white group-hover:text-primary transition'>
                      ATS CV
                    </h4>
                    <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'>
                      Recommended
                    </span>
                  </div>
                  <p className='text-xs font-semibold text-primary dark:text-blue-400'>
                    → LinkedIn / Job portals / Company applications
                  </p>
                  <p className='text-xs text-grey dark:text-gray-300 pt-1 font-normal leading-relaxed'>
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
                className='group p-5 rounded-xl border border-border dark:border-dark_border hover:border-purple-500 dark:hover:border-purple-500 bg-slate-50 dark:bg-darkmode/50 hover:bg-purple-50/40 dark:hover:bg-purple-950/30 transition cursor-pointer flex items-start justify-between gap-4'>
                <div className='space-y-1 flex-1'>
                  <div className='flex items-center gap-2'>
                    <h4 className='text-base font-bold text-midnight_text dark:text-white group-hover:text-purple-600 transition'>
                      CV 02 — Graphical/Creative CV
                    </h4>
                    <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'>
                      Visual
                    </span>
                  </div>
                  <p className='text-xs font-semibold text-purple-600 dark:text-purple-400'>
                    → Creative / Portfolio / Direct presentation
                  </p>
                  <p className='text-xs text-grey dark:text-gray-300 pt-1 font-normal leading-relaxed'>
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
