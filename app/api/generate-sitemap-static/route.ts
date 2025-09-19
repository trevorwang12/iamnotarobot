import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { DataService } from '@/lib/data-service'

export async function GET() {
  try {
    const baseUrl = 'https://takecareofshadowmilk.cc'
    const now = new Date().toISOString().split('T')[0]
    
    // 获取游戏和分类数据
    const games = await DataService.getGames()
    const categories = await DataService.getCategories()
    
    // 静态页面
    const staticPages = [
      { url: baseUrl, priority: '1.0', changefreq: 'daily' },
      { url: `${baseUrl}/about`, priority: '0.8', changefreq: 'monthly' },
      { url: `${baseUrl}/contact`, priority: '0.7', changefreq: 'monthly' },
      { url: `${baseUrl}/privacy`, priority: '0.5', changefreq: 'yearly' },
      { url: `${baseUrl}/terms`, priority: '0.5', changefreq: 'yearly' },
      { url: `${baseUrl}/hot-games`, priority: '0.9', changefreq: 'daily' },
      { url: `${baseUrl}/new-games`, priority: '0.9', changefreq: 'daily' }
    ]

    // 游戏页面
    const gamePages = games
      .filter((game: any) => game.isActive)
      .map((game: any) => ({
        url: `${baseUrl}/game/${game.slug || game.id}`,
        priority: '0.8',
        changefreq: 'weekly'
      }))
    
    // 分类页面
    const categoryPages = categories
      .filter((category: any) => category.isActive)
      .map((category: any) => ({
        url: `${baseUrl}/category/${category.slug || category.id}`,
        priority: '0.7', 
        changefreq: 'weekly'
      }))

    const allPages = [...staticPages, ...gamePages, ...categoryPages]

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    // 保存到public目录
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap-0.xml')
    await fs.writeFile(sitemapPath, sitemapXml, 'utf8')

    return NextResponse.json({ 
      success: true, 
      message: `Generated sitemap with ${allPages.length} URLs`,
      urls: allPages.length
    })
  } catch (error) {
    console.error('Error generating static sitemap:', error)
    return NextResponse.json(
      { error: 'Failed to generate sitemap' }, 
      { status: 500 }
    )
  }
}