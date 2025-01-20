'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'

const levelColorMap = {
  info: 'bg-blue-100 text-blue-800',
  warn: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  debug: 'bg-gray-100 text-gray-800'
}

export default function SystemLogDetail({ isOpen, onClose, log }) {
  const t = useTranslations('app.systemLogs.detail')
  
  if (!log) return null

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {t('title')}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">{t('close')}</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* 基本信息 */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${levelColorMap[log.level]}`}>
                      {log.level}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">{t('basicInfo.service')}</p>
                      <p className="mt-1 text-sm text-gray-900">{log.service || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('basicInfo.requestId')}</p>
                      <p className="mt-1 text-sm text-gray-900">{log.request_id || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('basicInfo.userId')}</p>
                      <p className="mt-1 text-sm text-gray-900">{log.user_id || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('basicInfo.ip')}</p>
                      <p className="mt-1 text-sm text-gray-900">{log.ip || '-'}</p>
                    </div>
                  </div>

                  {/* 消息内容 */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">{t('basicInfo.message')}</p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {log.message}
                      </p>
                    </div>
                  </div>

                  {/* 错误堆栈 */}
                  {log.stack && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{t('basicInfo.stack')}</p>
                      <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-900 overflow-x-auto whitespace-pre-wrap">
                        {log.stack}
                      </pre>
                    </div>
                  )}

                  {/* 元数据 */}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-1">{t('basicInfo.metadata')}</p>
                      <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-900 overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 