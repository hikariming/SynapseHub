'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import * as echarts from 'echarts'
import { DashboardAPI } from '@/services/api'

const timeRanges = [
  { key: '24h', days: 1 },
  { key: '7d', days: 7 },
  { key: '30d', days: 30 },
  { key: '6m', days: 180 },
  { key: '1y', days: 365 }
]

export default function TrendChart() {
  const t = useTranslations('app')
  const chartRef = useRef(null)
  const [selectedRange, setSelectedRange] = useState('24h')
  const [chartInstance, setChartInstance] = useState(null)
  const [loading, setLoading] = useState(false)

  // 初始化图表
  useEffect(() => {
    if (!chartRef.current) return

    const chart = echarts.init(chartRef.current)
    setChartInstance(chart)

    const handleResize = () => {
      chart.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [])

  // 获取并更新数据
  useEffect(() => {
    const fetchData = async () => {
      if (!chartInstance) return
      
      setLoading(true)
      try {
        // TODO: 替换为实际的API调用
        const range = timeRanges.find(r => r.key === selectedRange)
        const data = await DashboardAPI.getTrends(range.days)
        
        const option = {
          title: {
            text: t('stats.trendTitle'),
            left: 'center',
            top: 0,
            textStyle: {
              color: '#111827',
              fontSize: 16,
              fontWeight: 500
            }
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            }
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '15%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: data.dates,
            axisLabel: {
              color: '#4B5563'
            },
            axisLine: {
              lineStyle: {
                color: '#E5E7EB'
              }
            }
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              color: '#4B5563'
            },
            splitLine: {
              lineStyle: {
                color: '#E5E7EB'
              }
            }
          },
          series: [
            {
              name: t('stats.calls'),
              type: 'line',
              smooth: true,
              data: data.calls,
              itemStyle: {
                color: '#F59E0B'
              },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  {
                    offset: 0,
                    color: 'rgba(245, 158, 11, 0.3)'
                  },
                  {
                    offset: 1,
                    color: 'rgba(245, 158, 11, 0.1)'
                  }
                ])
              }
            }
          ]
        }

        chartInstance.setOption(option)
      } catch (error) {
        console.error('Failed to fetch trend data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [chartInstance, selectedRange, t])

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{t('stats.trendTitle')}</h3>
        <div className="flex gap-2">
          {timeRanges.map(({ key }) => (
            <button
              key={key}
              onClick={() => setSelectedRange(key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                ${selectedRange === key
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-amber-50'
                }
              `}
            >
              {t(`stats.timeRanges.${key}`)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent"></div>
          </div>
        )}
        <div 
          ref={chartRef} 
          className="w-full h-[400px] bg-white rounded-xl shadow-lg border border-gray-100"
        />
      </div>
    </div>
  )
} 