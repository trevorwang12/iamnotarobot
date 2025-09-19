import { NextResponse } from 'next/server'
import { DataService } from '@/lib/data-service'

// 安全的广告内容API - 只返回白名单域名的广告内容
// "Security through simplicity, not obscurity" - Linus philosophy

// 允许的广告域名白名单
const ALLOWED_AD_DOMAINS = [
  'googlesyndication.com',
  'pagead2.googlesyndication.com',
  'googletagmanager.com',
  'revenuecpmgate.com',
  'highperformanceformat.com',
  // 可以根据需要添加更多可信域名
]

interface AdWithContent {
  id: string
  position: string
  htmlContent: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

function sanitizeAdContent(htmlContent: string): string | null {
  // 简单的安全检查
  if (!htmlContent || htmlContent.length > 10000) {
    return null // 拒绝空内容或超长内容
  }
  
  // 检查是否包含允许的域名
  const hasAllowedDomain = ALLOWED_AD_DOMAINS.some(domain => 
    htmlContent.includes(domain)
  )
  
  if (!hasAllowedDomain) {
    console.warn('Ad content rejected: no allowed domain found')
    return null
  }
  
  // 基本的XSS防护 - 移除危险标签
  const dangerous = ['<iframe', '<object', '<embed', '<form', 'javascript:', 'data:', 'vbscript:']
  const lower = htmlContent.toLowerCase()
  
  for (const danger of dangerous) {
    if (lower.includes(danger)) {
      console.warn(`Ad content rejected: contains ${danger}`)
      return null
    }
  }
  
  return htmlContent
}

export async function GET() {
  try {
    const ads = await DataService.getAds()
    
    // 过滤并清理广告内容
    const safeAds = ads
      .filter((ad: any) => ad.isActive)
      .map((ad: any) => {
        const sanitizedContent = sanitizeAdContent(ad.htmlContent)
        
        if (!sanitizedContent) {
          return null // 不安全的广告内容
        }
        
        return {
          id: ad.id,
          position: ad.position,
          htmlContent: sanitizedContent,
          isActive: ad.isActive,
          createdAt: ad.createdAt,
          updatedAt: ad.updatedAt
        }
      })
      .filter(Boolean) // 移除null值
    
    return NextResponse.json(safeAds)
  } catch (error) {
    console.error('GET ads content error:', error)
    return NextResponse.json([], { status: 200 })
  }
}