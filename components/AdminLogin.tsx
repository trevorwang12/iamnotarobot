"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, Shield, Eye, EyeOff } from 'lucide-react'
import PasswordResetDialog from './PasswordResetDialog'
import SecuritySetupDialog from './SecuritySetupDialog'

interface AdminLoginProps {
  onLogin: (username: string, password: string) => Promise<{ success: boolean; message?: string }>
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setError('请输入密码')
      return
    }

    setError('')
    
    try {
      const result = await onLogin(username, password)
      
      if (result.success) {
        setError('')
        setUsername('')
        setPassword('')
      } else {
        setError(result.message || '登录失败')
        setPassword('')
      }
    } catch (error) {
      setError('登录请求失败，请重试')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">管理员登录</CardTitle>
          <p className="text-gray-600 text-sm">
            请输入管理员凭据以访问管理面板
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-500">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
              />
            </div>
            
            <div>
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={!username.trim() || !password.trim()}
            >
              <Lock className="w-4 h-4 mr-2" />
              登录管理面板
            </Button>
          </form>
          
          <div className="mt-4 space-y-2">
            <PasswordResetDialog />
            <SecuritySetupDialog />
          </div>
          
          {/* 安全提示 */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">🔒 安全功能</h4>
            <div className="text-xs text-blue-800 space-y-1">
              <div>• 自动锁定：连续5次登录失败将锁定15分钟</div>
              <div>• 会话过期：登录状态24小时后自动过期</div>
              <div>• 密码找回：通过安全问题验证身份</div>
              <div>• 环境变量：支持自定义用户名和密码</div>
            </div>
          </div>

          {/* 默认凭据信息 */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-700">默认凭据</p>
              <Shield className="w-3 h-3 text-gray-500" />
            </div>
            <div className="text-xs text-gray-600 mt-1 space-y-1">
              <div>用户名: admin</div>
              <div>密码: admin123</div>
            </div>
            <p className="text-xs text-gray-500 mt-2 border-t pt-2">
              生产环境请通过环境变量 ADMIN_USERNAME 和 ADMIN_PASSWORD 设置强密码
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}