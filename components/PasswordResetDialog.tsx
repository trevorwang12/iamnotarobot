"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { HelpCircle, Key, CheckCircle } from 'lucide-react'
import { 
  getResetConfig, 
  validateSecurityAnswers, 
  generatePasswordResetToken,
  getAdminCredentials,
  hasSecurityQuestionsSetup 
} from '@/lib/password-reset'

interface PasswordResetDialogProps {
  trigger?: React.ReactNode
}

export default function PasswordResetDialog({ trigger }: PasswordResetDialogProps) {
  const [step, setStep] = useState<'check' | 'questions' | 'success'>('check')
  const [answers, setAnswers] = useState<string[]>([])
  const [error, setError] = useState('')
  const [resetToken, setResetToken] = useState('')

  const config = getResetConfig()
  const { username } = getAdminCredentials()
  const hasSecuritySetup = hasSecurityQuestionsSetup()

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
  }

  const handleValidateAnswers = () => {
    if (validateSecurityAnswers(answers)) {
      const token = generatePasswordResetToken()
      setResetToken(token)
      setStep('success')
      setError('')
    } else {
      setError('安全问题答案不正确，请重新输入')
    }
  }

  const resetForm = () => {
    setStep('check')
    setAnswers([])
    setError('')
    setResetToken('')
  }

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="w-full text-blue-600 hover:text-blue-800">
      <HelpCircle className="w-4 h-4 mr-2" />
      忘记密码？
    </Button>
  )

  return (
    <Dialog onOpenChange={resetForm}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            密码找回
          </DialogTitle>
        </DialogHeader>

        {/* 检查安全问题设置 */}
        {step === 'check' && (
          <div className="space-y-4">
            {!hasSecuritySetup ? (
              <Alert>
                <HelpCircle className="w-4 h-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p><strong>未设置安全问题</strong></p>
                    <p>您还没有设置安全问题。以下是找回密码的其他方式：</p>
                    <div className="bg-gray-50 p-3 rounded space-y-2 text-sm">
                      <div><strong>方式1：环境变量</strong></div>
                      <div>检查项目根目录的 .env.local 文件：</div>
                      <code className="block bg-white p-2 rounded text-xs">
                        ADMIN_USERNAME=admin<br/>
                        ADMIN_PASSWORD=你的密码
                      </code>
                      
                      <div className="mt-3"><strong>方式2：默认凭据</strong></div>
                      <div>如果没有设置环境变量，默认凭据为：</div>
                      <code className="block bg-white p-2 rounded text-xs">
                        用户名: admin<br/>
                        密码: admin123
                      </code>
                      
                      <div className="mt-3"><strong>方式3：重新部署</strong></div>
                      <div>重新部署应用程序会重置所有认证状态</div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>
                    检测到您已设置安全问题。请回答以下问题来重置密码。
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={() => setStep('questions')}
                  className="w-full"
                >
                  开始回答安全问题
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 安全问题验证 */}
        {step === 'questions' && (
          <div className="space-y-4">
            <Alert>
              <HelpCircle className="w-4 h-4" />
              <AlertDescription>
                请回答以下安全问题来验证身份：
              </AlertDescription>
            </Alert>
            
            {error && (
              <Alert className="border-red-500">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {config.securityQuestions.map((q, index) => (
                q.answer && (
                  <div key={index}>
                    <Label htmlFor={`question-${index}`}>
                      {q.question}
                    </Label>
                    <Input
                      id={`question-${index}`}
                      value={answers[index] || ''}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      placeholder="请输入答案"
                    />
                  </div>
                )
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('check')}>
                返回
              </Button>
              <Button 
                onClick={handleValidateAnswers}
                disabled={answers.some(a => !a?.trim())}
                className="flex-1"
              >
                验证答案
              </Button>
            </div>
          </div>
        )}

        {/* 成功页面 */}
        {step === 'success' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                身份验证成功！
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                您的管理员账户信息：
              </p>
            </div>

            <Alert className="text-left">
              <Key className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div><strong>用户名：</strong> {username}</div>
                  <div><strong>当前密码位置：</strong></div>
                  <div className="bg-gray-50 p-3 rounded text-xs">
                    <div>1. 环境变量 ADMIN_PASSWORD</div>
                    <div>2. 或使用默认密码: admin123</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    <strong>建议：</strong> 通过环境变量设置强密码，并定期更换
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Button onClick={resetForm} className="w-full">
              关闭
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}