import { NextRequest, NextResponse } from 'next/server'

// GET /api/robots - 返回robots.txt内容
export async function GET(request: NextRequest) {
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://takecareofshadowmilk.cc/sitemap.xml
Sitemap: https://takecareofshadowmilk.cc/sitemapindex.xml

# Disallow admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /test/

# Allow important game and category pages
Allow: /game/
Allow: /category/
Allow: /hot-games
Allow: /new-games
Allow: /about
Allow: /contact
Allow: /privacy
Allow: /terms`

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400' // 24小时缓存
    }
  })
}