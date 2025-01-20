'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'

const roleColorMap = {
  system: 'bg-gray-100 text-gray-800',
  user: 'bg-blue-100 text-blue-800',
  assistant: 'bg-green-100 text-green-800',
  function: 'bg-purple-100 text-purple-800'
}

export default function ChatLogDetail({ isOpen, onClose, log }) {
  const t = useTranslations('app.chatLogs.detail')
  
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
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
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">{t('basicInfo.userId')}</p>
                    <p className="mt-1 text-sm text-gray-900">{log.user_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('basicInfo.conversationId')}</p>
                    <p className="mt-1 text-sm text-gray-900">{log.conversation_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('basicInfo.model')}</p>
                    <p className="mt-1 text-sm text-gray-900">{log.modelName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('basicInfo.tokenStats')}</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {t('basicInfo.total')}: {log.total_tokens || 0} | 
                      {t('basicInfo.prompt')}: {log.prompt_tokens || 0} | 
                      {t('basicInfo.completion')}: {log.completion_tokens || 0}
                    </p>
                  </div>
                </div>

                {/* 消息列表 */}
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {log.messages?.map((message, index) => (
                    <div key={index} className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColorMap[message.role]}`}>
                          {message.role}
                        </span>
                        {message.name && (
                          <span className="text-sm text-gray-500">
                            {message.name}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="pl-4">
                        {/* 文本内容 */}
                        {message.content.text && (
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {message.content.text}
                          </div>
                        )}
                        
                        {/* 图片内容 */}
                        {message.content.image_url?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {message.content.image_url.map((url, imgIndex) => (
                              <img
                                key={imgIndex}
                                src={url}
                                alt={t('message.image', { index: imgIndex + 1 })}
                                className="h-24 w-24 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        )}
                        
                        {/* 函数调用 */}
                        {message.function_call && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700">
                              {t('message.function')}: {message.function_call.name}
                            </p>
                            <pre className="mt-1 text-xs text-gray-600 overflow-x-auto">
                              {message.function_call.arguments}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 元数据 */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{t('message.metadata')}</h4>
                    <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 