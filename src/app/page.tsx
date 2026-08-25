import React from 'react'
import { Metadata } from "next";
import Hero from '@/components/Home/Hero';
import Counter from '@/components/Home/Counter'
import Progresswork from '@/components/Home/WorkProgress';
import Services from '@/components/Home/Services';
import Portfolio from '@/components/SharedComponent/portfollio'
import Projects from '@/components/SharedComponent/Projects'
import Testimonial from '@/components/SharedComponent/Testimonial'
import Blog from '@/components/SharedComponent/Blog'
import Contactform from '@/components/Home/Contact';

export const metadata: Metadata = {
  title: "Malitha Tishamal – Full Stack Developer & DevOps Engineer | AI & Cybersecurity Specialist",
};

export default function Home() {
  return (
    <main>
      <Hero />
      <Counter isColorMode={false} />
      <Progresswork isColorMode={false} />
      <Services />
      <Portfolio />
      <Projects />
      <Testimonial />
      <Blog />
      <Contactform />
    </main>
  )
}
