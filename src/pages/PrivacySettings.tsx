import { useState, useEffect, useCallback } from 'react'
import type { Theme } from '../App'
import { apiRequest } from '../utils/api'
import { getSettings, saveSettings } from '../utils/api'

interface PrivacySettingsData {
  sync_mode: 'full' | 'summary_only' | 'local_only'
  cloud_encryption: boolean
  retain_raw_local: boolean
  auto_delete_days: number
}

interface PrivacySettingsProps {
  theme: Theme
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({ theme: _theme }) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<PrivacySettingsData>({
    sync_mode: 'summary_only',
    cloud_encryption: true,
    retain_raw_local: true,
    auto_delete_days: 0,
  })

  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const allSettings = await getSettings()
      setSettings({
        sync_mode: allSettings.privacy_sync_mode || 'summary_only',
        cloud_encryption: allSettings.privacy_cloud_encryption !== false,
        retain_raw_local: allSettings.privacy_retain_raw_local !== false,
        auto_delete_days: allSettings.privacy_auto_delete_days || 0,
      })
    } catch (error) {
      console.error('加载隐私设置失败', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const current = await getSettings()
      await saveSettings({
        ...current,
        privacy_sync_mode: settings.sync_mode,
        privacy_cloud_encryption: settings.cloud_encryption,
        privacy_retain_raw_local: settings.retain_raw_local,
        privacy_auto_delete_days: settings.auto_delete_days,
      })
      // Sync to backend
      await apiRequest('/api/privacy/save', 'POST', settings)
      alert('隐私设置保存成功！')
    } catch (error) {
      console.error('保存失败', error)
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const bgClass = 'bg-[var(--color-bg-base)] text-[var(--color-text-primary)]'
  const cardBgClass = 'bg-[var(--color-bg-surface-2)]'
  const borderClass = 'border-[var(--color-border-subtle)]'
  const textColor = 'text-[var(--color-text-secondary)]'
  const buttonPrimaryClass = 'bg-[var(--color-accent)] hover:brightness-110 text-white px-4 py-2 rounded disabled:opacity-50'
  const optionActiveClass = 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)] bg-[var(--color-accent-soft)]'
  const optionInactiveClass = `border ${borderClass}`

  if (loading) {
    return (
      <div className={`${bgClass} min-h-screen p-4`}>
        <div className="animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <div className={`${bgClass} min-h-screen p-4`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">隐私设置</h1>

        {/* Sync Mode */}
        <div className={`mb-6 p-4 border ${borderClass} rounded ${cardBgClass}`}>
          <h3 className="text-lg font-semibold mb-3">云同步模式</h3>
          <p className={`text-sm ${textColor} mb-4`}>
            选择哪些数据会同步到云端 —— 隐私优先是我们的核心设计
          </p>
          <div className="space-y-3">
            <label className={`block p-4 rounded cursor-pointer ${settings.sync_mode === 'local_only' ? optionActiveClass : optionInactiveClass}`}>
              <input
                type="radio"
                name="sync_mode"
                value="local_only"
                checked={settings.sync_mode === 'local_only'}
                onChange={(e) => setSettings({ ...settings, sync_mode: e.target.value as any })}
                className="mr-2"
              />
              <div>
                <strong>🔒 纯本地模式</strong>
                <p className={`text-sm ${textColor} mt-1`}>
                  所有数据永远存在你的电脑上，不上传任何数据到云端。适合对隐私有极致要求的用户。
                </p>
              </div>
            </label>

            <label className={`block p-4 rounded cursor-pointer ${settings.sync_mode === 'summary_only' ? optionActiveClass : optionInactiveClass}`}>
              <input
                type="radio"
                name="sync_mode"
                value="summary_only"
                checked={settings.sync_mode === 'summary_only'}
                onChange={(e) => setSettings({ ...settings, sync_mode: e.target.value as any })}
                className="mr-2"
              />
              <div>
                <strong>⚖️ 仅汇总数据（推荐）</strong>
                <p className={`text-sm ${textColor} mt-1`}>
                  原始窗口标题/URL 永远留在本地，云端只存分类汇总结果。兼顾隐私和多设备同步。
                </p>
              </div>
            </label>

            <label className={`block p-4 rounded cursor-pointer ${settings.sync_mode === 'full' ? optionActiveClass : optionInactiveClass}`}>
              <input
                type="radio"
                name="sync_mode"
                value="full"
                checked={settings.sync_mode === 'full'}
                onChange={(e) => setSettings({ ...settings, sync_mode: e.target.value as any })}
                className="mr-2"
              />
              <div>
                <strong>📡 完整同步</strong>
                <p className={`text-sm ${textColor} mt-1`}>
                  同步所有数据（包括原始标题）到云端，端对端加密保护。换设备完整恢复。
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Encryption */}
        {settings.sync_mode !== 'local_only' && (
          <div className={`mb-6 p-4 border ${borderClass} rounded ${cardBgClass}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">端对端加密</h3>
                <p className={`text-sm ${textColor}`}>
                  即使完整同步，云端也无法读取你的原始数据 —— 只有你握有解密密钥
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.cloud_encryption}
                  onChange={(e) => setSettings({ ...settings, cloud_encryption: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        )}

        {/* Local Retention */}
        <div className={`mb-6 p-4 border ${borderClass} rounded ${cardBgClass}`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">本地保留原始数据</h3>
              <p className={`text-sm ${textColor}`}>
                在本地始终保留完整原始数据，即使云端存的是汇总，本地也有完整记录
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.retain_raw_local}
                onChange={(e) => setSettings({ ...settings, retain_raw_local: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Auto Delete */}
        <div className={`mb-6 p-4 border ${borderClass} rounded ${cardBgClass}`}>
          <h3 className="text-lg font-semibold mb-3">自动删除旧原始数据</h3>
          <p className={`text-sm ${textColor} mb-4`}>
            N 天后自动删除本地原始窗口标题，只保留汇总 — 进一步节省空间 + 增强隐私
          </p>
          <div>
            <select
              value={settings.auto_delete_days}
              onChange={(e) => setSettings({ ...settings, auto_delete_days: parseInt(e.target.value) })}
              className={`w-48 px-3 py-2 border ${borderClass} rounded`}
              style={{ background: 'var(--color-bg-surface-2)', color: 'var(--color-text-primary)' }}
            >
              <option value={0}>不自动删除</option>
              <option value={7}>7 天后</option>
              <option value={30}>30 天后</option>
              <option value={90}>90 天后</option>
              <option value={180}>180 天后</option>
            </select>
            <p className={`text-xs ${textColor} mt-2`}>
              注意：删除后无法恢复，请谨慎选择
            </p>
          </div>
        </div>

        {/* Privacy Guarantees */}
        <div className={`mb-6 p-4 border ${borderClass} rounded ${cardBgClass}`}>
          <h3 className="text-lg font-semibold mb-3">🔒 Merize 隐私承诺</h3>
          <ul className={`space-y-2 ${textColor}`}>
            <li>• 我们永远不会读取你的原始数据用于广告或第三方营销</li>
            <li>• 所有隐私选项完全由你控制，可以随时修改</li>
            <li>• 原始数据默认留在你的设备，云端只存你允许同步的内容</li>
            <li>• AI分类使用公司统一API：仅临时发送当前活动的应用名+窗口标题用于分类，分类结果返回后立即丢弃，我们不存储你的原始活动数据</li>
            <li>• 你可以随时导出或删除你的所有数据</li>
          </ul>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            className={buttonPrimaryClass}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中...' : '💾 保存设置'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PrivacySettings
