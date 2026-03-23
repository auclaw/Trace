import { useState, useEffect } from 'react'
import { getSettings, saveSettings, toggleTracking, checkTrackingStatus, getAllActivitiesExport } from '../utils/tracking'
import { Settings as SettingsType } from '../utils/tracking'
import { logout } from '../utils/auth'
import { apiRequest } from '../utils/api'
import type { Theme } from '../App'

type SubscriptionPlan = 'free' | 'personal' | 'business'

interface UserRole {
  hasOrgAdmin: boolean
  hasTeamLead: boolean
  hasAnyTeam: boolean
  plan: SubscriptionPlan
}

interface SettingsProps {
  theme: Theme
  toggleTheme: () => void
}

const Settings: React.FC<SettingsProps> = ({ theme, toggleTheme }) => {
  const isDark = theme === 'dark'
  const titleColor = isDark ? 'text-white' : 'text-gray-900'
  const textColor = isDark ? 'text-gray-400' : 'text-gray-500'
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white'
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200'
  const borderLight = isDark ? 'border-gray-600' : 'border-gray-100'
  const labelColor = isDark ? 'text-gray-300' : 'text-gray-700'
  const inputBg = isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
  const tagBg = isDark ? 'bg-gray-700' : 'bg-gray-100'
  const trackingBg = isDark ? 'bg-blue-900/20' : 'bg-blue-50'
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [trackingStatus, setTrackingStatus] = useState(false)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [roles, setRoles] = useState<UserRole>({
    hasOrgAdmin: false,
    hasTeamLead: false,
    hasAnyTeam: false,
    plan: 'free',
  })

  useEffect(() => {
    loadSettings()
    checkStatus()
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      const response = await apiRequest('/api/user/roles', 'GET')
      if (response.code === 200) {
        setRoles(response.data)
      }
    } catch (error) {
      console.error('Failed to load user roles', error)
    }
  }

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await getSettings()
      // 确保默认值存在 - 使用对象展开，默认值在前，数据覆盖在后
      const defaultSettings: SettingsType = {
        aiApiKey: '',
        aiProvider: 'ernie',
        autoStartOnBoot: true,
        ignoredApplications: []
      }
      setSettings({
        ...defaultSettings,
        ...data
      })
    } catch (error) {
      console.error('加载设置失败', error)
      // 加载失败时使用默认值
      setSettings({
        aiApiKey: '',
        aiProvider: 'ernie',
        autoStartOnBoot: true,
        ignoredApplications: []
      })
    } finally {
      setLoading(false)
    }
  }

  const checkStatus = async () => {
    const status = await checkTrackingStatus()
    setTrackingStatus(status)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await saveSettings(settings!)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('保存失败', error)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleTracking = async () => {
    try {
      const newStatus = await toggleTracking(!trackingStatus)
      setTrackingStatus(newStatus)
    } catch (error) {
      console.error('切换追踪状态失败', error)
      // 即使出错也更新 UI，用户可以再次点击
      setTrackingStatus(!trackingStatus)
    }
  }

  // 导出 JSON
  const exportJSON = async () => {
    try {
      setExporting(true)
      const allActivities = await getAllActivitiesExport()
      const jsonStr = JSON.stringify(allActivities, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().split('T')[0]
      a.download = `merize-activities-export-${dateStr}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      alert('JSON 导出成功！')
    } catch (error) {
      console.error('导出 JSON 失败', error)
      alert('导出失败: ' + error)
    } finally {
      setExporting(false)
    }
  }

  // 导出 CSV
  const exportCSV = async () => {
    try {
      setExporting(true)
      const allActivities = await getAllActivitiesExport()

      // CSV header
      const headers = ['id,name,windowTitle,category,taskId,startTimeMs,durationMinutes']
      // CSV rows
      const rows = allActivities.map(act => [
        act.id,
        `"${act.name.replace(/"/g, '""')}"`,
        `"${act.windowTitle.replace(/"/g, '""')}"`,
        act.category ? `"${act.category.replace(/"/g, '""')}"` : '',
        act.taskId || '',
        act.startTimeMs,
        act.durationMinutes
      ].join(','))

      const csvContent = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().split('T')[0]
      a.download = `merize-activities-export-${dateStr}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      alert('CSV 导出成功！')
    } catch (error) {
      console.error('导出 CSV 失败', error)
      alert('导出失败: ' + error)
    } finally {
      setExporting(false)
    }
  }

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout()
      window.location.reload()
    }
  }

  if (loading || !settings) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h2 className={`text-2xl font-bold ${titleColor} mb-2`}>设置</h2>
          <p className={textColor}>配置AI和应用偏好</p>
        </div>
        <div className={`${cardBg} rounded-xl shadow-sm p-6 border ${borderColor} max-w-2xl mx-auto text-center py-12`}>
          <p className={textColor}>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className={`text-2xl font-bold ${titleColor} mb-2`}>设置</h2>
        <p className={textColor}>配置AI和应用偏好</p>
      </div>

      <div className={`${cardBg} rounded-xl shadow-sm p-6 border ${borderColor} space-y-6 max-w-2xl mx-auto`}>
        {/* 主题切换 */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <h3 className={`font-semibold ${titleColor}`}>外观主题</h3>
            <p className={`text-sm ${textColor}`}>
              当前: {isDark ? '深色模式' : '浅色模式'}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className={`px-4 py-2 rounded-lg font-medium ${
              isDark
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isDark ? '切换浅色' : '切换深色'}
          </button>
        </div>

        <div className={`flex items-center justify-between p-4 ${trackingBg} rounded-lg`}>
          <div>
            <h3 className={`font-semibold ${titleColor}`}>追踪状态</h3>
            <p className={`text-sm ${textColor}`}>
              {roles.plan === 'free'
                ? '免费版仅支持手动记录，自动追踪需要升级套餐'
                : (trackingStatus ? '当前正在记录你的活动' : '当前已暂停记录')
              }
            </p>
          </div>
          {roles.plan === 'free' ? (
            <button
              disabled
              className={`px-4 py-2 rounded-lg font-medium ${
                isDark ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'
              } cursor-not-allowed`}
            >
              需要升级套餐
            </button>
          ) : (
            <button
              onClick={handleToggleTracking}
              className={`px-4 py-2 rounded-lg font-medium ${
                trackingStatus
                  ? (isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-700 hover:bg-red-200')
                  : (isDark ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-100 text-green-700 hover:bg-green-200')
              }`}
            >
              {trackingStatus ? '暂停追踪' : '开始追踪'}
            </button>
          )}
        </div>

        {/* 订阅套餐 */}
        <div className={`flex items-center justify-between p-4 rounded-lg border ${borderColor}`}>
          <div>
            <h3 className={`font-semibold ${titleColor}`}>当前套餐</h3>
            <p className={`text-sm ${textColor}`}>
              不同套餐开放不同进阶功能：免费(手动) → 个人(自动+AI) → 商业(团队+协作)
            </p>
          </div>
          {/* 套餐信息从后端获取，框架已就绪 */}
          {(() => {
            const planLabels = {free: '免费版', personal: '个人版', business: '商业版'};
            const planClasses = {
              free: isDark ? 'bg-gray-500/30 text-gray-300' : 'bg-gray-100 text-gray-700',
              personal: isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700',
              business: isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'
            };
            return (
              <span className={`px-3 py-1 rounded-full text-sm ${planClasses[roles.plan]}`}>
                {planLabels[roles.plan]}
              </span>
            );
          })()}
        </div>

        {/*
          AI 提供商和API密钥设置暂时隐藏 - AI统一由服务提供，未来开放用户自定义时取消注释即可
          <div>
            <label className={`block text-sm font-medium ${labelColor} mb-2`}>
              AI 提供商
            </label>
            <div className="flex space-x-4">
              <label className={`flex items-center ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                <input
                  type="radio"
                  value="ernie"
                  checked={settings.aiProvider === 'ernie'}
                  onChange={(e) => setSettings({...settings, aiProvider: e.target.value as any})}
                  className="mr-2"
                />
                百度文心一言
              </label>
              <label className={`flex items-center ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
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
            <p className={`text-xs ${textColor} mt-1`}>
              选择你使用的大模型API，需要自己申请API密钥。
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium ${labelColor} mb-2`}>
              API 密钥
            </label>
            <input
              type="password"
              value={settings.aiApiKey}
              onChange={(e) => setSettings({...settings, aiApiKey: e.target.value})}
              className={`w-full px-4 py-2 border ${borderColor} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputBg}`}
              placeholder="API密钥由服务统一提供"
            />
            <p className={`text-xs ${textColor} mt-1`}>
              AI分类由服务统一提供，暂不开放用户自定义。
            </p>
          </div>
        */}

        <div>
          <label className={`flex items-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <input
              type="checkbox"
              checked={settings.autoStartOnBoot}
              onChange={(e) => setSettings({...settings, autoStartOnBoot: e.target.checked})}
              className="mr-2"
            />
            <span className="text-sm">开机自动启动</span>
          </label>
        </div>

        {/* 忽略列表 */}
        <div>
          <h3 className={`block text-sm font-medium ${labelColor} mb-2`}>
            忽略应用列表
          </h3>
          <p className={`text-xs ${textColor} mb-3`}>
            添加到忽略列表的应用不会被追踪记录活动
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              id="new-ignored-app"
              placeholder="输入应用名称，例如: WeChat"
              className={`flex-1 px-4 py-2 border ${borderColor} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputBg}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget;
                  const value = input.value.trim();
                  if (value && !settings.ignoredApplications.includes(value)) {
                    setSettings({
                      ...settings,
                      ignoredApplications: [...settings.ignoredApplications, value]
                    });
                    input.value = '';
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.getElementById('new-ignored-app') as HTMLInputElement;
                const value = input.value.trim();
                if (value && !settings.ignoredApplications.includes(value)) {
                  setSettings({
                    ...settings,
                    ignoredApplications: [...settings.ignoredApplications, value]
                  });
                  input.value = '';
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              添加
            </button>
          </div>
          {settings.ignoredApplications.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {settings.ignoredApplications.map((app, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-3 py-1 ${tagBg} rounded-full text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  {app}
                  <button
                    onClick={() => {
                      setSettings({
                        ...settings,
                        ignoredApplications: settings.ignoredApplications.filter((_, i) => i !== index)
                      });
                    }}
                    className={`ml-2 ${isDark ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-600'}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${textColor}`}>暂无忽略应用</p>
          )}
        </div>

        <div className={`pt-4 border-t ${borderLight}`}>
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

        {/* 数据导出 */}
        <div className={`pt-4 border-t ${borderLight}`}>
          <h3 className={`font-semibold ${titleColor} mb-3`}>数据导出</h3>
          <p className={`text-sm ${textColor} mb-4`}>
            将所有历史活动数据导出到本地文件备份
          </p>
          <div className="flex gap-3">
            <button
              onClick={exportJSON}
              disabled={exporting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {exporting ? '导出中...' : '导出 JSON'}
            </button>
            <button
              onClick={exportCSV}
              disabled={exporting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {exporting ? '导出中...' : '导出 CSV'}
            </button>
          </div>
        </div>

        <div className={`pt-4 border-t ${borderLight}`}>
          <button
            onClick={handleLogout}
            className={`w-full px-4 py-3 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700'} rounded-lg font-medium hover:bg-gray-200 transition-colors`}
          >
            退出登录
          </button>
        </div>
      </div>

      <div className={`mt-6 ${isDark ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'} rounded-lg p-4 border max-w-2xl mx-auto`}>
        <h4 className={`font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-800'} mb-2`}>提示</h4>
        <p className={`text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
          AI用于自动分类你的活动。如果你没有API密钥，可以先手动分类，不影响基本追踪功能。
        </p>
      </div>
    </div>
  )
}

export default Settings
