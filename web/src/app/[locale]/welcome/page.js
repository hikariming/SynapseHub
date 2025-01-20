'use client'

import NavbarClient from '@/app/components/navigation/NavbarClient'
import { useLocale } from 'next-intl'
import StatsCards from './components/StatsCards'
import TrendChart from './components/TrendChart'

export default function WelcomePage() {
  const locale = useLocale()

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/80 to-white">
      <NavbarClient currentLocale={locale} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StatsCards />
        <TrendChart />
      </main>
    </div>
  )
}
