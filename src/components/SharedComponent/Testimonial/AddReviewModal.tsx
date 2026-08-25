'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { collection, doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { uploadToCloudinary } from '@/utils/cloudinary'
import { getImgPath } from '@/utils/image'
import toast from 'react-hot-toast'

interface AddReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const AddReviewModal: React.FC<AddReviewModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [content, setContent] = useState('')
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  // Handle Photo Upload to Cloudinary
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadProgress(10)
    const toastId = toast.loading('Uploading profile picture...')

    try {
      const res = await uploadToCloudinary(file, (percent) => {
        setUploadProgress(percent)
      })

      if (res.secure_url) {
        setAvatarUrl(res.secure_url)
        toast.success('Profile picture uploaded successfully!', { id: toastId })
      } else {
        throw new Error('Upload failed')
      }
    } catch (err: any) {
      console.error('Testimonial avatar upload error:', err)
      toast.error(err.message || 'Failed to upload image.', { id: toastId })
    } finally {
      setTimeout(() => setUploadProgress(null), 1000)
    }
  }

  // Submit Testimonial to Firestore
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Please enter your full name.')
      return
    }
    if (!content.trim()) {
      toast.error('Please write your testimonial / review.')
      return
    }

    setSubmitting(true)
    const id = `testimonial_${Date.now()}`
    const nowFormatted = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

    const roleFormatted = company.trim()
      ? `${role.trim() || 'Client'} – ${company.trim()}`
      : role.trim() || 'Valued Client'

    const testimonialData = {
      id,
      name: name.trim(),
      role: roleFormatted,
      company: company.trim(),
      content: content.trim(),
      rating: Number(rating) || 5,
      avatarUrl: avatarUrl.trim(),
      status: 'approved', // instantly visible (admin can also moderate / delete from admin panel)
      featured: true,
      displayOrder: 1,
      createdAt: nowFormatted,
      updatedAt: nowFormatted,
    }

    try {
      await setDoc(doc(db, 'testimonials', id), testimonialData)
      toast.success('Thank you! Your testimonial has been posted successfully! ⭐')
      setName('')
      setRole('')
      setCompany('')
      setContent('')
      setRating(5)
      setAvatarUrl('')
      onClose()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error('Submit testimonial error:', err)
      toast.error(err.message || 'Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className='fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200'>
      <div className='relative w-full max-w-lg bg-white dark:bg-darklight rounded-3xl p-6 sm:p-8 border border-border dark:border-dark_border shadow-2xl my-8 text-midnight_text dark:text-white max-h-[90vh] overflow-y-auto'>
        {/* Close Button */}
        <button
          type='button'
          onClick={onClose}
          className='absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-darkmode cursor-pointer'>
          ✕
        </button>

        {/* Modal Header */}
        <div className='mb-6'>
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold mb-2'>
            <span>⭐ Share Your Experience</span>
          </div>
          <h3 className='text-2xl font-bold text-midnight_text dark:text-white'>
            Write a Testimonial
          </h3>
          <p className='text-xs text-grey dark:text-gray-400 mt-1 leading-relaxed'>
            We appreciate your feedback and collaboration! Your review will be featured on the homepage.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Star Rating Selector */}
          <div>
            <label className='block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-600 dark:text-gray-300'>
              Your Rating *
            </label>
            <div className='flex items-center gap-1.5'>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type='button'
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className='p-1 text-2xl transition-transform hover:scale-125 focus:outline-hidden cursor-pointer'
                  aria-label={`Rate ${star} star`}>
                  <span
                    className={
                      star <= (hoverRating || rating)
                        ? 'text-amber-400 drop-shadow-xs'
                        : 'text-gray-300 dark:text-gray-700'
                    }>
                    ★
                  </span>
                </button>
              ))}
              <span className='ml-2 text-xs font-bold text-amber-500'>
                {rating === 5
                  ? '5.0 - Excellent!'
                  : rating === 4
                  ? '4.0 - Great!'
                  : rating === 3
                  ? '3.0 - Good'
                  : `${rating}.0 Stars`}
              </span>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className='block text-xs font-bold uppercase tracking-wider mb-1.5'>
              Full Name *
            </label>
            <input
              type='text'
              required
              placeholder='e.g. Dimuthu Weerasinghe / Kasun Perera'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='w-full px-4 py-2.5 text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary'
            />
          </div>

          {/* Role / Profession & Company */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <label className='block text-xs font-bold uppercase tracking-wider mb-1.5'>
                Role / Profession *
              </label>
              <input
                type='text'
                required
                placeholder='e.g. Founder, Tech Lead, Teacher'
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className='w-full px-3.5 py-2.5 text-xs rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary'
              />
            </div>
            <div>
              <label className='block text-xs font-bold uppercase tracking-wider mb-1.5'>
                Company / Organization (Optional)
              </label>
              <input
                type='text'
                placeholder='e.g. Dimu Tour & Travel / Apple'
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className='w-full px-3.5 py-2.5 text-xs rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary'
              />
            </div>
          </div>

          {/* Testimonial / Feedback Text */}
          <div>
            <label className='block text-xs font-bold uppercase tracking-wider mb-1.5'>
              Testimonial / Review Text *
            </label>
            <textarea
              rows={4}
              required
              placeholder='Share how Malitha helped your project, work quality, delivery speed, and overall experience...'
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className='w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary leading-relaxed'
            />
          </div>

          {/* Profile Picture (Optional) */}
          <div className='p-3.5 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border/60 dark:border-dark_border/60 space-y-2'>
            <label className='block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300'>
              Profile Picture (Optional)
            </label>
            <div className='flex items-center gap-3'>
              {avatarUrl ? (
                <div className='relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary shrink-0'>
                  <Image
                    src={getImgPath(avatarUrl)}
                    alt='Avatar Preview'
                    fill
                    unoptimized
                    className='object-cover'
                  />
                </div>
              ) : (
                <div className='w-12 h-12 rounded-full bg-primary/10 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm shrink-0'>
                  {name ? name.charAt(0).toUpperCase() : '👤'}
                </div>
              )}

              <div className='flex-1 space-y-1.5'>
                <div className='flex items-center gap-2'>
                  <label className='px-3 py-1.5 rounded-lg bg-primary hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition'>
                    Upload Photo
                    <input
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={handlePhotoUpload}
                    />
                  </label>
                  <input
                    type='url'
                    placeholder='or paste image URL'
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className='flex-1 px-3 py-1.5 text-xs rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-dark dark:text-white'
                  />
                </div>

                {uploadProgress !== null && (
                  <div className='w-full bg-gray-200 dark:bg-darklight rounded-full h-1.5 overflow-hidden'>
                    <div
                      className='bg-primary h-full transition-all'
                      style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className='flex items-center justify-end gap-3 pt-3 border-t border-border/40 dark:border-dark_border/40'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2.5 rounded-xl border border-border dark:border-dark_border text-xs font-semibold hover:bg-gray-100 dark:hover:bg-darkmode transition cursor-pointer'>
              Cancel
            </button>
            <button
              type='submit'
              disabled={submitting || uploadProgress !== null}
              className='px-6 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition disabled:opacity-60 cursor-pointer flex items-center gap-2'>
              {submitting ? 'Submitting...' : 'Post Testimonial ⭐'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddReviewModal
