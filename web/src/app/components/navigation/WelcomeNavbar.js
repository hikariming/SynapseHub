'use client'

import { useTranslations, useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import LanguageSwitcher from '../LanguageSwitcher'

export default function WelcomeNavbar({ currentLocale }) {
  const t = useTranslations('app.welcome')
  console.log('Translation test:', t('nav.intro'))

  const locale = useLocale()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: t('nav.intro'), href: `/${locale}/welcome` },
    { name: t('nav.pricing'), href: `/${locale}/welcome/pricing` },
    { name: t('nav.docs'), href: `/${locale}/welcome/docs` },
  ]

  const isActiveLink = (href) => {
    const currentPath = pathname.replace(new RegExp(`^/${currentLocale}`), '') || '/'
    const itemPath = href.replace(new RegExp(`^/${locale}`), '') || '/'
    return currentPath === itemPath
  }

  return (
    <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex h-16 justify-between">
        <div className="flex">
          <div className="flex flex-shrink-0 items-center">
            <Link href={`/${locale}/welcome`} className="flex items-center space-x-2">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
              >
                <path
                  d="M6 7C6 5.89543 6.89543 5 8 5H24C25.1046 5 26 5.89543 26 7V25C26 26.1046 25.1046 27 24 27H8C6.89543 27 6 26.1046 6 25V7Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M10 15H22M10 19H22M10 23H18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M16 8.5C16 8.5 14.5 7 12.5 7C10.5 7 9 8.5 9 10.5C9 14 16 16 16 16C16 16 23 14 23 10.5C23 8.5 21.5 7 19.5 7C17.5 7 16 8.5 16 8.5Z"
                  fill="currentColor"
                />
              </svg>
              <span className="text-xl font-bold">SynapseHub</span>
            </Link>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  isActiveLink(item.href)
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <Link
            href={`/${locale}/`}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            {t('nav.login')}
          </Link>
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-background hover:text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">
                {isMobileMenuOpen ? 'Close main menu' : 'Open main menu'}
              </span>
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          
          <div className="relative h-full">
            <div className="bg-background border-b border-border">
              <div className="flex items-center justify-end px-4 py-2 border-b border-border">
                <button
                  type="button"
                  className="rounded-md p-2 text-muted-foreground hover:bg-background hover:text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-1 pb-3 pt-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${
                      isActiveLink(item.href)
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-transparent text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="border-t border-border pb-3 pt-4">
                <div className="flex items-center justify-center space-x-4">
                  <LanguageSwitcher />
                  <Link
                    href={`/${locale}/`}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('nav.login')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
} 