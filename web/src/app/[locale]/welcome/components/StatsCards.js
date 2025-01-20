'use client'

import { useState, useEffect } from 'react'
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/solid'
import { 
  CloudIcon, 
  UserGroupIcon, 
  CommandLineIcon,
  BellAlertIcon 
} from '@heroicons/react/24/solid'
import { useTranslations } from 'next-intl'
import { DashboardAPI } from '@/services/api'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function StatsCards() {
  const t = useTranslations('app')
  const [stats, setStats] = useState([
    { 
      id: 1, 
      nameKey: 'stats.upstream',
      stat: '0', 
      icon: CloudIcon, 
      change: '0', 
      changeType: 'increase' 
    },
    { 
      id: 2, 
      nameKey: 'stats.tokens',
      stat: '0', 
      icon: UserGroupIcon, 
      change: '0', 
      changeType: 'increase' 
    },
    { 
      id: 3, 
      nameKey: 'stats.calls',
      stat: '0', 
      icon: CommandLineIcon, 
      change: '0', 
      changeType: 'increase' 
    },
    { 
      id: 4, 
      nameKey: 'stats.alerts',
      stat: '0', 
      icon: BellAlertIcon, 
      change: '0', 
      changeType: 'decrease' 
    },
  ])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await DashboardAPI.getStats()
        setStats([
          { 
            id: 1, 
            nameKey: 'stats.upstream',
            stat: data.stats.upstream.current.toString(), 
            icon: CloudIcon, 
            change: data.stats.upstream.change.toString(), 
            changeType: data.stats.upstream.changeType 
          },
          { 
            id: 2, 
            nameKey: 'stats.tokens',
            stat: data.stats.tokens.current.toString(), 
            icon: UserGroupIcon, 
            change: data.stats.tokens.change.toString(), 
            changeType: data.stats.tokens.changeType 
          },
          { 
            id: 3, 
            nameKey: 'stats.calls',
            stat: data.stats.calls.current.toString(), 
            icon: CommandLineIcon, 
            change: data.stats.calls.change.toString(), 
            changeType: data.stats.calls.changeType 
          },
          { 
            id: 4, 
            nameKey: 'stats.alerts',
            stat: data.stats.alerts.current.toString(), 
            icon: BellAlertIcon, 
            change: data.stats.alerts.change.toString(), 
            changeType: data.stats.alerts.changeType 
          },
        ])
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }

    fetchStats()
    // 每5分钟刷新一次数据
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="py-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('stats.title')}</h3>
      <p className="text-sm text-gray-500 mb-6">{t('stats.subtitle')}</p>

      <dl className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.id}
            className="relative overflow-hidden rounded-xl bg-white px-4 pb-12 pt-5 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 sm:px-6 sm:pt-6"
          >
            <dt>
              <div className="absolute rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 p-3 shadow-md">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-600">
                {t(item.nameKey)}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-bold text-gray-900">{item.stat}</p>
              <p
                className={classNames(
                  item.changeType === 'increase' ? 'text-emerald-600' : 'text-rose-600',
                  'ml-2 flex items-baseline text-sm font-semibold'
                )}
              >
                {item.changeType === 'increase' ? (
                  <ArrowUpIcon className="h-5 w-5 flex-shrink-0 self-center text-emerald-500" aria-hidden="true" />
                ) : (
                  <ArrowDownIcon className="h-5 w-5 flex-shrink-0 self-center text-rose-500" aria-hidden="true" />
                )}
                <span className="sr-only">
                  {item.changeType === 'increase' ? 'Increased' : 'Decreased'} by
                </span>
                {item.change}
              </p>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-white to-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <a href="#" className="font-medium text-amber-600 hover:text-amber-500 flex items-center gap-1">
                    {t('stats.viewAll')}
                    <span className="sr-only"> {t(item.nameKey)}</span>
                  </a>
                </div>
              </div>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
} 