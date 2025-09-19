import { NextResponse } from 'next/server'
import { DataService } from '@/lib/data-service'

// "Talk is cheap. Show me the code." - Linus
// 简化的API路由，所有重复逻辑移到DataService

export async function GET() {
  try {
    const homepageContent = await DataService.getHomepageContent()
    return NextResponse.json(homepageContent)
  } catch (error) {
    console.error('GET homepage error:', error)
    // 永远不要让API错误导致页面崩溃
    const fallback = await DataService.getHomepageContent()
    return NextResponse.json(fallback, { status: 200 })
  }
}