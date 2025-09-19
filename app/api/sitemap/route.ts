import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// GET /api/sitemap - 返回sitemap.xml的内容
export async function GET(request: NextRequest) {
  try {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml')
    
    // 检查sitemap.xml是否存在
    try {
      await fs.access(sitemapPath)
    } catch (error) {
      // 如果sitemap.xml不存在，生成一个基本的sitemap
      const { sitemapManager } = await import('@/lib/sitemap-manager')
      const result = await sitemapManager.generateSitemap()
      
      if (!result.success) {
        return NextResponse.json(
          { error: 'Failed to generate sitemap' }, 
          { status: 500 }
        )
      }
    }
    
    // 读取并返回sitemap.xml内容
    const sitemapContent = await fs.readFile(sitemapPath, 'utf8')
    
    return new NextResponse(sitemapContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' // 1小时缓存
      }
    })
    
  } catch (error) {
    console.error('Error serving sitemap:', error)
    
    // 返回基本的错误sitemap
    const errorSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://takecareofshadowmilk.cc</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`

    return new NextResponse(errorSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'no-cache'
      }
    })
  }
}