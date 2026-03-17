// auth.ts - 用户认证工具，支持手机号验证码登录和微信登录

const API_HOST = import.meta.env.VITE_API_HOST || 'https://your-backend-domain.com'

// 检查是否已登录
export async function checkAuth(): Promise<boolean> {
  const token = localStorage.getItem('rize_token')
  if (!token) {
    return false
  }
  // 可以这里调用后端验证token有效性
  try {
    const res = await fetch(`${API_HOST}/api/auth/check`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return res.ok
  } catch {
    return false
  }
}

// 手机号登录
export async function loginWithPhone(phone: string, code: string): Promise<void> {
  const res = await fetch(`${API_HOST}/api/auth/login-phone`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone, code })
  })
  const data = await res.json()
  if (data.code === 200) {
    localStorage.setItem('rize_token', data.data.token)
  } else {
    throw new Error(data.msg || '登录失败')
  }
}

// 微信登录（wechat OAuth）
export async function loginWechat(): Promise<void> {
  // 微信登录跳转，后端处理回调
  window.location.href = `${API_HOST}/api/auth/wechat`
}

// 退出登录
export function logout(): void {
  localStorage.removeItem('rize_token')
  window.location.reload()
}

// 获取当前token
export function getToken(): string | null {
  return localStorage.getItem('rize_token')
}
