'use client'

import React, { FC, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { doc, onSnapshot, collection, serverTimestamp, setDoc, increment } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getImgPath } from '@/utils/image'
import { FooterContent, defaultFooterContent } from '@/types/footer'
import toast from 'react-hot-toast'
import { useVisitorTracking } from '@/hooks/useVisitorTracking'

const SOCIAL_COLORS: Record<string, string> = {
  LinkedIn: 'bg-[#0A66C2]',
  GitHub: 'bg-[#24292e]',
  Instagram: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
  Facebook: 'bg-[#1877F2]',
  X: 'bg-black',
  WhatsApp: 'bg-[#25D366]',
  YouTube: 'bg-[#FF0000]',
}

interface SocialIconProps { platform: string; className?: string }
const SocialIcon = ({ platform, className = 'w-5 h-5' }: SocialIconProps) => {
  if (platform === 'LinkedIn') return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  if (platform === 'GitHub') return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
  if (platform === 'Instagram') return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
  if (platform === 'Facebook') return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  if (platform === 'X') return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  if (platform === 'WhatsApp') return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  if (platform === 'YouTube') return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
}

const Footer: FC = () => {
  const pathUrl = usePathname()
  const [data, setData] = useState<FooterContent>(defaultFooterContent)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const { totalVisitors } = useVisitorTracking()

  // Real-time Firestore sync
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, 'siteContent', 'footer'),
        (snap) => {
          if (snap.exists()) {
            setData({ ...defaultFooterContent, ...(snap.data() as FooterContent) })
          }
        },
        (err) => {
          console.warn('Footer sync notice:', err.message)
        }
      )
      return () => unsub()
    } catch (err) {
      console.error('Footer listener error:', err)
    }
  }, [])

  if (pathUrl?.startsWith('/admin')) return null

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) { toast.error('Please enter a valid email address.'); return }
    setSubmitting(true)
    try {
      // Use the new API endpoint that handles email notifications
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubscribed(true)
        setEmail('')
        toast.success(data.message || 'Successfully subscribed!')
      } else {
        toast.error(data.error || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const enabledSocials = (data.socialLinks || []).filter(s => s.enabled)
  const enabledNavLinks = (data.navLinks || []).filter(l => l.enabled)

  // Dynamic Copyright computation
  const currentYear = new Date().getFullYear()
  const copyrightText =
    data.copyrightMode === 'custom'
      ? (data.customCopyrightText || data.copyright || `© ${currentYear} Malitha Tishamal. All rights reserved.`)
      : `© ${currentYear} ${data.copyrightOwnerName || 'Malitha Tishamal'}. ${data.copyrightSuffix || 'All rights reserved.'}`

  // Colors
  const bgColor = data.bgColor || '#0b1120'
  const textColor = data.textColor || '#ffffff'
  const subTextColor = data.subTextColor || 'rgba(255, 255, 255, 0.55)'
  const accentColor = data.accentColor || '#0a66c2'
  const borderColor = data.borderColor || 'rgba(255, 255, 255, 0.1)'

  return (
    <footer
      className="relative z-1 border-t px-6 transition-colors duration-300"
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
      }}
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid md:grid-cols-12 grid-cols-1 sm:grid-cols-12">
          {/* Column 1: CTA */}
          <div
            className="md:col-span-4 sm:col-span-6 col-span-12 sm:border-r border-b border-solid flex items-center sm:border-b-0 sm:min-h-25 py-10 shrink-0"
            style={{ borderColor: borderColor }}
          >
            <div className="sm:content-normal sm:text-start text-center content-center sm:w-auto w-full">
              <Link href="/" className="md:block flex justify-center">
                <Image
                  src={getImgPath('/images/logo/malitha-logo-white.png')}
                  alt="Malitha"
                  width={280}
                  height={90}
                  style={{ width: 'auto', height: '78px' }}
                  quality={100}
                  unoptimized
                />
              </Link>
              <h2
                className="py-10 text-[40px] leading-tight font-bold"
                style={{ color: textColor }}
              >
                {data.tagline}
              </h2>
              <Link
                href={data.ctaHref}
                className="px-9 py-3 rounded-lg text-white font-semibold transition hover:opacity-90 inline-block shadow-md"
                style={{ backgroundColor: accentColor }}
              >
                {data.ctaLabel}
              </Link>
            </div>
          </div>

          {/* Column 2: Support & Social */}
          <div
            className="md:col-span-4 sm:col-span-6 col-span-12 sm:flex items-center sm:min-h-25 py-10 justify-center shrink-0 md:border-r border-b sm:border-b-0 border-solid"
            style={{ borderColor: borderColor }}
          >
            <div className="flex flex-col md:items-start items-center">
              <span
                className="text-lg font-bold pb-4 inline-block"
                style={{ color: textColor }}
              >
                {data.supportTitle}
              </span>
              <div className="pb-5 sm:block flex flex-col items-center sm:items-start">
                <p className="text-base font-bold" style={{ color: textColor }}>
                  Phone
                </p>
                <Link
                  href={data.phoneHref}
                  className="text-2xl transition hover:opacity-100"
                  style={{ color: subTextColor }}
                >
                  {data.phone}
                </Link>
              </div>
              <div className="sm:block flex flex-col items-center sm:items-start">
                <p className="text-base font-bold" style={{ color: textColor }}>
                  Email
                </p>
                <Link
                  href={data.emailHref}
                  className="text-2xl transition hover:opacity-100 break-all"
                  style={{ color: subTextColor }}
                >
                  {data.email}
                </Link>
              </div>
              {enabledSocials.length > 0 && (
                <ul className="flex flex-wrap items-center gap-2 mt-7">
                  {enabledSocials.map(social => {
                    const colorClass = SOCIAL_COLORS[social.platform] || 'bg-gray-600'
                    return (
                      <li key={social.platform}>
                        <Link
                          href={social.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={social.platform}
                          className={`${colorClass} w-9 h-9 rounded-lg flex items-center justify-center text-white hover:-translate-y-1 hover:shadow-lg transition-all duration-200`}
                        >
                          <SocialIcon platform={social.platform} className="w-4 h-4" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Column 3: Newsletter */}
          <div
            className="md:col-span-4 col-span-12 border-t md:border-none border-solid sm:flex items-center justify-end md:min-h-25 py-10 shrink-0"
            style={{ borderColor: borderColor }}
          >
            <div className="md:w-3/4 w-full sm:text-start text-center">
              <span
                className="font-bold pb-4 inline-block text-2xl"
                style={{ color: textColor }}
              >
                {data.newsletterTitle}
              </span>
              <p
                className="text-base pb-7"
                style={{ color: subTextColor }}
              >
                {data.newsletterSubtitle}
              </p>
              {subscribed ? (
                <div className="flex items-center gap-3 bg-green-500/15 border border-green-500/30 rounded-lg px-5 py-4">
                  <svg className="w-6 h-6 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div>
                    <p className="text-green-300 font-semibold text-sm">You are subscribed!</p>
                    <p className="text-green-400/70 text-xs">Thank you! We will keep you updated.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="newsletter-form flex rounded-lg sm:w-full w-3/4 sm:mx-0 mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email*"
                    className="p-4 text-base border-transparent rounded-s-lg rounded-e-none! outline-0 focus:border-primary dark:focus:border-primary w-[calc(100%_-_137px)] flex bg-white dark:bg-midnight_text dark:text-white dark:border-solid dark:border dark:border-border_color"
                    disabled={submitting}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="p-[0.625rem] text-base font-medium text-white border-none cursor-pointer rounded-e-lg outline-0 text-center w-[8.5625rem] hover:opacity-90 disabled:opacity-60 transition"
                    style={{ backgroundColor: accentColor }}
                  >
                    {submitting ? 'Sending...' : 'Subscribe'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Nav Links & Copyright */}
      <div
        className="text-center gap-4 md:gap-0 flex-wrap p-7 border-t border-solid"
        style={{ borderColor: borderColor }}
      >
        {enabledNavLinks.length > 0 && (
          <ul className="flex justify-center mb-4 items-center sm:gap-7 gap-3 flex-wrap">
            {enabledNavLinks.map(link => (
              <li key={link.label} className="text-base">
                <Link
                  href={link.href}
                  className="transition hover:underline"
                  style={{ color: subTextColor }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
          <p className="text-base font-medium" style={{ color: subTextColor }}>
            {copyrightText}
          </p>
          <span className="hidden sm:inline" style={{ color: subTextColor }}>
            |
          </span>
          <p className="text-sm font-medium" style={{ color: subTextColor }}>
            <span className="font-bold" style={{ color: textColor }}>{totalVisitors.toLocaleString()}</span> Total Visitors
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
