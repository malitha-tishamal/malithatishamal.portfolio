import React from 'react'
import Link from 'next/link'
import PortfolioCard from '@/components/SharedComponent/portfollio/Portfolio-card'

const Portfolio = () => {
  return (
    <section id='portfolio' className='dark:bg-darkmode pt-8 pb-4'>
      <div className='text-center lg:px-0 px-8'>
        <div
          className='flex gap-2 items-center justify-center'
          data-aos='fade-right'
          data-aos-delay='200'
          data-aos-duration='1000'>
          <span className='w-3 h-3 rounded-full bg-success'></span>
          <span className='font-medium text-midnight_text text-sm dark:text-white/50'>
            Portfolio
          </span>
        </div>
        <h2
          className='sm:text-4xl text-[28px] leading-tight font-bold text-midnight_text text-center pt-5 pb-3 md:w-4/6 w-full m-auto dark:text-white'
          data-aos='fade-left'
          data-aos-delay='200'
          data-aos-duration='1000'>
          Explore my portfolio showcase
        </h2>
        <div className='pb-8 inline-flex'>
          <p className='text-base font-normal text-grey max-w-xl dark:text-white/50'>
            Dive into a curated collection of my finest work, showcasing
            expertise across various industries.
          </p>
        </div>
      </div>

      {/* Portfolio Carousel Slider */}
      <PortfolioCard />

      {/* VIEW ALL BUTTON (Direct link to /portfolio) */}
      <div className='text-center pt-6 pb-12' data-aos='fade-up'>
        <Link
          href='/portfolio'
          className='inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-primary hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer'>
          <span>View All</span>
          <svg
            className='w-4 h-4 group-hover:translate-x-1 transition-transform'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M14 5l7 7m0 0l-7 7m7-7H3' />
          </svg>
        </Link>
      </div>
    </section>
  )
}

export default Portfolio
