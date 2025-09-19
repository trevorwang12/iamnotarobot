"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Shield, Key, CheckCircle, AlertTriangle } from 'lucide-react'
import { 
  getResetConfig, 
  setResetConfig,
  hasSecurityQuestionsSetup,
  PasswordResetConfig
} from '@/lib/password-reset'

interface SecuritySetupDialogProps {
  trigger?: React.ReactNode
  isAuthenticated?: boolean
}

export default function SecuritySetupDialog({ trigger, isAuthenticated }: SecuritySetupDialogProps) {
  const [config, setConfig] = useState<PasswordResetConfig>({ securityQuestions: [] })
  const [answers, setAnswers] = useState<string[]>([])
  const [backupEmail, setBackupEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [hasExistingSetup, setHasExistingSetup] = useState(false)

  useEffect(() => {
    const currentConfig = getResetConfig()
    setConfig(currentConfig)
    setAnswers(currentConfig.securityQuestions.map(q => q.answer || ''))
    setBackupEmail(currentConfig.backupEmail || '')
    setHasExistingSetup(hasSecurityQuestionsSetup())
  }, [])

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
  }

  const handleSave = () => {
    setError('')
    setSuccess('')

    // 验证至少设置一个安全问题
    const validAnswers = answers.filter(a => a?.trim())
    if (validAnswers.length === 0) {
      setError('请至少回答一个安全问题')
      return
    }

    // 验证邮箱格式（如果提供）
    if (backupEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(backupEmail)) {
      setError('请输入有效的邮箱地址')
      return
    }

    const newConfig: PasswordResetConfig = {
      securityQuestions: config.securityQuestions.map((q, index) => ({
        ...q,
        answer: answers[index]?.trim() || ''
      })),
      backupEmail: backupEmail.trim() || undefined
    }

    if (setResetConfig(newConfig)) {
      setSuccess(`成功设置 ${validAnswers.length} 个安全问题` + (backupEmail ? '和备用邮箱' : ''))
      setHasExistingSetup(true)
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError('保存失败，请重试')
    }
  }

  const resetForm = () => {
    const currentConfig = getResetConfig()
    setConfig(currentConfig)
    setAnswers(currentConfig.securityQuestions.map(q => q.answer || ''))
    setBackupEmail(currentConfig.backupEmail || '')
    setError('')
    setSuccess('')
  }

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="w-full text-gray-600 hover:text-gray-800">
      <Key className="w-4 h-4 mr-2" />
      设置安全问题
    </Button>
  )

  return (
    <Dialog onOpenChange={resetForm}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            安全问题设置
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 说明信息 */}
          <Alert className={hasExistingSetup ? "border-green-500" : "border-yellow-500"}>
            {hasExistingSetup ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>
                  {hasExistingSetup ? '✅ 已设置安全问题' : '⚠️ 建议设置安全问题'}
                </strong></p>
                <p className="text-sm">
                  安全问题用于在忘记密码时验证身份。请选择只有您知道答案的问题。
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* 只有登录后才能设置 */}
          {!isAuthenticated && (
            <Alert className="border-orange-500">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <p><strong>需要先登录</strong></p>
                <p className="text-sm">
                  为了安全起见，只有成功登录后才能设置或修改安全问题。
                </p>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-500">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500">
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {isAuthenticated && (
            <>
              {/* 安全问题设置 */}
              <div className="space-y-4">
                <h4 className="font-semibold">安全问题</h4>
                {config.securityQuestions.map((question, index) => (
                  <div key={index} className="space-y-2">
                    <Label htmlFor={`security-q-${index}`}>
                      {question.question}
                    </Label>
                    <Input
                      id={`security-q-${index}`}
                      value={answers[index] || ''}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      placeholder="请输入答案（选填）"
                      className={answers[index]?.trim() ? 'border-green-300' : ''}
                    />
                  </div>
                ))}
              </div>

              {/* 备用邮箱 */}
              <div className="space-y-2">
                <Label htmlFor="backup-email">备用邮箱（可选）</Label>
                <Input
                  id="backup-email"
                  type="email"
                  value={backupEmail}
                  onChange={(e) => setBackupEmail(e.target.value)}
                  placeholder="your-backup@email.com"
                />
                <p className="text-xs text-gray-500">
                  备用邮箱用于接收密码重置提醒（当前版本仅用于记录）
                </p>
              </div>

              {/* 安全提示 */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <h5 className="font-semibold text-blue-800 text-sm mb-1">安全提示：</h5>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• 选择只有您知道答案的问题</li>
                  <li>• 答案区分大小写，请准确记住</li>
                  <li>• 建议定期更新安全问题和答案</li>
                  <li>• 不要在答案中包含明显的个人信息</li>
                </ul>
              </div>

              <Button 
                onClick={handleSave}
                className="w-full"
                disabled={answers.every(a => !a?.trim())}
              >
                <Shield className="w-4 h-4 mr-2" />
                保存安全设置
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}