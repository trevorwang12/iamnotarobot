import { NextResponse } from 'next/server'
import { DataService } from '@/lib/data-service'

// "Security is not a feature, it's a foundation." - Linus
// 注意：这个API返回的广告内容需要在客户端进行安全处理

interface SafeAdSlot {
  id: string
  position: string  
  // 移除htmlContent - 不在公共API中暴露原始HTML
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export async function GET() {
  try {
    const ads = await DataService.getAds()
    
    // 只返回活跃广告的安全字段
    const safeAds: SafeAdSlot[] = ads
      .filter((ad: any) => ad.isActive)
      .map((ad: any) => ({
        id: ad.id,
        position: ad.position,
        isActive: ad.isActive,
        createdAt: ad.createdAt,
        updatedAt: ad.updatedAt
      }))
    
    return NextResponse.json(safeAds)
  } catch (error) {
    console.error('GET ads error:', error)
    return NextResponse.json([], { status: 200 })
  }
}