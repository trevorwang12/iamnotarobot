"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { cacheManager } from "@/lib/cache-manager"
import { dataManager } from "@/lib/data-manager"

export default function SafePreloadManager() {
  const pathname = usePathname()

  useEffect(() => {
    // 只在客户端且非admin页面执行预加载
    if (typeof window === 'undefined' || pathname === '/admin') {
      return
    }

    const preloadCriticalData = async () => {
      try {
        // 延迟执行，避免阻塞首次渲染
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 预加载热门游戏
        cacheManager.preload('hot-games-8', () => dataManager.getHotGames(8))
        
        // 预加载新游戏
        cacheManager.preload('new-games-8', () => dataManager.getNewGames(8))
        
        // 预加载分类
        cacheManager.preload('categories', () => dataManager.getAllCategories())
        
        console.log('Safe preload completed for', pathname)
      } catch (error) {
        console.warn('Preload failed:', error)
      }
    }

    preloadCriticalData()
  }, [pathname])

  useEffect(() => {
    // DNS预取（安全操作）
    if (typeof document !== 'undefined') {
      const domains = ['fonts.googleapis.com', 'fonts.gstatic.com']
      
      domains.forEach(domain => {
        const existing = document.querySelector(`link[href="//${domain}"]`)
        if (!existing) {
          const link = document.createElement('link')
          link.rel = 'dns-prefetch'
          link.href = `//${domain}`
          document.head.appendChild(link)
        }
      })
    }
  }, [])

  return null
}