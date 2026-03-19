import React, { useState, useEffect } from 'react'
import { getSettings, saveSettings, toggleTracking } from '../utils/api'
import { logout } from '../utils/auth'

interface SettingsData {
  aiApiKey: string
  aiProvider: 'ernie' | 'doubao'
  autoStartOnBoot: boolean
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>({
    aiApiKey: '',
    aiProvider: 'ernie',
    autoStartOnBoot: true
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [trackingStatus, setTrackingStatus] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await getSettings()
      setSettings(res.data)
      setTrackingStatus(res.data.tracking)
    } catch (error) {
      console.error('加载设置失败', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await saveSettings(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('保存失败', error)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleTracking = async () => {
    const newStatus = await toggleTracking(!trackingStatus)
    setTrackingStatus(newStatus)
  }

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout()
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">设置</h2>
        <p className="text-gray-500">配置AI和应用偏好</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 space-y-6">
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div>
            <h3 className="font-semibold text-gray-900">追踪状态</h3>
            <p className="text-sm text-gray-500">
              {trackingStatus ? '当前正在记录你的活动' : '当前已暂停记录'}
            </p>
          </div>
          <button 
            onClick={handleToggleTracking}
            className={`px-4 py-2 rounded-lg font-medium ${
              trackingStatus 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {trackingStatus ? '暂停追踪' : '开始追踪'}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI 提供商
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input 
                type="radio" 
                value="ernie" 
                checked={settings.aiProvider === 'ernie'}
                onChange={(e) => setSettings({...settings, aiProvider: e.target.value as any})}
                className="mr-2"
              />
              百度文心一言
            </label>
            <label className="flex items-center">
              <input 
                type="radio" 
                value="doubao" 
                checked={settings.aiProvider === 'doubao'}
                onChange={(e) => setSettings({...settings, aiProvider: e.target.value as any})}
                className="mr-2"
              />
              字节豆包
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            选择你使用的大模型API，需要自己申请API密钥
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API 密钥
          </label>
          <input 
            type="password" 
            value={settings.aiApiKey}
            onChange={(e) => setSettings({...settings, aiApiKey: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="填入你的API密钥"
          />
          <p className="text-xs text-gray-500 mt-1">
            密钥只保存在本地，不会上传到我们的服务器
          </p>
        </div>

        <div>
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={settings.autoStartOnBoot}
              onChange={(e) => setSettings({...settings, autoStartOnBoot: e.target.checked})}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">开机自动启动</span>
          </label>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
          {saved && (
            <p className="text-center text-green-600 text-sm mt-2">
              ✓ 设置已保存
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
          >
            退出登录
          </button>
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <h4 className="font-semibold text-yellow-800 mb-2">💡 提示</h4>
        <p className="text-sm text-yellow-700">
          AI用于自动分类你的活动。如果你没有API密钥，可以先手动分类，不影响基本使用。
        </p>
      </div>
    </div>
  )
}

export default Settings
