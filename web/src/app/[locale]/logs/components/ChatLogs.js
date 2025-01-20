'use client'

import { useState, useEffect } from 'react'
import { LogsAPI } from '@/services/api'
import { DatePicker } from '@/app/components/ui/date-picker'
import { Input } from '@/app/components/ui/input'
import { Button } from '@/app/components/ui/button'
import { Spinner } from '@/app/components/ui/spinner'
import { toast } from 'react-hot-toast'
import ChatLogDetail from './ChatLogDetail'
import { useTranslations } from 'next-intl'

export default function ChatLogs() {
  const t = useTranslations('app.chatLogs')
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)
  
  // 分页状态
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(10)
  
  // 筛选状态
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    userId: '',
    modelName: '',
    conversationId: ''
  })

  // 详情弹窗状态
  const [selectedLog, setSelectedLog] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // 获取日志数据
  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await LogsAPI.getChatLogs({
        page,
        limit,
        ...filters
      })
      setLogs(response.data)
      setTotalPages(Math.ceil(response.total / limit))
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 导出日志
  const handleExport = async () => {
    try {
      setExporting(true)
      const data = await LogsAPI.exportLogs(filters)
      
      // 创建 Blob 对象
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      
      // 创建临时链接并点击下载
      const link = document.createElement('a')
      link.href = url
      link.download = 'chat_logs.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('导出成功')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setExporting(false)
    }
  }

  // 查看日志详情
  const handleViewDetail = async (logId) => {
    try {
      const detail = await LogsAPI.getChatLogDetail(logId)
      setSelectedLog(detail)
      setIsDetailOpen(true)
    } catch (err) {
      toast.error(err.message)
    }
  }

  // 监听分页和筛选变化
  useEffect(() => {
    fetchLogs()
  }, [page, filters])

  // 处理筛选变化
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // 重置页码
  }

  return (
    <div className="space-y-4">
      {/* 筛选器 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-white rounded-lg shadow">
        <DatePicker
          placeholder={t('filters.startDate')}
          value={filters.startDate}
          onChange={(date) => handleFilterChange('startDate', date)}
        />
        <DatePicker
          placeholder={t('filters.endDate')}
          value={filters.endDate}
          onChange={(date) => handleFilterChange('endDate', date)}
        />
        <Input
          placeholder={t('filters.userId')}
          value={filters.userId}
          onChange={(e) => handleFilterChange('userId', e.target.value)}
        />
        <Input
          placeholder={t('filters.modelName')}
          value={filters.modelName}
          onChange={(e) => handleFilterChange('modelName', e.target.value)}
        />
        <Input
          placeholder={t('filters.conversationId')}
          value={filters.conversationId}
          onChange={(e) => handleFilterChange('conversationId', e.target.value)}
        />
        <Button
          onClick={handleExport}
          disabled={exporting}
          className="h-full"
        >
          {exporting ? t('filters.exporting') : t('filters.export')}
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4 text-red-500 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {/* 数据表格 */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                {t('table.userId')}
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                {t('table.conversationId')}
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                {t('table.model')}
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                {t('table.messageCount')}
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                {t('table.totalTokens')}
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                {t('table.createdAt')}
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">{t('table.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  <Spinner />
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  {t('table.noData')}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {log.user_id}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.conversation_id}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.modelName}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.messages?.length || 0}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.total_tokens || '-'}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      className="text-indigo-600 hover:text-indigo-900"
                      onClick={() => handleViewDetail(log._id)}
                    >
                      {t('table.viewDetails')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex justify-between w-full">
          <div className="text-sm text-gray-700">
            {t('table.page', { page })}，
            {t('table.totalPages', { totalPages })}
          </div>
          <div className="space-x-2">
            <Button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1 || loading}
            >
              {t('table.prev')}
            </Button>
            <Button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages || loading}
            >
              {t('table.next')}
            </Button>
          </div>
        </div>
      </div>

      {/* 详情弹窗 */}
      <ChatLogDetail
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedLog(null)
        }}
        log={selectedLog}
      />
    </div>
  )
} 