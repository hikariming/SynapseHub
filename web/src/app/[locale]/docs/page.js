'use client'

import { useTranslations } from 'next-intl'
import NavbarClient from '@/app/components/navigation/NavbarClient'
import { useLocale } from 'next-intl'

export default function Docs() {
  const t = useTranslations('app.docs')
  const locale = useLocale()

  return (
    <div className="min-h-screen bg-gray-100">
      <NavbarClient currentLocale={locale} />
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-600">{t('title')} 🔄</h1>
            <p className="mt-2 text-gray-600">{t('subtitle')}</p>
          </div>

          {/* 基础信息 */}
          <div className="bg-white shadow rounded-lg mb-8 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('baseInfo.title')}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{t('baseInfo.baseUrl')}</h3>
                <p className="mt-1 text-gray-600">https://your-api-domain.com/v1</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{t('baseInfo.auth.title')}</h3>
                <p className="mt-1 text-gray-600">{t('baseInfo.auth.description')}</p>
                <pre className="mt-2 bg-gray-50 p-4 rounded-md">
                  <code>Authorization: Bearer your-api-token</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Chat Completions API */}
          <div className="bg-white shadow rounded-lg mb-8 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('chatApi.title')}</h2>
            
            {/* 端点信息 */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900">{t('chatApi.endpoint.title')}</h3>
              <p className="mt-1 text-gray-600">{t('chatApi.endpoint.description')}</p>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">{t('chatApi.curl.title')}</h4>
                <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                  <code>{`curl https://your-api-domain.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your-api-token" \\
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "user",
        "content": "你好！"
      }
    ]
  }'`}</code>
                </pre>
              </div>
            </div>

            {/* 请求参数 */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900">{t('chatApi.parameters.title')}</h3>
              <div className="mt-4 border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('chatApi.parameters.headers.name')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('chatApi.parameters.headers.type')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('chatApi.parameters.headers.required')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('chatApi.parameters.headers.description')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {t('chatApi.parameters.model.name')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">string</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">✓</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {t('chatApi.parameters.model.description')}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {t('chatApi.parameters.messages.name')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">array</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">✓</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {t('chatApi.parameters.messages.description')}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {t('chatApi.parameters.stream.name')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">boolean</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {t('chatApi.parameters.stream.description')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 非流式响应示例 */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('chatApi.responses.normal.title')}</h3>
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                <code>{`{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "你好！我能帮你什么忙？"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 12,
    "total_tokens": 21
  }
}`}</code>
              </pre>
            </div>

            {/* 流式响应示例 */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('chatApi.responses.stream.title')}</h3>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">{t('chatApi.curl.streamTitle')}</h4>
                <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto mb-4">
                  <code>{`curl https://your-api-domain.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your-api-token" \\
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "user",
        "content": "你好！"
      }
    ],
    "stream": true
  }'`}</code>
                </pre>
              </div>
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                <code>{`data: {
  "id": "chatcmpl-123",
  "object": "chat.completion.chunk",
  "created": 1677652288,
  "choices": [{
    "index": 0,
    "delta": {
      "role": "assistant",
      "content": "你"
    },
    "finish_reason": null
  }]
}

data: {
  "id": "chatcmpl-123",
  "object": "chat.completion.chunk",
  "created": 1677652288,
  "choices": [{
    "index": 0,
    "delta": {
      "content": "好"
    },
    "finish_reason": null
  }]
}

data: [DONE]`}</code>
              </pre>
            </div>

            {/* 错误响应 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('chatApi.responses.error.title')}</h3>
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                <code>{`{
  "error": {
    "message": "错误信息",
    "type": "invalid_request_error",
    "code": 400,
    "request_id": "req_123"
  }
}`}</code>
              </pre>
            </div>
          </div>

          {/* Dify 格式 API */}
          <div className="bg-white shadow rounded-lg mb-8 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('difyApi.title')}</h2>
            
            {/* 端点信息 */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900">{t('difyApi.endpoint.title')}</h3>
              <p className="mt-1 text-gray-600">{t('difyApi.endpoint.description')}</p>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">{t('difyApi.curl.title')}</h4>
                <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                  <code>{`curl https://your-api-domain.com/dify/v1/chat-messages \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your-api-token" \\
  -d '{
    "query": "你好！",
    "user": "user_123",
    "response_mode": "streaming",
    "conversation_id": "conv_123",
    "inputs": {}
  }'`}</code>
                </pre>
              </div>
            </div>

            {/* 请求参数 */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900">{t('difyApi.parameters.title')}</h3>
              <div className="mt-4 border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('difyApi.parameters.headers.name')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('difyApi.parameters.headers.type')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('difyApi.parameters.headers.required')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('difyApi.parameters.headers.description')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">query</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">string</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">✓</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{t('difyApi.parameters.query.description')}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">user</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">string</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">✓</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{t('difyApi.parameters.user.description')}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">response_mode</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">string</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{t('difyApi.parameters.responseMode.description')}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">conversation_id</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">string</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{t('difyApi.parameters.conversationId.description')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 响应示例 */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('difyApi.responses.normal.title')}</h3>
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                <code>{`{
  "message_id": "msg_123",
  "conversation_id": "conv_123",
  "mode": "chat",
  "answer": "你好！我能帮你什么忙？",
  "metadata": {
    "usage": {
      "prompt_tokens": 9,
      "completion_tokens": 12,
      "total_tokens": 21
    },
    "retriever_resources": []
  },
  "created_at": 1677652288
}`}</code>
              </pre>
            </div>

            {/* 流式响应示例 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('difyApi.responses.stream.title')}</h3>
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                <code>{`data: {
  "event": "message",
  "conversation_id": "conv_123",
  "message_id": "msg_123",
  "created_at": 1677652288,
  "task_id": "task_123",
  "id": "msg_123",
  "answer": "你",
  "from_variable_selector": null
}

data: {
  "event": "message",
  "conversation_id": "conv_123",
  "message_id": "msg_123",
  "created_at": 1677652288,
  "task_id": "task_123",
  "id": "msg_123",
  "answer": "好",
  "from_variable_selector": null
}

data: {
  "event": "message_end",
  "conversation_id": "conv_123",
  "message_id": "msg_123",
  "created_at": 1677652288,
  "task_id": "task_123",
  "id": "msg_123",
  "metadata": {
    "usage": {
      "prompt_tokens": 9,
      "completion_tokens": 12,
      "total_tokens": 21
    }
  },
  "files": null
}`}</code>
              </pre>
            </div>
          </div>

          {/* 使用说明 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('usage.title')}</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{t('usage.billing.title')}</h3>
                <p className="mt-1 text-gray-600">{t('usage.billing.description')}</p>
                <ul className="list-disc list-inside mt-2 text-gray-600">
                  <li>{t('usage.billing.rules.separate')}</li>
                  <li>{t('usage.billing.rules.different')}</li>
                  <li>{t('usage.billing.rules.same')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">{t('usage.bestPractices.title')}</h3>
                <ul className="list-disc list-inside mt-2 text-gray-600">
                  <li>{t('usage.bestPractices.tips.stream')}</li>
                  <li>{t('usage.bestPractices.tips.timeout')}</li>
                  <li>{t('usage.bestPractices.tips.error')}</li>
                  <li>{t('usage.bestPractices.tips.history')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
