import { useState } from 'react'
import { loginWithPhone, loginWechat, sendCode, devLogin } from '../utils/auth'
import { API_HOST } from '../utils/api'
import type { Theme } from '../App'

interface LoginProps {
  theme: Theme
  onLoginSuccess: () => void
}

export default function Login({ theme: _theme, onLoginSuccess }: LoginProps) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendCode = async () => {
    if (!phone.match(/^1[3-9]\d{9}$/)) {
      setError('请输入正确的手机号')
      return
    }
    setError('')
    // 调用后端API发送验证码
    try {
      await sendCode(phone)
      setError('验证码已发送')
    } catch (err) {
      setError('发送失败，请重试')
    }
  }

  const handleLogin = async () => {
    if (!phone || !code) {
      setError('请填写手机号和验证码')
      return
    }
    setLoading(true)
    try {
      await loginWithPhone(phone, code)
      onLoginSuccess()
    } catch (err) {
      setError('登录失败，请重试')
      setLoading(false)
    }
  }

  const handleWechatLogin = async () => {
    try {
      await loginWechat()
      onLoginSuccess()
    } catch (err) {
      setError('微信登录失败')
    }
  }

  const handleDevLogin = async () => {
    if (!phone.match(/^1[3-9]\d{9}$/)) {
      setError('请输入正确的手机号')
      return
    }
    setLoading(true)
    try {
      await devLogin(phone)
      onLoginSuccess()
    } catch (err) {
      setError('开发模式登录失败')
      setLoading(false)
    }
  }

  const bgGradient = 'from-[var(--color-bg-base)] to-[var(--color-bg-surface-2)]'
  const cardStyle: React.CSSProperties = { background: 'var(--color-bg-surface-2)' }
  const borderStyle: React.CSSProperties = { borderColor: 'var(--color-border-subtle)' }
  const inputStyle: React.CSSProperties = { background: 'var(--color-bg-surface-2)', color: 'var(--color-text-primary)' }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${bgGradient} px-4 transition-colors duration-200`}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl border p-8 transition-colors duration-200" style={{ ...cardStyle, ...borderStyle }}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Merize
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              AI 自动时间追踪，帮你看清时间去哪里了
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                手机号
              </label>
              <input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-colors"
                style={{ ...borderStyle, ...inputStyle }}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  验证码
                </label>
                <input
                  type="text"
                  placeholder="6位验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-colors"
                  style={{ ...borderStyle, ...inputStyle }}
                />
              </div>
              <div className="flex-none pt-5">
                <button
                  onClick={handleSendCode}
                  className="px-4 py-2 rounded-lg transition-colors"
                  style={{ background: 'var(--color-bg-surface-3)', color: 'var(--color-text-secondary)' }}
                >
                  获取验证码
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm" style={{ color: error.includes('已发送') ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 bg-[var(--color-accent)] text-[#fffefb] font-medium rounded-lg hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent)] disabled:opacity-50 transition-colors"
            >
              {loading ? '登录中...' : '登录'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'var(--color-border-subtle)' }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2" style={{ background: 'var(--color-bg-surface-2)', color: 'var(--color-text-secondary)' }}>或者</span>
              </div>
            </div>

            <button
              onClick={handleWechatLogin}
              className="w-full py-3 bg-[#07c160] text-white font-medium rounded-lg hover:bg-[#06ad56] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#07c160]"
            >
              📱 微信一键登录
            </button>

            {/* 开发模式登录 - 仅在本地开发时显示 */}
            {API_HOST.includes('localhost') && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: 'var(--color-border-subtle)' }}></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2" style={{ background: 'var(--color-bg-surface-2)', color: 'var(--color-text-secondary)' }}>开发模式</span>
                  </div>
                </div>

                <button
                  onClick={handleDevLogin}
                  disabled={loading}
                  className="w-full py-2 bg-[var(--color-text-secondary)] text-[var(--color-bg-base)] text-sm font-medium rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-text-secondary)] disabled:opacity-50 transition-colors"
                >
                  ⚙️ 直接登录（无需验证码）
                </button>
              </>
            )}
          </div>

          <div className="mt-6 text-center text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            登录即表示你同意《用户协议》和《隐私政策》
          </div>
        </div>
      </div>
    </div>
  )
}
