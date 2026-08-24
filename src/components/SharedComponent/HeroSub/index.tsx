import React, { FC } from 'react'
import Breadcrumb from '@/components/Breadcrumb'
import { BreadcrumbLink } from '@/types/breadcrumb'

interface HeroSubProps {
  title: string
  description: string
  breadcrumbLinks: BreadcrumbLink[]
}

const HeroSub: FC<HeroSubProps> = ({ title, description, breadcrumbLinks }) => {
  return (
    <>
      <section className='text-center md:pt-36 pt-24 md:pb-4 pb-2 dark:bg-darkmode'>
        <h2 className='dark:text-white md:text-[38px] leading-tight text-3xl font-bold text-midnight_text'>
          {title}
        </h2>
        <p className='md:text-lg text-base text-grey dark:text-white/50 font-normal max-w-45 w-full mx-auto my-3 sm:px-0 px-4'>
          {description}
        </p>
        <Breadcrumb links={breadcrumbLinks} />
      </section>
    </>
  )
}

export default HeroSub
