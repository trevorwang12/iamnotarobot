// 用户友好的错误显示组件
import { AppError, ErrorType } from '@/lib/error-handler'

interface ErrorDisplayProps {
  error: AppError | null
  onRetry?: () => void
  className?: string
}

export default function ErrorDisplay({ error, onRetry, className = '' }: ErrorDisplayProps) {
  if (!error) return null

  const getErrorIcon = (type: ErrorType) => {
    switch (type) {
      case ErrorType.NETWORK:
        return '📡'
      case ErrorType.NOT_FOUND:
        return '🔍'
      case ErrorType.PERMISSION:
        return '🔒'
      case ErrorType.VALIDATION:
        return '⚠️'
      default:
        return '❌'
    }
  }

  const getErrorColor = (type: ErrorType) => {
    switch (type) {
      case ErrorType.NETWORK:
        return 'border-yellow-200 bg-yellow-50 text-yellow-800'
      case ErrorType.NOT_FOUND:
        return 'border-blue-200 bg-blue-50 text-blue-800'
      case ErrorType.PERMISSION:
        return 'border-red-200 bg-red-50 text-red-800'
      case ErrorType.VALIDATION:
        return 'border-orange-200 bg-orange-50 text-orange-800'
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800'
    }
  }

  return (
    <div className={`rounded-lg border p-4 ${getErrorColor(error.type)} ${className}`}>
      <div className="flex items-start space-x-3">
        <span className="text-xl">{getErrorIcon(error.type)}</span>
        <div className="flex-1">
          <h3 className="font-medium mb-1">
            {error.userMessage}
          </h3>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-sm opacity-75">
              Debug: {error.message}
            </p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 px-3 py-1 bg-white border border-current rounded text-sm hover:bg-opacity-80 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// 简化的错误边界组件
interface SimpleErrorFallbackProps {
  error: string
  onRetry?: () => void
}

export function SimpleErrorFallback({ error, onRetry }: SimpleErrorFallbackProps) {
  return (
    <div className="p-4 text-center text-gray-500">
      <p className="mb-2">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          Retry
        </button>
      )}
    </div>
  )
}