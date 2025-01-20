'use client'

import { useState } from 'react'
import NavbarClient from '@/app/components/navigation/NavbarClient'
import { useLocale, useTranslations } from 'next-intl'
import { Tab } from '@headlessui/react'
import ChatLogs from './components/ChatLogs'
import SystemLogs from './components/SystemLogs'
import { NextIntlClientProvider } from 'next-intl'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function LogsPage() {
  const locale = useLocale()
  const t = useTranslations('app.logs')
  
  const categories = {
    [t('chat')]: <ChatLogs />,
    [t('system')]: <SystemLogs />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/80 to-white">
      <NavbarClient currentLocale={locale} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full">
          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
              {Object.keys(categories).map((category) => (
                <Tab
                  key={category}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                      'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                      selected
                        ? 'bg-white text-blue-700 shadow'
                        : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                    )
                  }
                >
                  {category}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="mt-2">
              {Object.values(categories).map((component, idx) => (
                <Tab.Panel
                  key={idx}
                  className={classNames(
                    'rounded-xl bg-white p-3',
                    'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                  )}
                >
                  {component}
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </main>
    </div>
  )
}
