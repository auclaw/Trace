import { useState, useEffect, useCallback } from 'react'
import type { Theme } from '../App'
import { apiRequest } from '../utils/api'

interface FlowBlock {
  id: number
  domain: string
  enabled: boolean
}

interface FlowBlocksProps {
  theme: Theme
}

const FlowBlocks: React.FC<FlowBlocksProps> = ({ theme }) => {
  const isDark = theme === 'dark'
  const [loading, setLoading] = useState(true)
  const [blocks, setBlocks] = useState<FlowBlock[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newDomain, setNewDomain] = useState('')

  const loadBlocks = useCallback(async () => {
    try {
      const response = await apiRequest('/api/flow-blocks', 'GET')
      if (response.code === 200) {
        setBlocks(response.data.blocks)
      }
    } catch (error) {
      console.error('加载屏蔽列表失败', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const addBlock = async () => {
    let domain = newDomain.trim().toLowerCase()
    if (!domain) {
      alert('域名不能为空')
      return
    }
    // Clean up domain - remove http/https/www
    domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
    try {
      const response = await apiRequest('/api/flow-blocks/create', 'POST', {
        domain: domain
      })
      if (response.code === 200) {
        setNewDomain('')
        setShowAdd(false)
        loadBlocks()
      }
    } catch (error) {
      console.error('添加失败', error)
      alert('添加失败')
    }
  }

  const toggleBlock = async (id: number, currentEnabled: boolean) => {
    try {
      await apiRequest('/api/flow-blocks/toggle', 'POST', {
        id: id,
        enabled: !currentEnabled
      })
      loadBlocks()
    } catch (error) {
      console.error('更新失败', error)
      alert('更新失败')
    }
  }

  const deleteBlock = async (id: number) => {
    if (!confirm('确定要删除这个屏蔽规则吗？')) return
    try {
      await apiRequest('/api/flow-blocks/delete', 'POST', {
        id: id
      })
      loadBlocks()
    } catch (error) {
      console.error('删除失败', error)
      alert('删除失败')
    }
  }

  useEffect(() => {
    loadBlocks()
  }, [loadBlocks])

  const bgClass = isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
  const cardBgClass = isDark ? 'bg-gray-800' : 'bg-gray-50'
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200'
  const buttonPrimaryClass = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded'
  const buttonToggleOnClass = 'bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm'
  const buttonToggleOffClass = isDark
    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded text-sm'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-600 px-3 py-1 rounded text-sm'
  const buttonDeleteClass = 'bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm'

  if (loading) {
    return (
      <div className={`${bgClass} min-h-screen p-4`}>
        <div className="animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <div className={`${bgClass} min-h-screen p-4`}>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">分心屏蔽</h1>
            <p className="text-sm text-gray-500">
              在专注模式下自动屏蔽分心网站，帮你保持深度工作
            </p>
          </div>
          <button
            className={buttonPrimaryClass}
            onClick={() => setShowAdd(!showAdd)}
          >
            {showAdd ? '取消' : '+ 添加'}
          </button>
        </div>

        {/* Add New Block */}
        {showAdd && (
          <div className={`mb-6 p-4 border ${borderClass} rounded ${cardBgClass}`}>
            <h2 className="text-lg font-semibold mb-4">添加屏蔽域名</h2>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="例如：weibo.com 或 twitter.com"
                className={`flex-1 px-3 py-2 border ${borderClass} rounded ${isDark ? 'bg-gray-700' : 'bg-white'}`}
              />
              <button className={buttonPrimaryClass} onClick={addBlock}>
                添加
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              不需要输入 http:// 或 www.，会自动清理
            </p>
          </div>
        )}

        {/* Block List */}
        <div className="space-y-3">
          {blocks.length === 0 ? (
            <div className={`p-8 text-center border ${borderClass} rounded ${cardBgClass}`}>
              <p className="text-gray-500">还没有添加任何屏蔽规则</p>
              <p className="text-sm text-gray-400 mt-1">
                添加让你分心的网站，专注模式下会自动屏蔽它们
              </p>
            </div>
          ) : (
            blocks.map(block => (
              <div
                key={block.id}
                className={`p-4 border ${borderClass} rounded ${cardBgClass} flex justify-between items-center`}
              >
                <div className="font-medium">{block.domain}</div>
                <div className="flex items-center space-x-2">
                  <button
                    className={block.enabled ? buttonToggleOnClass : buttonToggleOffClass}
                    onClick={() => toggleBlock(block.id, block.enabled)}
                  >
                    {block.enabled ? '已启用' : '已禁用'}
                  </button>
                  <button
                    className={buttonDeleteClass}
                    onClick={() => deleteBlock(block.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* How it works */}
        <div className={`mt-8 p-4 border ${borderClass} rounded ${cardBgClass}`}>
          <h3 className="font-semibold mb-2">工作原理</h3>
          <ul className="text-sm space-y-1 text-gray-500 list-disc pl-5">
            <li>Merize 桌面端在专注模式激活时，会通过系统级方式屏蔽这些域名</li>
            <li>不同操作系统实现方式不同，都不会抓取你的网络流量</li>
            <li>只在你主动开启专注模式时生效，不影响正常浏览</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default FlowBlocks
