'use client'

import { 
  Bars3Icon, 
  HomeIcon,
  CloudArrowUpIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline'
import LanguageSwitcher from '../LanguageSwitcher'
import UserMenu from './UserMenu'
import { useTranslations, useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { AuthAPI } from '@/services/api'

export default function NavbarClient({ currentLocale }) {
  const t = useTranslations('app')
  const locale = useLocale()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await AuthAPI.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      }
    }
    fetchUser()
  }, [])

  const getInitials = (username) => {
    if (!username) return ''
    if (/[\u4e00-\u9fa5]/.test(username)) {
      return username.charAt(0)
    }
    return username.slice(0, 2).toUpperCase()
  }

  const getNavigation = () => {
    const baseNavigation = [
      { name: t('nav.home'), href: `/${locale}`, icon: HomeIcon },
      { name: t('nav.upstream'), href: `/${locale}/upstream`, icon: CloudArrowUpIcon },
      { name: t('nav.docs'), href: `/${locale}/docs`, icon: BookOpenIcon },
    ];

    // 如果是管理员,添加用户管理和日志页面
    if (user?.role === 'admin') {
      baseNavigation.push(
        { name: t('nav.users'), href: `/${locale}/users`, icon: UsersIcon },
        { name: t('nav.logs'), href: `/${locale}/logs`, icon: ClipboardDocumentListIcon }
      );
    } else if (user) {
      // 普通用户只能看到自己的用户页面
      baseNavigation.push(
        { name: t('nav.users'), href: `/${locale}/users`, icon: UsersIcon }
      );
    }

    return baseNavigation;
  }

  const isActiveLink = (href) => {
    const currentPath = pathname.replace(new RegExp(`^/${currentLocale}`), '') || '/'
    const itemPath = href.replace(new RegExp(`^/${locale}`), '') || '/'
    return currentPath === itemPath
  }

  const handleAvatarClick = () => {
    window.location.href = `/${locale}/setting`
  }

  const navigation = getNavigation();

  return (
    <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex h-16 justify-between">
        <div className="flex">
          <div className="flex flex-shrink-0 items-center">
            <Link href={`/${locale}`}>
              {!imageError ? (
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={32}
                  height={32}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                  S
                </div>
              )}
            </Link>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    isActiveLink(item.href)
                      ? 'border-b-2 border-primary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="mr-1 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <div className="flex items-center space-x-2">
            {user && (
              <>
                <div
                  className="relative w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleAvatarClick}
                >
                  {user.avatar_url && !imageError ? (
                    <div className="rounded-full overflow-hidden h-full w-full">
                      <Image
                        src={user.avatar_url}
                        alt={user.username}
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/80 to-primary/90 text-primary-foreground flex items-center justify-center text-sm font-medium rounded-full ring-1 ring-primary/20 shadow-sm">
                      <span className="bg-black/10 px-1.5 py-0.5 rounded">
                        {getInitials(user.username)}
                      </span>
                    </div>
                  )}
                </div>
                <span 
                  className="hidden md:block text-sm font-medium text-foreground cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleAvatarClick}
                >
                  {user.username}
                </span>
              </>
            )}
            <UserMenu />
          </div>
        </div>
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

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50">
          {/* 背景遮罩 */}
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          
          {/* 菜单内容 */}
          <div className="relative h-full">
            <div className="bg-background border-b border-border">
              {/* 关闭按钮 */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                {user && (
                  <div className="flex items-center space-x-3">
                    <div 
                      className="relative w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={handleAvatarClick}
                    >
                      {user.avatar_url && !imageError ? (
                        <div className="rounded-full overflow-hidden h-full w-full">
                          <Image
                            src={user.avatar_url}
                            alt={user.username}
                            fill
                            className="object-cover"
                            onError={() => setImageError(true)}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/80 to-primary/90 text-primary-foreground flex items-center justify-center text-sm font-medium rounded-full ring-1 ring-primary/20 shadow-sm">
                          <span className="bg-black/10 px-1.5 py-0.5 rounded">
                            {getInitials(user.username)}
                          </span>
                        </div>
                      )}
                    </div>
                    <span 
                      className="text-sm font-medium text-foreground cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={handleAvatarClick}
                    >
                      {user.username}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className="rounded-md p-2 text-muted-foreground hover:bg-background hover:text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-1 pb-3 pt-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
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
                      <div className="flex items-center">
                        <Icon className="mr-4 h-5 w-5" />
                        {item.name}
                      </div>
                    </Link>
                  )
                })}
              </div>
              <div className="border-t border-border pb-3 pt-4">
                <div className="flex items-center justify-center space-x-4">
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
