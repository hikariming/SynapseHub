'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthAPI } from '@/services/api'

export default function UserMenu() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AuthAPI.getCurrentUser()
      setUser(userData)
    }
    loadUser()
  }, [])

  const handleLogout = async () => {
    await AuthAPI.logout()
    router.push('/en/login')
  }

  // 如果没有用户信息，不显示菜单
  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
      >
        <span className="text-sm font-medium">{user.email}</span>
        <svg
          className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
          onBlur={() => setIsOpen(false)}
        >
          <div
            className="py-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu"
          >
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 