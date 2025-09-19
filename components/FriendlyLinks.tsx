'use client'

import React, { useState, useEffect } from 'react'

interface FriendlyLink {
  id: string
  name: string
  url: string
  description?: string
}

const FriendlyLinks: React.FC = () => {
  const [links, setLinks] = useState<FriendlyLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(true)

  // 加载数据 - 智能选择API
  const loadData = async () => {
    try {
      // 首先尝试管理员API（本地环境可用）
      let response = await fetch('/api/admin/friendly-links')
      
      if (response.ok) {
        // 使用管理员API的数据格式
        const result = await response.json()
        if (result.success && result.data) {
          const activeLinks = result.data.links.filter((link: any) => link.isActive)
          setLinks(activeLinks.map((link: any) => ({
            id: link.id,
            name: link.name,
            url: link.url,
            description: link.description
          })))
          setIsVisible(result.data.settings.isVisible)
        }
      } else if (response.status === 403) {
        // 管理员API被禁用，使用公共API（生产环境）
        response = await fetch('/api/friendly-links')
        if (response.ok) {
          const data = await response.json()
          setLinks(data)
          setIsVisible(true) // 公共API只返回可见的链接
        }
      }
    } catch (error) {
      console.error('Failed to load friendly links:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    // 监听友情链接更新事件（仅在本地环境有效）
    const handleLinksUpdate = () => {
      loadData()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('friendlyLinksUpdated', handleLinksUpdate)
      return () => {
        window.removeEventListener('friendlyLinksUpdated', handleLinksUpdate)
      }
    }
  }, [])

  // 如果正在加载、设置为不可见或没有链接，则不显示
  if (isLoading || !isVisible || links.length === 0) {
    return null
  }

  return (
    <div className="text-center text-sm text-gray-500 mb-4">
      <div className="flex flex-wrap justify-center gap-4">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors"
          >
            {link.name}
          </a>
        ))}
      </div>
    </div>
  )
}

export default FriendlyLinks