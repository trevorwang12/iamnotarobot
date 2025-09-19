// 统一错误处理 - "Fail fast, fail clearly" - Linus philosophy

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION', 
  API = 'API',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType
  message: string
  userMessage: string // 用户友好的错误信息
  code?: string
  originalError?: any
  timestamp: number
}

export class ErrorHandler {
  // 创建标准化错误
  static createError(
    type: ErrorType,
    message: string,
    userMessage: string,
    originalError?: any
  ): AppError {
    return {
      type,
      message,
      userMessage,
      originalError,
      timestamp: Date.now()
    }
  }

  // 处理API错误
  static handleApiError(error: any, context: string): AppError {
    // 只在非AbortError时输出错误日志，避免正常取消操作的噪音
    if (error.name !== 'AbortError') {
      console.error(`API Error in ${context}:`, error)
    }
    
    if (error.name === 'AbortError') {
      return this.createError(
        ErrorType.NETWORK,
        'Request was aborted',
        'Request was cancelled',
        error
      )
    }
    
    if (!navigator.onLine) {
      return this.createError(
        ErrorType.NETWORK,
        'Network unavailable',
        'Please check your internet connection',
        error
      )
    }
    
    if (error.status) {
      switch (error.status) {
        case 404:
          return this.createError(
            ErrorType.NOT_FOUND,
            `Resource not found: ${context}`,
            'The requested content was not found',
            error
          )
        case 403:
          return this.createError(
            ErrorType.PERMISSION,
            `Access denied: ${context}`,
            'You do not have permission to access this content',
            error
          )
        case 500:
          return this.createError(
            ErrorType.API,
            `Server error: ${context}`,
            'Something went wrong on our end. Please try again later.',
            error
          )
        default:
          return this.createError(
            ErrorType.API,
            `API error ${error.status}: ${context}`,
            'Something went wrong. Please try again.',
            error
          )
      }
    }
    
    return this.createError(
      ErrorType.UNKNOWN,
      `Unknown error in ${context}`,
      'An unexpected error occurred. Please try again.',
      error
    )
  }

  // 处理数据验证错误
  static handleValidationError(message: string, field?: string): AppError {
    return this.createError(
      ErrorType.VALIDATION,
      `Validation failed: ${message}`,
      field ? `Invalid ${field}` : 'Please check your input',
    )
  }

  // 安全的fetch包装器
  static async safeFetch(
    url: string,
    options: RequestInit = {},
    context: string = url
  ): Promise<{
    data: any | null
    error: AppError | null
  }> {
    try {
      // 设置默认超时
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw Object.assign(new Error(`HTTP ${response.status}`), {
          status: response.status,
          statusText: response.statusText
        })
      }
      
      const data = await response.json()
      return { data, error: null }
      
    } catch (error) {
      return {
        data: null,
        error: this.handleApiError(error, context)
      }
    }
  }

  // 日志记录（只在开发环境详细记录）
  static logError(error: AppError, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔴 Error: ${error.type}`)
      console.error('Message:', error.message)
      console.error('User Message:', error.userMessage)
      if (context) console.error('Context:', context)
      if (error.originalError) console.error('Original:', error.originalError)
      console.error('Timestamp:', new Date(error.timestamp).toISOString())
      console.groupEnd()
    }
  }
}