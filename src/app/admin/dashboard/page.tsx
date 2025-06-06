'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 定义激活码接口
interface ActivationCode {
  id: number
  code: string
  isUsed: boolean
  usedAt: string | null
  usedBy: string | null
  createdAt: string
  expiresAt: string | null
}

// 定义统计数据接口
interface Stats {
  total: number
  used: number
  expired: number
  active: number
}

type TabType = 'generate' | 'list' | 'stats' | 'changePassword' | 'systemConfig'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('stats')
  const [amount, setAmount] = useState(1)
  const [expiryDays, setExpiryDays] = useState(30)
  const [loading, setLoading] = useState(false)
  const [generatedCodes, setGeneratedCodes] = useState<ActivationCode[]>([])
  const [allCodes, setAllCodes] = useState<ActivationCode[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, used: 0, expired: 0, active: 0 })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'unused' | 'used' | 'expired'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [systemConfigs, setSystemConfigs] = useState<any[]>([])
  const router = useRouter()

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/codes/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }

  // 获取系统配置
  const fetchSystemConfigs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/system-config')
      const data = await response.json()
      if (data.success) {
        setSystemConfigs(data.configs)
      } else {
        setMessage(data.message || '获取系统配置失败')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('网络错误，请重试')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // 获取所有激活码
  const fetchAllCodes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/codes/list')
      const data = await response.json()
      if (data.success) {
        setAllCodes(data.codes)
      } else {
        setMessage(data.message || '获取激活码列表失败')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('网络错误，请重试')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // 删除激活码
  const handleDeleteCode = async (id: number) => {
    if (!confirm('确定要删除这个激活码吗？')) return

    try {
      const response = await fetch(`/api/admin/codes/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      const data = await response.json()
      if (data.success) {
        setMessage('激活码删除成功')
        setMessageType('success')
        fetchAllCodes()
        fetchStats()
      } else {
        setMessage(data.message || '删除失败')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('网络错误，请重试')
      setMessageType('error')
    }
  }

  // 清理过期激活码
  const handleCleanupExpired = async () => {
    if (!confirm('确定要清理所有过期激活码的绑定关系吗？这将允许之前绑定过期激活码的机器使用新激活码。')) return

    try {
      setLoading(true)
      const response = await fetch('/api/admin/codes/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      if (data.success) {
        setMessage(data.message)
        setMessageType('success')
        fetchAllCodes()
        fetchStats()
      } else {
        setMessage(data.message || '清理失败')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('网络错误，请重试')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    if (activeTab === 'list') {
      fetchAllCodes()
    }
    if (activeTab === 'systemConfig') {
      fetchSystemConfigs()
    }
  }, [activeTab])

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage('请填写所有密码字段')
      setMessageType('error')
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage('新密码与确认密码不匹配')
      setMessageType('error')
      return
    }

    if (newPassword.length < 6) {
      setMessage('新密码长度不能少于6位')
      setMessageType('error')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage(data.message)
        setMessageType('success')
        // 清空表单
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        // 延迟3秒后自动登出
        setTimeout(() => {
          handleLogout()
        }, 3000)
      } else {
        setMessage(data.message || '密码修改失败')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('网络错误，请重试')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // 处理系统配置更新
  const handleUpdateSystemConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/system-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configs: systemConfigs }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage(data.message)
        setMessageType('success')
      } else {
        setMessage(data.message || '系统配置更新失败')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('网络错误，请重试')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // 更新配置项值
  const updateConfigValue = (key: string, value: any) => {
    setSystemConfigs(prev => 
      prev.map(config => 
        config.key === key ? { ...config, value } : config
      )
    )
  }

  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/codes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, expiryDays }),
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedCodes(data.codes)
        setMessage(data.message)
        setMessageType('success')
        fetchStats() // 更新统计数据
      } else {
        setMessage(data.message || '生成失败')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('网络错误，请重试')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage('已复制到剪贴板')
    setMessageType('success')
  }

  const exportCodes = (codes: ActivationCode[]) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "激活码,状态,创建时间,过期时间,使用时间,使用者\n"
      + codes.map(code => 
          `${code.code},${code.isUsed ? '已使用' : '未使用'},${new Date(code.createdAt).toLocaleString()},${code.expiresAt ? new Date(code.expiresAt).toLocaleString() : '无限期'},${code.usedAt ? new Date(code.usedAt).toLocaleString() : ''},${code.usedBy || ''}`
        ).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `activation_codes_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 筛选激活码
  const filteredCodes = allCodes.filter(code => {
    const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (code.usedBy && code.usedBy.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const now = new Date()
    const isExpired = code.expiresAt ? new Date(code.expiresAt) < now : false
    
    let matchesStatus = true
    switch (statusFilter) {
      case 'unused':
        matchesStatus = !code.isUsed && !isExpired
        break
      case 'used':
        matchesStatus = code.isUsed
        break
      case 'expired':
        matchesStatus = isExpired && !code.isUsed
        break
    }
    
    return matchesSearch && matchesStatus
  })

  // 分页逻辑
  const totalPages = Math.ceil(filteredCodes.length / itemsPerPage)
  const paginatedCodes = filteredCodes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const getStatusBadge = (code: ActivationCode) => {
    const now = new Date()
    const isExpired = code.expiresAt ? new Date(code.expiresAt) < now : false

    if (code.isUsed) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">已使用</span>
    } else if (isExpired) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">已过期</span>
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">可用</span>
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">激活码管理后台</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            登出
          </button>
        </div>

        {/* 导航标签 */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              数据统计
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'generate'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              生成激活码
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              激活码管理
            </button>
            <button
              onClick={() => setActiveTab('changePassword')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'changePassword'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              修改密码
            </button>
            <button
              onClick={() => setActiveTab('systemConfig')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'systemConfig'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              系统配置
            </button>
          </nav>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`mb-4 p-4 rounded-md ${
            messageType === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* 数据统计标签页 */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">总</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          总激活码数
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.total}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">用</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          已使用
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.used}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">期</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          已过期
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.expired}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">活</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          可用激活码
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.active}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 使用率图表 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">使用率统计</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>已使用</span>
                    <span>{stats.total > 0 ? Math.round((stats.used / stats.total) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.used / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>已过期</span>
                    <span>{stats.total > 0 ? Math.round((stats.expired / stats.total) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.expired / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>可用</span>
                    <span>{stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 生成激活码标签页 */}
        {activeTab === 'generate' && (
          <div className="space-y-6">
            {/* 生成激活码表单 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">生成激活码</h2>
              
              <form onSubmit={handleGenerateCodes} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    生成数量
                  </label>
                  <input
                    type="number"
                    id="amount"
                    min="1"
                    max="100"
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="expiryDays" className="block text-sm font-medium text-gray-700 mb-2">
                    有效期（天）
                  </label>
                  <input
                    type="number"
                    id="expiryDays"
                    min="1"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  >
                    {loading ? '生成中...' : '生成激活码'}
                  </button>
                </div>
              </form>
            </div>

            {/* 生成的激活码列表 */}
            {generatedCodes.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">本次生成的激活码</h2>
                  <button
                    onClick={() => exportCodes(generatedCodes)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    导出CSV
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          激活码
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          创建时间
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          过期时间
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {generatedCodes.map((code) => (
                        <tr key={code.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {code.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(code.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {code.expiresAt ? new Date(code.expiresAt).toLocaleString() : '无限期'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => copyToClipboard(code.code)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              复制
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 激活码管理标签页 */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            {/* 搜索和筛选 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    搜索激活码或机器ID
                  </label>
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="输入激活码或机器ID"
                  />
                </div>
                
                                 <div>
                   <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                     状态筛选
                   </label>
                   <select
                     id="status"
                     value={statusFilter}
                     onChange={(e) => setStatusFilter(e.target.value as 'all' | 'unused' | 'used' | 'expired')}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                   >
                    <option value="all">全部</option>
                    <option value="unused">未使用</option>
                    <option value="used">已使用</option>
                    <option value="expired">已过期</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => exportCodes(filteredCodes)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    导出筛选结果
                  </button>
                </div>
              </div>
            </div>

                         {/* 激活码列表 */}
             <div className="bg-white rounded-lg shadow-lg p-6">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-semibold text-gray-800">
                   激活码列表 ({filteredCodes.length} 条记录)
                 </h2>
                 <button
                   onClick={handleCleanupExpired}
                   disabled={loading}
                   className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                   title="清理过期激活码的绑定关系，允许绑定过期码的机器使用新激活码"
                 >
                   清理过期绑定
                 </button>
               </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">加载中...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            激活码
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            状态
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            创建时间
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            过期时间
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            使用时间
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            使用者
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedCodes.map((code) => (
                          <tr key={code.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                              {code.code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(code)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(code.createdAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {code.expiresAt ? new Date(code.expiresAt).toLocaleString() : '无限期'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {code.usedAt ? new Date(code.usedAt).toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {code.usedBy || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => copyToClipboard(code.code)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                复制
                              </button>
                              <button
                                onClick={() => handleDeleteCode(code.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                删除
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 分页 */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        显示第 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredCodes.length)} 条，共 {filteredCodes.length} 条记录
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          上一页
                        </button>
                        <div className="flex space-x-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1 text-sm rounded-md ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          下一页
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* 修改密码标签页 */}
        {activeTab === 'changePassword' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">修改管理员密码</h2>
              
              <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    当前密码
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入当前密码"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    新密码
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入新密码（至少6位）"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    确认新密码
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请再次输入新密码"
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  {loading ? '修改中...' : '修改密码'}
                </button>
              </form>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-sm text-yellow-800">
                  <strong>注意事项：</strong>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>新密码长度不能少于6位</li>
                    <li>密码修改成功后将自动登出，需要使用新密码重新登录</li>
                    <li>请确保妥善保管新密码</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 系统配置标签页 */}
        {activeTab === 'systemConfig' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">系统配置管理</h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">加载中...</p>
                </div>
              ) : (
                <form onSubmit={handleUpdateSystemConfig} className="space-y-6">
                  {systemConfigs.map((config) => (
                    <div key={config.key} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {config.key}
                        </label>
                        <span className="text-xs text-gray-500">{config.description}</span>
                      </div>
                      
                      {config.key === 'allowedIPs' ? (
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600 mb-2">IP白名单（每行一个IP地址）：</div>
                          <textarea
                            value={Array.isArray(config.value) ? config.value.join('\n') : config.value}
                            onChange={(e) => {
                              const ips = e.target.value.split('\n').filter(ip => ip.trim())
                              updateConfigValue(config.key, ips)
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            rows={4}
                            placeholder="127.0.0.1&#10;::1"
                          />
                        </div>
                      ) : config.key === 'bcryptRounds' ? (
                        <div>
                          <input
                            type="number"
                            min="4"
                            max="15"
                            value={config.value}
                            onChange={(e) => updateConfigValue(config.key, parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="12"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            推荐值：10-12（值越大越安全但计算越慢）
                          </div>
                        </div>
                      ) : config.key === 'jwtExpiresIn' ? (
                        <div>
                          <select
                            value={config.value}
                            onChange={(e) => updateConfigValue(config.key, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="1h">1小时</option>
                            <option value="6h">6小时</option>
                            <option value="12h">12小时</option>
                            <option value="24h">24小时</option>
                            <option value="7d">7天</option>
                          </select>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={config.value}
                          onChange={(e) => updateConfigValue(config.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`请输入${config.description || config.key}`}
                        />
                      )}
                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  >
                    {loading ? '保存中...' : '保存配置'}
                  </button>
                </form>
              )}

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm text-blue-800">
                  <strong>配置说明：</strong>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li><strong>allowedIPs</strong>：允许访问管理后台的IP地址白名单</li>
                    <li><strong>jwtSecret</strong>：JWT令牌加密密钥（修改后所有用户需重新登录）</li>
                    <li><strong>jwtExpiresIn</strong>：JWT令牌有效期</li>
                    <li><strong>bcryptRounds</strong>：密码加密强度（4-15，推荐10-12）</li>
                    <li><strong>systemName</strong>：系统显示名称</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-sm text-yellow-800">
                  <strong>注意事项：</strong>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>修改JWT密钥后，所有已登录用户需要重新登录</li>
                    <li>修改IP白名单时请确保包含当前访问IP，否则可能被锁定</li>
                    <li>配置修改立即生效，请谨慎操作</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
} 