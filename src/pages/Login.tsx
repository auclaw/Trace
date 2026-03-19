import React, { useState } from 'react'
import { loginWithPhone, loginWechat } from '../utils/auth'

interface LoginProps {
  onLoginSuccess: () => void
}

export default function Login({ onLoginSuccess }: LoginProps) {
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
      // await sendCode(phone)
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Rize 中文
            </h1>
            <p className="text-gray-500">
              AI 自动时间追踪，帮你看清时间去哪里了
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                手机号
              </label>
              <input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  验证码
                </label>
                <input
                  type="text"
                  placeholder="6位验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-none pt-5">
                <button
                  onClick={handleSendCode}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap"
                >
                  获取验证码
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或者</span>
              </div>
            </div>

            <button
              onClick={handleWechatLogin}
              className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              📱 微信一键登录
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            登录即表示你同意《用户协议》和《隐私政策》
          </div>
        </div>
      </div>
    </div>
  )
}
