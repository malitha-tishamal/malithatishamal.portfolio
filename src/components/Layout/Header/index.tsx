'use client'

import Link from 'next/link'
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

  const signInCardRef = useRef<HTMLDivElement>(null)
  const signUpCardRef = useRef<HTMLDivElement>(null)
  const forgotPasswordCardRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    setSticky(window.scrollY >= 80)
  }

  // Handle outside click on backdrop or anywhere outside modal card
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
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    if (isSignInOpen || isSignUpOpen || isForgotPasswordOpen || navbarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [isSignInOpen, isSignUpOpen, isForgotPasswordOpen, navbarOpen])

  const authDialog = useContext(AuthDialogContext)

  const handleSignOut = async () => {
    await logout()
    router.push('/')
  }

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
              {isAdmin && (
                <Link
                  href='/admin'
                  className='bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition'>
                  Admin Dashboard
                </Link>
              )}
              <span className='text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full'>
                {userProfile?.name || user.displayName || user.email?.split('@')[0]}
              </span>
              <button
                onClick={handleSignOut}
                className='text-sm border border-red-500 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition cursor-pointer'>
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
                {isAdmin && (
                  <Link
                    href='/admin'
                    onClick={() => setNavbarOpen(false)}
                    className='bg-primary text-white px-4 py-2.5 rounded-lg text-center font-medium'>
                    Admin Dashboard
                  </Link>
                )}
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
