import { useState, useEffect } from 'react'
import { LogsAPI } from '@/services/api'
import { DatePicker } from '@/app/components/ui/date-picker'
import { Input } from '@/app/components/ui/input'
import { Button } from '@/app/components/ui/button'
import { Spinner } from '@/app/components/ui/spinner'
import { toast } from 'react-hot-toast'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { ChevronDownIcon, FunnelIcon } from '@heroicons/react/20/solid'
import SystemLogDetail from './SystemLogDetail'
import { useTranslations } from 'next-intl'

const levelColorMap = {
  info: 'bg-blue-100 text-blue-800',
  warn: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  debug: 'bg-gray-100 text-gray-800'
}

const levelOptions = [
  { value: '', label: 'levels.all' },
  { value: 'info', label: 'levels.info' },
  { value: 'warn', label: 'levels.warn' },
  { value: 'error', label: 'levels.error' },
  { value: 'debug', label: 'levels.debug' }
]

export default function SystemLogs() {
  const t = useTranslations('app.systemLogs')
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
    level: '',
    service: '',
    userId: '',
    ip: '',
    requestId: '',
    message: ''
  })

  // 详情弹窗状态
  const [selectedLog, setSelectedLog] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // 高级筛选状态
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // 获取日志数据
  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await LogsAPI.getSystemLogs({
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
      const data = await LogsAPI.exportSystemLogs(filters)
      
      // 创建 Blob 对象
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      
      // 创建临时链接并点击下载
      const link = document.createElement('a')
      link.href = url
      link.download = 'system_logs.csv'
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

  // 清理日志
  const handleClear = async (days) => {
    try {
      const result = await LogsAPI.clearSystemLogs(days)
      toast.success(result.message)
      fetchLogs() // 重新加载数据
    } catch (err) {
      toast.error(err.message)
    }
  }

  // 查看日志详情
  const handleViewDetail = async (logId) => {
    try {
      const detail = await LogsAPI.getSystemLogDetail(logId)
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

  // 重置筛选条件
  const handleResetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      level: '',
      service: '',
      userId: '',
      ip: '',
      requestId: '',
      message: ''
    })
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* 基础筛选器和操作按钮 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 p-4 bg-white rounded-lg shadow">
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
        <select
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          value={filters.level}
          onChange={(e) => handleFilterChange('level', e.target.value)}
        >
          {levelOptions.map(option => (
            <option key={option.value} value={option.value}>
              {t(option.label)}
            </option>
          ))}
        </select>
        <Input
          placeholder={t('filters.service')}
          value={filters.service}
          onChange={(e) => handleFilterChange('service', e.target.value)}
        />
        <Button
          onClick={handleExport}
          disabled={exporting}
          className="h-full"
        >
          {exporting ? t('filters.exporting') : t('filters.export')}
        </Button>
        
        {/* 清理日志下拉菜单 */}
        <Menu as="div" className="relative">
          <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            {t('filters.clean')}
            <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {[3, 7, 30].map(days => (
                  <Menu.Item key={days}>
                    {({ active }) => (
                      <button
                        onClick={() => handleClear(days)}
                        className={`
                          ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}
                          block w-full px-4 py-2 text-left text-sm
                        `}
                      >
                        {t(`filters.cleanDays.${days}`)}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

        {/* 高级筛选按钮 */}
        <Button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <FunnelIcon className="h-4 w-4" />
          {t('filters.advancedFilter')}
        </Button>
      </div>

      {/* 高级筛选选项 */}
      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-white rounded-lg shadow">
          <Input
            placeholder={t('filters.userId')}
            value={filters.userId}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
          />
          <Input
            placeholder={t('filters.ip')}
            value={filters.ip}
            onChange={(e) => handleFilterChange('ip', e.target.value)}
          />
          <Input
            placeholder={t('filters.requestId')}
            value={filters.requestId}
            onChange={(e) => handleFilterChange('requestId', e.target.value)}
          />
          <Input
            placeholder={t('filters.message')}
            value={filters.message}
            onChange={(e) => handleFilterChange('message', e.target.value)}
          />
          <Button
            onClick={handleResetFilters}
            variant="outline"
            className="col-span-full"
          >
            {t('filters.resetFilters')}
          </Button>
        </div>
      )}

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
                {t('table.level')}
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                {t('table.message')}
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                {t('table.service')}
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                {t('table.userId')}
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                {t('table.ip')}
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                {t('table.time')}
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
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${levelColorMap[log.level]}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 max-w-md truncate">
                    {log.message}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.service || '-'}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.user_id || '-'}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.ip || '-'}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
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
      <SystemLogDetail
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