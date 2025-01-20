'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthAPI } from '@/services/api'

const publicPaths = [
  '/login', 
  '/register',
] 

// 需要管理员权限的路径
const adminPaths = [
  '/logs'
]

export default function AuthGuard({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      // 改进的路径匹配逻辑
      const isPublicPath = publicPaths.some(path => {
        // 处理精确匹配
        if (pathname === path) return true;
        // 处理带有语言前缀的路径 (如 /en/login)
        const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '');
        if (pathWithoutLocale === path) return true;
        // 处理 /welcome 相关的所有子路径
        if (pathWithoutLocale.startsWith('/welcome/')) return true;
        return false;
      });

      if (isPublicPath) {
        setIsLoading(false)
        return
      }

      try {
        const user = await AuthAPI.getCurrentUser()
        if (!user) {
          router.push('/en/login')
          return
        }

        // 检查管理员权限
        const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '');
        const needsAdmin = adminPaths.some(path => pathWithoutLocale.startsWith(path));
        
        if (needsAdmin && user.role !== 'admin') {
          // 如果需要管理员权限但用户不是管理员,重定向到首页
          router.push('/zh')
          return
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/en/login')
      }
    }

    checkAuth()
  }, [pathname, router])

  if (isLoading && !publicPaths.some(path => {
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '');
    return pathWithoutLocale === path || pathWithoutLocale.startsWith('/welcome/');
  })) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return children
} 