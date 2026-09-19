import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getImgPath } from '@/utils/image'
import toast from 'react-hot-toast'

const ContactForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    specialist: '',
    date: '',
    time: '',
    serviceCategory: '',
    message: ''
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if form is filled (for enabling checkbox)
  const isFormFilled = formData.firstName.trim() !== '' &&
                       formData.lastName.trim() !== '' &&
                       formData.email.trim() !== '' &&
                       formData.email.includes('@') &&
                       formData.specialist !== '' &&
                       formData.specialist !== 'Choose a specialist' &&
                       formData.date !== '' &&
                       formData.time !== '' &&
                       formData.message.trim() !== '' &&
                       formData.message.trim().length > 10

  // Check if can submit (checkbox checked + form valid)
  const canSubmit = isFormFilled && agreedToTerms

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if form is filled
    if (!isFormFilled) {
      toast.error('Please fill in all required fields first.', { duration: 3000 })
      return
    }
    
    // Check if terms are agreed
    if (!agreedToTerms) {
      toast.error('Please agree to the Terms and Conditions to submit.', { duration: 3000 })
      return
    }

    setIsSubmitting(true)

    try {
      // Here you would typically send the form data to your backend
      // For now, we'll simulate the submission
      console.log('Form submitted:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success('✅ Inquiry submitted successfully! We will contact you soon.', { duration: 5000 })
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        specialist: '',
        date: '',
        time: '',
        serviceCategory: '',
        message: ''
      })
      setAgreedToTerms(false)
      
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('❌ Failed to submit inquiry. Please try again.', { duration: 3000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <section className='dark:bg-darkmode md:pb-24 pb-16'>
        <div className='container mx-auto max-w-6xl px-4'>
          <div className='grid md:grid-cols-12 grid-cols-1 gap-8'>
            <div className='col-span-6'>
              <h2 className='max-w-72 text-[40px] leading-tight font-bold mb-9 text-midnight_text dark:text-white'>
                Get Online Consultation
              </h2>
              <form onSubmit={handleSubmit} className='flex flex-wrap w-full m-auto justify-between'>
                <div className='sm:flex gap-3 w-full'>
                  <div className='mx-0 my-2.5 flex-1'>
                    <label
                      htmlFor='first-name'
                      className='pb-3 inline-block text-base'>
                      First Name*
                    </label>
                    <input
                      id='first-name'
                      name='firstName'
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className='w-full text-base px-4 rounded-lg py-2.5 border-border dark:border-dark_border border-solid dark:text-white  dark:bg-darkmode border transition-all duration-500 focus:border-primary dark:focus:border-primary focus:border-solid focus:outline-0'
                      type='text'
                      required
                    />
                  </div>
                  <div className='mx-0 my-2.5 flex-1'>
                    <label
                      htmlFor='last-name'
                      className='pb-3 inline-block text-base'>
                      Last Name*
                    </label>
                    <input
                      id='last-name'
                      name='lastName'
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className='w-full text-base px-4 rounded-lg py-2.5 border-border dark:border-dark_border border-solid dark:text-white  dark:bg-darkmode border transition-all duration-500 focus:border-primary dark:focus:border-primary focus:border-solid focus:outline-0'
                      type='text'
                      required
                    />
                  </div>
                </div>
                <div className='sm:flex gap-3 w-full'>
                  <div className='mx-0 my-2.5 flex-1'>
                    <label
                      htmlFor='email'
                      className='pb-3 inline-block text-base'>
                      Email address*
                    </label>
                    <input
                      id='email'
                      name='email'
                      value={formData.email}
                      onChange={handleInputChange}
                      type='email'
                      className='w-full text-base px-4 rounded-lg border-border dark:border-dark_border border-solid dark:text-white  dark:bg-darkmode border transition-all duration-500 focus:border-primary dark:focus:border-primary focus:border-solid focus:outline-0'
                      required
                    />
                  </div>
                  <div className='mx-0 my-2.5 flex-1'>
                    <label
                      htmlFor='specialist'
                      className='pb-3 inline-block text-base'>
                      Specialist*
                    </label>
                    <select 
                      id='specialist'
                      name='specialist'
                      value={formData.specialist}
                      onChange={handleInputChange}
                      className='w-full text-base px-4 py-2.5 rounded-lg border-border dark:text-white border-solid dark:bg-darkmode border transition-all duration-500 focus:border-primary dark:focus:border-primary dark:border-dark_border focus:border-solid focus:outline-0'
                      required
                    >
                      <option value=''>Choose a specialist</option>
                      <option value='Software Development'>Software Development</option>
                      <option value='DevOps & Cloud'>DevOps & Cloud</option>
                      <option value='Network Engineering'>Network Engineering</option>
                      <option value='Cybersecurity'>Cybersecurity</option>
                      <option value='AI & Machine Learning'>AI & Machine Learning</option>
                      <option value='Web Development'>Web Development</option>
                      <option value='Mobile Development'>Mobile Development</option>
                      <option value='Technical Consulting'>Technical Consulting</option>
                    </select>
                  </div>
                </div>
                
                {/* Service Category (Optional) */}
                <div className='mx-0 my-2.5 w-full'>
                  <label
                    htmlFor='serviceCategory'
                    className='pb-3 inline-block text-base text-gray-500 dark:text-gray-400'
                  >
                    -- Choose a Service Category (Optional) --
                  </label>
                  <select 
                    id='serviceCategory'
                    name='serviceCategory'
                    value={formData.serviceCategory}
                    onChange={handleInputChange}
                    className='w-full text-base px-4 py-2.5 rounded-lg border-border dark:text-white border-solid dark:bg-darkmode border transition-all duration-500 focus:border-primary dark:focus:border-primary dark:border-dark_border focus:border-solid focus:outline-0'
                  >
                    <option value=''>Select a category (optional)</option>
                    <option value='Web Development'>Web Development</option>
                    <option value='Mobile Applications'>Mobile Applications</option>
                    <option value='Cloud Infrastructure'>Cloud Infrastructure</option>
                    <option value='Network Solutions'>Network Solutions</option>
                    <option value='Security Audits'>Security Audits</option>
                    <option value='Technical Consulting'>Technical Consulting</option>
                    <option value='Custom Software'>Custom Software</option>
                  </select>
                </div>

                <div className='sm:flex gap-3 w-full'>
                  <div className='mx-0 my-2.5 flex-1'>
                    <label
                      htmlFor='date'
                      className='pb-3 inline-block text-base'>
                      Date*
                    </label>
                    <input
                      id='date'
                      name='date'
                      value={formData.date}
                      onChange={handleInputChange}
                      className='w-full text-base px-4 rounded-lg  py-2.5 outline-hidden dark:text-white dark:bg-darkmode border-border border-solid border transition-all duration-500 focus:border-primary dark:focus:border-primary dark:border-dark_border focus:border-solid focus:outline-0'
                      type='date'
                      required
                    />
                  </div>
                  <div className='mx-0 my-2.5 flex-1'>
                    <label
                      htmlFor='time'
                      className='pb-3 inline-block text-base'>
                      Time*
                    </label>
                    <input
                      id='time'
                      name='time'
                      value={formData.time}
                      onChange={handleInputChange}
                      className='w-full text-base px-4 rounded-lg py-2.5 border-border outline-hidden dark:text-white dark:bg-darkmode border-solid border transition-all duration-500 focus:border-primary dark:focus:border-primary dark:border-dark_border focus:border-solid focus:outline-0'
                      type='time'
                      required
                    />
                  </div>
                </div>

                {/* Message Field */}
                <div className='mx-0 my-2.5 w-full'>
                  <label
                    htmlFor='message'
                    className='pb-3 inline-block text-base'
                  >
                    Let us know about your project*
                  </label>
                  <textarea
                    id='message'
                    name='message'
                    value={formData.message}
                    onChange={handleInputChange}
                    className='w-full text-base px-4 rounded-lg py-2.5 border-border dark:border-dark_border border-solid dark:text-white dark:bg-darkmode border transition-all duration-500 focus:border-primary dark:focus:border-primary focus:border-solid focus:outline-0 min-h-[120px]'
                    placeholder='Tell us about your project...'
                    required
                  />
                </div>

                {/* Terms and Conditions Checkbox */}
                <div className='mx-0 my-4 w-full'>
                  <label className='flex items-start gap-3 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      disabled={!isFormFilled}
                      className='mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                    />
                    <span className={`text-sm ${!isFormFilled ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      I have read and agree to the <Link href='/terms' className='text-primary hover:underline'>Terms and Conditions</Link> and <Link href='/privacy' className='text-primary hover:underline'>Privacy Policy</Link>
                    </span>
                  </label>
                  {!isFormFilled && (
                    <p className='text-xs text-gray-400 mt-1 ml-8'>
                      Please fill in all required fields (First Name, Last Name, Email, Specialist, Date, Time, Message) to enable this checkbox
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className='mx-0 my-2.5 w-full'>
                  <button
                    type='submit'
                    disabled={!canSubmit || isSubmitting}
                    className='w-full bg-primary rounded-lg text-white py-4 px-8 mt-4 inline-block hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary transition duration-300'
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
                  </button>
                  {!canSubmit && (
                    <p className='text-xs text-gray-400 mt-2 text-center'>
                      {!agreedToTerms ? 'Please agree to the terms and conditions to submit' : 'Please fill in all required fields'}
                    </p>
                  )}
                </div>
              </form>
            </div>
            <div className='col-span-6'>
              <Image
                src={getImgPath('/images/contact-page/contact.jpg')}
                alt='Contact'
                width={1300}
                height={0}
                quality={100}
                style={{ width: '100%', height: 'auto' }}
                className='bg-no-repeat bg-contain'
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default ContactForm