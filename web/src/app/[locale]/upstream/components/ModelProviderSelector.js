import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

const providers = [
  {
    name: 'OpenAI',
    logo: '/providers/openai.svg',
    descriptionKey: 'openai',
    capabilities: ['LLM'],
    baseUrl: 'https://api.openai.com/v1'
  },
  {
    name: '302AI',
    logo: '/providers/302.png',
    descriptionKey: '302ai',
    capabilities: ['LLM'],
    baseUrl: ''
  },
  {
    name: '云雾',
    logo: '/providers/yunwu.png',
    descriptionKey: 'yunwu',
    capabilities: ['LLM'],
    baseUrl: ''
  },
  {
    name: 'OpenAI 兼容接口',
    logo: '/providers/openai.svg',
    descriptionKey: 'openaiCompatible',
    capabilities: ['LLM'],
    baseUrl: ''
  }
];

export default function ModelProviderSelector({ isOpen, onClose, onSelect }) {
  const t = useTranslations('app.upstream.modelProvider')

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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {providers.map((provider) => (
                    <div
                      key={provider.name}
                      onClick={() => {
                        onSelect(provider);
                        onClose();
                      }}
                      className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative w-8 h-8">
                          <Image
                            src={provider.logo}
                            alt={provider.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <h3 className="font-medium">{t(`providers.${provider.descriptionKey}.name`)}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {t(`providers.${provider.descriptionKey}.description`)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {provider.capabilities.map((capability) => (
                          <span
                            key={capability}
                            className="text-xs px-2 py-1 bg-secondary rounded-full"
                          >
                            {t(`capabilities.${capability.toLowerCase()}`)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 