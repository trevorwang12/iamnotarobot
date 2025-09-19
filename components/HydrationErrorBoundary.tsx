"use client"

import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  isHydrationError: boolean
}

export default class HydrationErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, isHydrationError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // 检查是否是水合错误
    const isHydrationError = 
      error.message?.includes('Hydration') ||
      error.message?.includes('hydration') ||
      error.message?.includes('server rendered HTML didn\'t match') ||
      error.stack?.includes('hydration')

    return {
      hasError: true,
      isHydrationError
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 只在非水合错误时记录日志
    if (!this.state.isHydrationError) {
      console.error('Error caught by boundary:', error, errorInfo)
    } else {
      console.warn('Hydration mismatch detected (likely browser extension)', error.message)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isHydrationError) {
        // 对于水合错误，静默处理，让React重新渲染
        return this.props.children
      }
      
      // 对于其他错误，显示fallback
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">Please refresh the page to try again.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}