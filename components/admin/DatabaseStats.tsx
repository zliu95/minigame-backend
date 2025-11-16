'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface DatabaseStats {
  tables: Array<{
    table_name: string
    row_count: bigint
    total_size: string
    table_size: string
    index_size: string
  }>
  connections: Array<{
    state: string
    count: bigint
  }>
  recommendations: string[]
  timestamp: string
}

interface IndexStats {
  table_name: string
  index_name: string
  index_scans: bigint
  tuples_read: bigint
  tuples_fetched: bigint
}

export default function DatabaseStats() {
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [indexStats, setIndexStats] = useState<IndexStats[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'indexes' | 'connections'>('overview')

  const fetchStats = async (type: string = 'overview') => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/db-stats?type=${type}`)
      const data = await response.json()
      
      if (data.success) {
        if (type === 'overview') {
          setStats(data.data)
        } else if (type === 'indexes') {
          setIndexStats(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch database stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats(activeTab)
  }, [activeTab])

  const formatBytes = (bytes: string) => {
    return bytes || '0 bytes'
  }

  const formatNumber = (num: bigint) => {
    return num.toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">数据库性能监控</h2>
        <Button 
          onClick={() => fetchStats(activeTab)} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? '刷新中...' : '刷新数据'}
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: '概览' },
            { key: 'indexes', label: '索引使用' },
            { key: 'connections', label: '连接状态' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Performance Recommendations */}
          {stats.recommendations.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">性能建议</h3>
              <ul className="list-disc list-inside space-y-1">
                {stats.recommendations.map((rec, index) => (
                  <li key={index} className="text-yellow-700">{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Table Statistics */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">表统计信息</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        表名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        行数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        总大小
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        表大小
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        索引大小
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.tables.map((table, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {table.table_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatNumber(table.row_count)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatBytes(table.total_size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatBytes(table.table_size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatBytes(table.index_size)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Connection Statistics */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">连接状态</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.connections.map((conn, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">{conn.state}</div>
                    <div className="text-2xl font-bold text-gray-900">{formatNumber(conn.count)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Index Usage Tab */}
      {activeTab === 'indexes' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">索引使用统计</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      表名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      索引名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      扫描次数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      读取行数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      获取行数
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {indexStats.map((index, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index.table_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index.index_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(index.index_scans)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(index.tuples_read)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(index.tuples_fetched)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      {stats && (
        <div className="text-sm text-gray-500">
          最后更新: {new Date(stats.timestamp).toLocaleString('zh-CN')}
        </div>
      )}
    </div>
  )
}