'use client'

interface PasswordResetConfig {
  securityQuestions: Array<{
    question: string
    answer: string
  }>
  backupEmail?: string
}

const RESET_CONFIG_KEY = 'admin_reset_config'
const RESET_TOKEN_KEY = 'admin_reset_token'
const RESET_TOKEN_EXPIRY_KEY = 'admin_reset_token_expiry'

// 默认安全问题配置
const DEFAULT_SECURITY_QUESTIONS = [
  { question: "您第一个宠物的名字是什么？", answer: "" },
  { question: "您母亲的娘家姓是什么？", answer: "" },
  { question: "您小学的名字是什么？", answer: "" }
]

// 生成重置令牌
const generateResetToken = (): string => {
  return btoa(Date.now().toString() + Math.random().toString(36).substr(2, 9))
}

// 获取重置配置
export const getResetConfig = (): PasswordResetConfig => {
  if (typeof window === 'undefined') {
    return { securityQuestions: DEFAULT_SECURITY_QUESTIONS }
  }
  
  const stored = localStorage.getItem(RESET_CONFIG_KEY)
  if (!stored) {
    return { securityQuestions: DEFAULT_SECURITY_QUESTIONS }
  }
  
  try {
    return JSON.parse(stored)
  } catch {
    return { securityQuestions: DEFAULT_SECURITY_QUESTIONS }
  }
}

// 设置重置配置
export const setResetConfig = (config: PasswordResetConfig): boolean => {
  if (typeof window === 'undefined') return false
  
  try {
    localStorage.setItem(RESET_CONFIG_KEY, JSON.stringify(config))
    return true
  } catch {
    return false
  }
}

// 验证安全问题答案
export const validateSecurityAnswers = (answers: string[]): boolean => {
  const config = getResetConfig()
  
  if (answers.length !== config.securityQuestions.length) {
    return false
  }
  
  return config.securityQuestions.every((q, index) => {
    const userAnswer = answers[index]?.trim().toLowerCase()
    const correctAnswer = q.answer?.trim().toLowerCase()
    return userAnswer && correctAnswer && userAnswer === correctAnswer
  })
}

// 生成密码重置令牌
export const generatePasswordResetToken = (): string => {
  const token = generateResetToken()
  const expiry = Date.now() + (30 * 60 * 1000) // 30分钟有效
  
  localStorage.setItem(RESET_TOKEN_KEY, token)
  localStorage.setItem(RESET_TOKEN_EXPIRY_KEY, expiry.toString())
  
  return token
}

// 验证密码重置令牌
export const validateResetToken = (token: string): boolean => {
  if (typeof window === 'undefined') return false
  
  const storedToken = localStorage.getItem(RESET_TOKEN_KEY)
  const expiry = localStorage.getItem(RESET_TOKEN_EXPIRY_KEY)
  
  if (!storedToken || !expiry || storedToken !== token) {
    return false
  }
  
  const expiryTime = parseInt(expiry)
  if (Date.now() > expiryTime) {
    localStorage.removeItem(RESET_TOKEN_KEY)
    localStorage.removeItem(RESET_TOKEN_EXPIRY_KEY)
    return false
  }
  
  return true
}

// 清除重置令牌
export const clearResetToken = (): void => {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem(RESET_TOKEN_KEY)
  localStorage.removeItem(RESET_TOKEN_EXPIRY_KEY)
}

// 获取当前管理员凭据信息
export const getAdminCredentials = (): { username: string; hasConfig: boolean } => {
  const config = getResetConfig()
  const hasValidConfig = config.securityQuestions.some(q => q.answer?.trim())
  
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    hasConfig: hasValidConfig
  }
}

// 检查是否已设置安全问题
export const hasSecurityQuestionsSetup = (): boolean => {
  const config = getResetConfig()
  return config.securityQuestions.some(q => q.answer?.trim())
}