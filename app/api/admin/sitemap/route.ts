import { NextRequest, NextResponse } from 'next/server'
import { sitemapManager } from '@/lib/sitemap-manager'
import { logAdminAccess, isAdminEnabled } from '@/lib/admin-security'

// GET - 获取 sitemap 设置和状态
export async function GET(request: NextRequest) {
  const enableAdmin = isAdminEnabled()
  
  if (!enableAdmin) {
    logAdminAccess('/api/admin/sitemap', false)
    return NextResponse.json({ error: 'Admin access disabled' }, { status: 403 })
  }
  
  logAdminAccess('/api/admin/sitemap', true)
  
  try {
    const { searchParams } = new URL(request.url)
    const includeAllUrls = searchParams.get('includeAll') === 'true'
    
    const data = await sitemapManager.getSitemapData(includeAllUrls)
    
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('GET sitemap error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get sitemap data'
    }, { status: 500 })
  }
}

// POST - 更新 sitemap 设置
export async function POST(request: NextRequest) {
  const enableAdmin = isAdminEnabled()
  
  if (!enableAdmin) {
    logAdminAccess('/api/admin/sitemap', false)
    return NextResponse.json({ error: 'Admin access disabled' }, { status: 403 })
  }
  
  logAdminAccess('/api/admin/sitemap', true)
  
  try {
    const body = await request.json()
    const { action, settings } = body
    
    if (action === 'generate') {
      // 生成 sitemap
      const result = await sitemapManager.generateSitemap()
      
      if (result.success) {
        const updatedData = await sitemapManager.getSitemapData()
        return NextResponse.json({
          success: true,
          message: result.message,
          totalUrls: result.totalUrls,
          data: updatedData
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.message
        }, { status: 500 })
      }
    } else if (action === 'updateSettings') {
      // 更新设置
      const result = await sitemapManager.saveSettings(settings)
      
      if (result.success) {
        const updatedData = await sitemapManager.getSitemapData()
        return NextResponse.json({
          success: true,
          message: result.message,
          data: updatedData
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.message
        }, { status: 500 })
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('POST sitemap error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process sitemap request'
    }, { status: 500 })
  }
}

// PUT - 添加/更新自定义 URL
export async function PUT(request: NextRequest) {
  const enableAdmin = isAdminEnabled()
  
  if (!enableAdmin) {
    logAdminAccess('/api/admin/sitemap', false)
    return NextResponse.json({ error: 'Admin access disabled' }, { status: 403 })
  }
  
  logAdminAccess('/api/admin/sitemap', true)
  
  try {
    const body = await request.json()
    const { url, priority, changeFrequency } = body
    
    // 验证 URL
    const validation = sitemapManager.validateUrl(url)
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.message
      }, { status: 400 })
    }
    
    // 获取当前设置
    const settings = await sitemapManager.getSettings()
    
    // 添加或更新自定义 URL
    const existingIndex = settings.customUrls.findIndex(u => u.url === url)
    const customUrl = {
      url,
      priority: priority || 0.5,
      changeFrequency: changeFrequency || 'weekly',
      lastModified: new Date().toISOString(),
      isActive: true
    }
    
    if (existingIndex >= 0) {
      settings.customUrls[existingIndex] = customUrl
    } else {
      settings.customUrls.push(customUrl)
    }
    
    const result = await sitemapManager.saveSettings(settings)
    
    if (result.success) {
      const updatedData = await sitemapManager.getSitemapData()
      return NextResponse.json({
        success: true,
        message: existingIndex >= 0 ? 'Custom URL updated' : 'Custom URL added',
        data: updatedData
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 500 })
    }
  } catch (error) {
    console.error('PUT sitemap error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update custom URL'
    }, { status: 500 })
  }
}

// DELETE - 删除自定义 URL
export async function DELETE(request: NextRequest) {
  const enableAdmin = isAdminEnabled()
  
  if (!enableAdmin) {
    logAdminAccess('/api/admin/sitemap', false)
    return NextResponse.json({ error: 'Admin access disabled' }, { status: 403 })
  }
  
  logAdminAccess('/api/admin/sitemap', true)
  
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    
    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL parameter is required'
      }, { status: 400 })
    }
    
    // 获取当前设置
    const settings = await sitemapManager.getSettings()
    
    // 删除自定义 URL
    settings.customUrls = settings.customUrls.filter(u => u.url !== url)
    
    const result = await sitemapManager.saveSettings(settings)
    
    if (result.success) {
      const updatedData = await sitemapManager.getSitemapData()
      return NextResponse.json({
        success: true,
        message: 'Custom URL deleted',
        data: updatedData
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 500 })
    }
  } catch (error) {
    console.error('DELETE sitemap error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete custom URL'
    }, { status: 500 })
  }
}