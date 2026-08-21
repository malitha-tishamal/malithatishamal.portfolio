'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useContext, useEffect, useRef, useState } from 'react'
import { headerData } from '../Header/Navigation/menuData'
import Logo from './Logo'
import HeaderLink from '../Header/Navigation/HeaderLink'
import MobileHeaderLink from '../Header/Navigation/MobileHeaderLink'
import Signin from '@/components/Auth/SignIn'
import SignUp from '@/components/Auth/SignUp'
import ForgotPassword from '@/components/Auth/ForgotPassword'
import { useTheme } from 'next-themes'
import { Icon } from '@iconify/react/dist/iconify.js'
import { SuccessfullLogin } from '@/components/Auth/AuthDialog/SuccessfulLogin'
import { FailedLogin } from '@/components/Auth/AuthDialog/FailedLogin'
import { UserRegistered } from '@/components/Auth/AuthDialog/UserRegistered'
import AuthDialogContext from '@/app/context/AuthDialogContext'
import { useAuth } from '@/context/AuthContext'
import { getImgPath } from '@/utils/image'

const Header: React.FC = () => {
  const pathUrl = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user, userProfile, isAdmin, logout } = useAuth()

  const [navbarOpen, setNavbarOpen] = useState(false)
  const [sticky, setSticky] = useState(false)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  const signInCardRef = useRef<HTMLDivElement>(null)
  const signUpCardRef = useRef<HTMLDivElement>(null)
  const forgotPasswordCardRef = useRef<HTMLDivElement>(null)
  const profileCardRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    setSticky(window.scrollY >= 80)
  }

  // Handle outside click on backdrop
  const handleBackdropClick = (
    e: React.MouseEvent<HTMLDivElement>,
    closeFunc: () => void
  ) => {
    if (e.target === e.currentTarget) {
      closeFunc()
    }
  }

  const closeAllModals = () => {
    setIsSignInOpen(false)
    setIsSignUpOpen(false)
    setIsForgotPasswordOpen(false)
    setIsProfileModalOpen(false)
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    if (isSignInOpen || isSignUpOpen || isForgotPasswordOpen || isProfileModalOpen || navbarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [isSignInOpen, isSignUpOpen, isForgotPasswordOpen, isProfileModalOpen, navbarOpen])

  const authDialog = useContext(AuthDialogContext)

  const handleSignOut = async () => {
    await logout()
    closeAllModals()
    router.push('/')
  }

  const userName = userProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'User'
  const userEmail = userProfile?.email || user?.email || ''
  const userPhoto = userProfile?.photoURL || user?.photoURL || getImgPath('/images/hero/malitha-hero.png')
  const userRole = userProfile?.role || (isAdmin ? 'admin' : 'user')

  return (
    <header
      className={`fixed h-24 top-0 py-1 z-50 w-full dark:bg-transparent transition-all ${
        sticky
          ? 'shadow-lg bg-white dark:shadow-dark-md dark:bg-darklight!'
          : 'shadow-none'
      }`}>
      <div className='container mx-auto max-w-6xl flex items-center justify-between p-6'>
        <Logo />
        <nav className='hidden lg:flex grow items-center justify-center gap-6'>
          {headerData.map((item, index) => (
            <HeaderLink key={index} item={item} />
          ))}
        </nav>
        <div className='flex items-center gap-3'>
          {/* Theme toggler */}
          <button
            aria-label='Toggle theme'
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className='flex h-8 w-8 items-center justify-center text-body-color duration-300 dark:text-white cursor-pointer'>
            <svg
              viewBox='0 0 16 16'
              className={`hidden h-6 w-6 dark:block ${
                !sticky && pathUrl === '/' && 'text-white'
              }`}>
              <path
                d='M4.50663 3.2267L3.30663 2.03337L2.36663 2.97337L3.55996 4.1667L4.50663 3.2267ZM2.66663 7.00003H0.666626V8.33337H2.66663V7.00003ZM8.66663 0.366699H7.33329V2.33337H8.66663V0.366699V0.366699ZM13.6333 2.97337L12.6933 2.03337L11.5 3.2267L12.44 4.1667L13.6333 2.97337ZM11.4933 12.1067L12.6866 13.3067L13.6266 12.3667L12.4266 11.1734L11.4933 12.1067ZM13.3333 7.00003V8.33337H15.3333V7.00003H13.3333ZM7.99996 3.6667C5.79329 3.6667 3.99996 5.46003 3.99996 7.6667C3.99996 9.87337 5.79329 11.6667 7.99996 11.6667C10.2066 11.6667 12 9.87337 12 7.6667C12 5.46003 10.2066 3.6667 7.99996 3.6667ZM7.33329 14.9667H8.66663V13H7.33329V14.9667ZM2.36663 12.36L3.30663 13.3L4.49996 12.1L3.55996 11.16L2.36663 12.36Z'
                fill='#FFFFFF'
              />
            </svg>
            <svg
              viewBox='0 0 23 23'
              className={`h-8 w-8 text-dark dark:hidden ${
                !sticky && pathUrl === '/' && 'text-white'
              }`}>
              <path d='M16.6111 15.855C17.591 15.1394 18.3151 14.1979 18.7723 13.1623C16.4824 13.4065 14.1342 12.4631 12.6795 10.4711C11.2248 8.47905 11.0409 5.95516 11.9705 3.84818C10.8449 3.9685 9.72768 4.37162 8.74781 5.08719C5.7759 7.25747 5.12529 11.4308 7.29558 14.4028C9.46586 17.3747 13.6392 18.0253 16.6111 15.855Z' />
            </svg>
          </button>

          {/* If authenticated user */}
          {user ? (
            <div className='hidden lg:flex items-center gap-3'>
              {/* Clickable Profile Badge */}
              <button
                onClick={() => {
                  closeAllModals()
                  setIsProfileModalOpen(true)
                }}
                className='flex items-center gap-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 px-3.5 py-1.5 rounded-full transition cursor-pointer border border-border/50 dark:border-dark_border/60 shadow-2xs'>
                <div className='w-6 h-6 rounded-full overflow-hidden bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0'>
                  {userPhoto ? (
                    <Image
                      src={userPhoto}
                      alt={userName}
                      width={24}
                      height={24}
                      className='w-full h-full object-cover'
                      unoptimized
                    />
                  ) : (
                    userName.charAt(0).toUpperCase()
                  )}
                </div>
                <span className='text-xs font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[130px]'>
                  {userName}
                </span>
                <span className='text-[10px] bg-primary/15 text-primary dark:text-blue-400 font-bold px-1.5 py-0.5 rounded-xs uppercase'>
                  {userRole}
                </span>
              </button>

              <button
                onClick={handleSignOut}
                className='text-xs font-medium border border-red-500/80 text-red-500 px-3.5 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition cursor-pointer'>
                Sign Out
              </button>
            </div>
          ) : (
            <div className='hidden lg:flex items-center gap-3'>
              <button
                onClick={() => {
                  closeAllModals()
                  setIsSignInOpen(true)
                }}
                className='bg-transparent border border-primary text-primary px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition cursor-pointer'>
                Sign In
              </button>
              <button
                onClick={() => {
                  closeAllModals()
                  setIsSignUpOpen(true)
                }}
                className='bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer'>
                Sign Up
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setNavbarOpen(!navbarOpen)}
            className='block lg:hidden p-2 rounded-lg'
            aria-label='Toggle mobile menu'>
            <span className='block w-6 h-0.5 bg-black dark:bg-white'></span>
            <span className='block w-6 h-0.5 bg-black dark:bg-white mt-1.5'></span>
            <span className='block w-6 h-0.5 bg-black dark:bg-white mt-1.5'></span>
          </button>
        </div>
      </div>

      {/* USER PROFILE MODAL */}
      {isProfileModalOpen && user && (
        <div
          onClick={(e) => handleBackdropClick(e, () => setIsProfileModalOpen(false))}
          className='fixed inset-0 top-0 left-0 w-full h-full bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4'>
          <div
            ref={profileCardRef}
            className='relative mx-auto w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-2xl dark:bg-darklight border border-border/40 dark:border-dark_border/40 animate-in fade-in zoom-in duration-150'>
            {/* Close Button */}
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className='hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 rounded-full absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-dark dark:text-gray-300 dark:hover:text-white transition'
              aria-label='Close Profile Modal'>
              <Icon icon='ic:round-close' className='text-2xl' />
            </button>

            {/* Profile Avatar */}
            <div className='w-24 h-24 rounded-full mx-auto overflow-hidden border-4 border-primary/20 shadow-lg mb-4 relative bg-gray-100 dark:bg-gray-800 flex items-center justify-center'>
              {userPhoto ? (
                <Image
                  src={userPhoto}
                  alt={userName}
                  width={96}
                  height={96}
                  quality={100}
                  className='w-full h-full object-cover'
                  unoptimized
                />
              ) : (
                <span className='text-3xl font-bold text-primary'>
                  {userName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* User Name & Badges */}
            <h3 className='text-xl font-bold text-dark dark:text-white'>
              {userName}
            </h3>
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-all'>
              {userEmail}
            </p>

            <div className='flex items-center justify-center gap-2 mt-3 mb-6'>
              <span className='px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase'>
                {userRole}
              </span>
              <span className='px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'>
                ✓ Approved
              </span>
            </div>

            {/* Action Buttons */}
            <div className='space-y-3'>
              {/* Goto Admin Panel Button */}
              <Link
                href='/admin'
                onClick={() => setIsProfileModalOpen(false)}
                className='flex items-center justify-center gap-2 w-full rounded-xl bg-primary hover:bg-blue-700 py-3 text-sm font-semibold text-white transition shadow-md hover:shadow-lg cursor-pointer'>
                <span>Goto Admin Pannel</span>
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M14 5l7 7m0 0l-7 7m7-7H3'
                  />
                </svg>
              </Link>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className='w-full rounded-xl border border-red-500/40 hover:bg-red-500/10 py-2.5 text-sm font-medium text-red-500 transition cursor-pointer'>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIGN IN MODAL */}
      {isSignInOpen && (
        <div
          onClick={(e) => handleBackdropClick(e, () => setIsSignInOpen(false))}
          className='fixed inset-0 top-0 left-0 w-full h-full bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4'>
          <div
            ref={signInCardRef}
            className='relative mx-auto w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-white px-8 py-10 text-center shadow-2xl dark:bg-darklight border border-border/40 dark:border-dark_border/40'>
            <button
              onClick={() => setIsSignInOpen(false)}
              className='hover:bg-gray-200 dark:hover:bg-gray-800 p-1.5 rounded-full absolute top-4 right-4 cursor-pointer text-gray-500 hover:text-dark dark:text-gray-300 dark:hover:text-white transition'
              aria-label='Close Sign In Modal'>
              <Icon icon='ic:round-close' className='text-2xl' />
            </button>
            <Signin
              signInOpen={(val: boolean) => setIsSignInOpen(val)}
              onOpenSignUp={() => {
                setIsSignInOpen(false)
                setIsSignUpOpen(true)
              }}
              onOpenForgotPassword={() => {
                setIsSignInOpen(false)
                setIsForgotPasswordOpen(true)
              }}
            />
          </div>
        </div>
      )}

      {/* SIGN UP MODAL */}
      {isSignUpOpen && (
        <div
          onClick={(e) => handleBackdropClick(e, () => setIsSignUpOpen(false))}
          className='fixed inset-0 top-0 left-0 w-full h-full bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4'>
          <div
            ref={signUpCardRef}
            className='relative mx-auto w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-white px-8 py-10 text-center shadow-2xl dark:bg-darklight border border-border/40 dark:border-dark_border/40'>
            <button
              onClick={() => setIsSignUpOpen(false)}
              className='hover:bg-gray-200 dark:hover:bg-gray-800 p-1.5 rounded-full absolute top-4 right-4 cursor-pointer text-gray-500 hover:text-dark dark:text-gray-300 dark:hover:text-white transition'
              aria-label='Close Sign Up Modal'>
              <Icon icon='ic:round-close' className='text-2xl' />
            </button>
            <SignUp
              signUpOpen={(val: boolean) => setIsSignUpOpen(val)}
              onOpenSignIn={() => {
                setIsSignUpOpen(false)
                setIsSignInOpen(true)
              }}
            />
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD MODAL */}
      {isForgotPasswordOpen && (
        <div
          onClick={(e) => handleBackdropClick(e, () => setIsForgotPasswordOpen(false))}
          className='fixed inset-0 top-0 left-0 w-full h-full bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4'>
          <div
            ref={forgotPasswordCardRef}
            className='relative mx-auto w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-white px-8 py-10 text-center shadow-2xl dark:bg-darklight border border-border/40 dark:border-dark_border/40'>
            <button
              onClick={() => setIsForgotPasswordOpen(false)}
              className='hover:bg-gray-200 dark:hover:bg-gray-800 p-1.5 rounded-full absolute top-4 right-4 cursor-pointer text-gray-500 hover:text-dark dark:text-gray-300 dark:hover:text-white transition'
              aria-label='Close Forgot Password Modal'>
              <Icon icon='ic:round-close' className='text-2xl' />
            </button>
            <ForgotPassword
              onClose={() => setIsForgotPasswordOpen(false)}
              onOpenSignIn={() => {
                setIsForgotPasswordOpen(false)
                setIsSignInOpen(true)
              }}
            />
          </div>
        </div>
      )}

      {/* MOBILE MENU */}
      {navbarOpen && (
        <div
          onClick={() => setNavbarOpen(false)}
          className='fixed top-0 left-0 w-full h-full bg-black/50 z-40'
        />
      )}

      <div
        ref={mobileMenuRef}
        className={`lg:hidden fixed top-0 right-0 h-full w-full bg-white dark:bg-darkmode shadow-lg transform transition-transform duration-300 max-w-xs ${
          navbarOpen ? 'translate-x-0' : 'translate-x-full'
        } z-50`}>
        <div className='flex items-center justify-between p-4'>
          <h2 className='text-lg font-bold text-midnight_text dark:text-white'>
            Menu
          </h2>
          <button
            onClick={() => setNavbarOpen(false)}
            aria-label='Close mobile menu'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='24'
              height='24'
              viewBox='0 0 24 24'
              className='dark:text-white'>
              <path
                fill='none'
                stroke='currentColor'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>
        <nav className='flex flex-col items-start p-4'>
          {headerData.map((item, index) => (
            <MobileHeaderLink key={index} item={item} />
          ))}
          <div className='mt-4 flex flex-col gap-3 w-full'>
            {user ? (
              <>
                <button
                  onClick={() => {
                    setNavbarOpen(false)
                    setIsProfileModalOpen(true)
                  }}
                  className='bg-primary text-white px-4 py-2.5 rounded-lg text-center font-medium'>
                  My Profile ({userName})
                </button>
                <Link
                  href='/admin'
                  onClick={() => setNavbarOpen(false)}
                  className='bg-blue-600 text-white px-4 py-2.5 rounded-lg text-center font-medium'>
                  Goto Admin Pannel
                </Link>
                <button
                  onClick={() => {
                    handleSignOut()
                    setNavbarOpen(false)
                  }}
                  className='border border-red-500 text-red-500 px-4 py-2.5 rounded-lg text-center font-medium'>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    closeAllModals()
                    setIsSignInOpen(true)
                    setNavbarOpen(false)
                  }}
                  className='bg-transparent border border-primary text-primary px-4 py-2.5 rounded-lg text-center font-medium'>
                  Sign In
                </button>
                <button
                  onClick={() => {
                    closeAllModals()
                    setIsSignUpOpen(true)
                    setNavbarOpen(false)
                  }}
                  className='bg-primary text-white px-4 py-2.5 rounded-lg text-center font-medium'>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* Alerts */}
      <div
        className={`fixed top-6 end-1/2 translate-x-1/2 z-50 ${
          authDialog?.isSuccessDialogOpen ? 'block' : 'hidden'
        }`}>
        <SuccessfullLogin />
      </div>
      <div
        className={`fixed top-6 end-1/2 translate-x-1/2 z-50 ${
          authDialog?.isFailedDialogOpen ? 'block' : 'hidden'
        }`}>
        <FailedLogin />
      </div>
      <div
        className={`fixed top-6 end-1/2 translate-x-1/2 z-50 ${
          authDialog?.isUserRegistered ? 'block' : 'hidden'
        }`}>
        <UserRegistered />
      </div>
    </header>
  )
}

export default Header
