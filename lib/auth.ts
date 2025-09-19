'use client'

interface AdminAuth {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
}

// 注意：客户端不再直接使用环境变量验证
// 认证现在通过服务端API进行，使用 ADMIN_USERNAME 和 ADMIN_PASSWORD 环境变量
const AUTH_KEY = 'admin_auth_token'
const AUTH_EXPIRY_KEY = 'admin_auth_expiry'
const LOGIN_ATTEMPTS_KEY = 'admin_login_attempts'
const LOGIN_LOCKOUT_KEY = 'admin_lockout_until'

const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15分钟

// 生成简单的认证令牌
const generateAuthToken = (): string => {
  return btoa(Date.now().toString() + Math.random().toString(36))
}

// 检查认证状态 - 使用API验证cookie
const checkAuthStatus = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false
  
  try {
    const response = await fetch('/api/admin/auth', {
      method: 'GET',
      credentials: 'include'
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.authenticated === true
    }
    
    return false
  } catch (error) {
    console.error('Auth check failed:', error)
    return false
  }
}

// 检查登录锁定状态
const isLockedOut = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const lockoutUntil = localStorage.getItem(LOGIN_LOCKOUT_KEY)
  if (!lockoutUntil) return false
  
  const lockoutTime = parseInt(lockoutUntil)
  if (Date.now() > lockoutTime) {
    // 锁定时间已过，清除锁定
    localStorage.removeItem(LOGIN_LOCKOUT_KEY)
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY)
    return false
  }
  
  return true
}

// 记录失败登录尝试
const recordFailedAttempt = (): void => {
  if (typeof window === 'undefined') return
  
  const attempts = parseInt(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '0') + 1
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, attempts.toString())
  
  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    const lockoutUntil = Date.now() + LOCKOUT_DURATION
    localStorage.setItem(LOGIN_LOCKOUT_KEY, lockoutUntil.toString())
    console.warn(`账户已被锁定 ${LOCKOUT_DURATION / 60000} 分钟，由于连续 ${MAX_LOGIN_ATTEMPTS} 次登录失败`)
  }
}

// 清除登录尝试记录
const clearLoginAttempts = (): void => {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem(LOGIN_ATTEMPTS_KEY)
  localStorage.removeItem(LOGIN_LOCKOUT_KEY)
}

// 登录函数 - 使用API
const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
  // 检查是否被锁定
  if (isLockedOut()) {
    const lockoutUntil = localStorage.getItem(LOGIN_LOCKOUT_KEY)
    const remainingTime = Math.ceil((parseInt(lockoutUntil!) - Date.now()) / 60000)
    return { 
      success: false, 
      message: `账户已被锁定，请等待 ${remainingTime} 分钟后重试` 
    }
  }
  
  // 输入验证
  if (!password?.trim()) {
    return { success: false, message: '密码不能为空' }
  }
  
  try {
    const response = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    })
    
    if (response.ok) {
      clearLoginAttempts()
      return { success: true }
    } else {
      let errorMessage = '登录失败'
      
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch (e) {
        // 如果解析JSON失败，使用默认错误消息
      }
      
      recordFailedAttempt()
      const attempts = parseInt(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '0')
      const remaining = MAX_LOGIN_ATTEMPTS - attempts
      
      if (remaining > 0) {
        return { 
          success: false, 
          message: `${errorMessage}，还有 ${remaining} 次尝试机会` 
        }
      } else {
        return { 
          success: false, 
          message: `登录失败次数过多，账户已被锁定 ${LOCKOUT_DURATION / 60000} 分钟` 
        }
      }
    }
  } catch (error) {
    console.error('Login request failed:', error)
    return { success: false, message: '登录请求失败，请重试' }
  }
}

// 登出函数 - 使用API
const logout = async (): Promise<void> => {
  try {
    await fetch('/api/admin/auth', {
      method: 'DELETE',
      credentials: 'include'
    })
  } catch (error) {
    console.error('Logout failed:', error)
  }
  // 清除localStorage
  localStorage.removeItem(AUTH_KEY)
  localStorage.removeItem(AUTH_EXPIRY_KEY)
}

// 导出认证功能 - 现在已弃用，请使用useAdminAuth hook
export const adminAuth: AdminAuth = {
  get isAuthenticated() {
    return false // 已弃用，请使用useAdminAuth hook
  },
  login: async () => ({ success: false, message: '请使用useAdminAuth hook' }),
  logout: async () => { /* 请使用useAdminAuth hook */ }
}

// React Hook for authentication
import { useState, useEffect } from 'react'

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      const authenticated = await checkAuthStatus()
      setIsAuthenticated(authenticated)
      setIsLoading(false)
    }
    
    checkAuth()
  }, [])

  const handleLogin = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true)
    const result = await login(username, password)
    if (result.success) {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
    return result
  }

  const handleLogout = async (): Promise<void> => {
    setIsLoading(true)
    await logout()
    setIsAuthenticated(false)
    setIsLoading(false)
  }

  return {
    isAuthenticated,
    isLoading,
    login: handleLogin,
    logout: handleLogout
  }
}