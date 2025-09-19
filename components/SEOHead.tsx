'use client'

import { useEffect, useState } from 'react'

interface SEOHeadProps {
  pageType?: 'home' | 'game' | 'category'
  gameData?: any
  categoryData?: any
}

export default function SEOHead({ pageType = 'home', gameData, categoryData }: SEOHeadProps) {
  const [seoSettings, setSeoSettings] = useState<any>(null)

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') return


    const loadSEOSettings = async () => {
      try {
        // 从API获取SEO设置
        const response = await fetch('/api/seo')
        if (response.ok) {
          const data = await response.json()
          setSeoSettings(data.seoSettings || null)
        } else {
          // 使用默认设置
          setSeoSettings({
            siteName: 'GAMES',
            siteDescription: 'Best Online Gaming Platform - Play hundreds of free browser games',
            keywords: ['online games', 'browser games', 'free games'],
            author: 'Gaming Platform',
            ogTitle: 'GAMES - Best Free Online Games',
            ogDescription: 'Play the best free online games. No download required!',
            metaTags: {
              themeColor: '#475569'
            }
          })
        }
      } catch (error) {
        console.log('SEO settings load error:', error)
        // 使用默认设置
        setSeoSettings({
          siteName: 'GAMES',
          siteDescription: 'Best Online Gaming Platform - Play hundreds of free browser games',
          keywords: ['online games', 'browser games', 'free games'],
          author: 'Gaming Platform',
          ogTitle: 'GAMES - Best Free Online Games',
          ogDescription: 'Play the best free online games. No download required!',
          metaTags: {
            themeColor: '#475569'
          }
        })
      }
    }

    loadSEOSettings()

    // 监听SEO设置变化
    const handleSEOUpdate = async () => {
      await loadSEOSettings()
    }

    // 监听自定义事件
    window.addEventListener('seoSettingsUpdated', handleSEOUpdate)

    return () => {
      window.removeEventListener('seoSettingsUpdated', handleSEOUpdate)
    }
  }, [])

  useEffect(() => {
    // 只在客户端执行，并且SEO设置存在时
    if (typeof window === 'undefined' || typeof document === 'undefined' || !seoSettings) return

    try {
      // 更新document title
      let title = seoSettings.siteName || 'GAMES'
      let description = seoSettings.siteDescription || 'Play the best free online games'

      // 根据页面类型调整标题和描述
      if (pageType === 'game' && gameData) {
        title = `${gameData.name} - Play Free Online | ${seoSettings.siteName}`
        description = `Play ${gameData.name} for free online! ${gameData.description} No download required.`
      } else if (pageType === 'category' && categoryData) {
        title = `${categoryData.name} Games - Free Online | ${seoSettings.siteName}`
        description = `Play the best ${categoryData.name} games for free! Discover hundreds of exciting ${categoryData.name} games.`
      }

      document.title = title

      // 更新meta标签
      updateMetaTag('description', description)
      updateMetaTag('keywords', seoSettings.keywords?.join(', ') || '')
      updateMetaTag('author', seoSettings.author || '')
      
      // 更新Open Graph标签
      updateMetaTag('og:title', seoSettings.ogTitle || title, 'property')
      updateMetaTag('og:description', seoSettings.ogDescription || description, 'property')
      updateMetaTag('og:site_name', seoSettings.siteName, 'property')
      updateMetaTag('og:type', 'website', 'property')

      // 更新Twitter Card标签
      updateMetaTag('twitter:card', 'summary_large_image')
      updateMetaTag('twitter:title', seoSettings.ogTitle || title)
      updateMetaTag('twitter:description', seoSettings.ogDescription || description)

      // 更新theme-color
      updateMetaTag('theme-color', seoSettings.metaTags?.themeColor || '#475569')
    } catch (error) {
      console.log('SEO update error:', error)
    }
  }, [seoSettings, pageType, gameData, categoryData])

  const updateMetaTag = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
    if (!content) return

    try {
      // 查找现有的meta标签
      let metaTag = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement
      
      if (metaTag) {
        // 更新现有标签
        metaTag.content = content
      } else {
        // 创建新标签
        metaTag = document.createElement('meta')
        metaTag.setAttribute(attribute, name)
        metaTag.content = content
        document.head.appendChild(metaTag)
      }
    } catch (error) {
      console.log(`Meta tag update error for ${name}:`, error)
    }
  }

  return null
}