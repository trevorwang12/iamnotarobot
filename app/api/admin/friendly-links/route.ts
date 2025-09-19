import { NextRequest, NextResponse } from 'next/server'
import { createAdminResponse, logAdminAccess } from '@/lib/admin-security'
import { promises as fs } from 'fs'
import path from 'path'

interface FriendlyLink {
  id: string
  name: string
  url: string
  description: string
  logo: string
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

interface FriendlyLinksData {
  links: FriendlyLink[]
  settings: {
    isVisible: boolean
    title: string
    subtitle: string
    maxLinksToShow: number
    openInNewTab: boolean
    showLogo: boolean
    showDescription: boolean
  }
}

function getDefaultFriendlyLinksData(): FriendlyLinksData {
  return {
    links: [
      {
        id: "example-link-1",
        name: "take care of shadow milk",
        url: "https://takecareofshadowmilk.cc/",
        description: "Best gaming platform with amazing games",
        logo: "",
        isActive: true,
        priority: 1,
        createdAt: "2025-08-29T12:00:00.000Z",
        updatedAt: "2025-09-01T03:14:21.307Z"
      },
      {
        id: "example-link-2",
        name: "blood money",
        url: "https://blood-money.cc/",
        description: "Free online games for everyone",
        logo: "",
        isActive: true,
        priority: 2,
        createdAt: "2025-08-29T12:00:00.000Z",
        updatedAt: "2025-09-01T03:14:59.646Z"
      }
    ],
    settings: {
      isVisible: true,
      title: 'Friendly Links',
      subtitle: 'Check out our partner gaming sites',
      maxLinksToShow: 10,
      openInNewTab: true,
      showLogo: true,
      showDescription: true
    }
  }
}

// 内存中的友情链接数据，服务重启后会恢复默认值
let friendlyLinksData: FriendlyLinksData = getDefaultFriendlyLinksData()

// 从文件加载最新数据
async function loadFromFile(): Promise<FriendlyLinksData> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'friendly-links.json')
    const fileContent = await fs.readFile(filePath, 'utf8')
    const loadedData = JSON.parse(fileContent)
    console.log('Friendly links data loaded from file:', filePath)
    return loadedData
  } catch (error) {
    console.log('Failed to load friendly links data from file, using default:', error)
    return getDefaultFriendlyLinksData()
  }
}

// 将数据保存到 JSON 文件
async function saveToFile(data: FriendlyLinksData) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'friendly-links.json')
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
    console.log('Data saved to file:', filePath)
  } catch (error) {
    console.error('Failed to save data to file:', error)
    // 不抛出错误，让内存更新继续进行
  }
}

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 验证URL格式
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// GET - 获取友情链接数据
export async function GET() {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/friendly-links', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/friendly-links', true)
  try {
    friendlyLinksData = await loadFromFile()
    return NextResponse.json({
      success: true,
      data: friendlyLinksData
    })
  } catch (error) {
    console.error('GET friendly links error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch friendly links'
    }, { status: 500 })
  }
}

// POST - 添加友情链接
export async function POST(request: NextRequest) {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/friendly-links', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/friendly-links', true)
  try {
    // Load latest data from file before making changes
    friendlyLinksData = await loadFromFile()
    
    const body = await request.json()
    const { name, url, description, logo, priority } = body

    // 验证必填字段
    if (!name || !url) {
      return NextResponse.json({
        success: false,
        error: 'Name and URL are required'
      }, { status: 400 })
    }

    // 验证URL格式
    if (!isValidUrl(url)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid URL format'
      }, { status: 400 })
    }

    // 检查URL是否已存在
    const existingLink = friendlyLinksData.links.find(link => link.url === url)
    if (existingLink) {
      return NextResponse.json({
        success: false,
        error: 'URL already exists'
      }, { status: 400 })
    }

    const newLink: FriendlyLink = {
      id: generateId(),
      name: name.trim(),
      url: url.trim(),
      description: description ? description.trim() : '',
      logo: logo ? logo.trim() : '/placeholder-logo.png',
      isActive: true,
      priority: priority || friendlyLinksData.links.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    friendlyLinksData.links.push(newLink)
    
    // 按优先级排序
    friendlyLinksData.links.sort((a, b) => a.priority - b.priority)
    
    // 保存到文件
    await saveToFile(friendlyLinksData)

    return NextResponse.json({
      success: true,
      message: 'Friendly link added successfully',
      data: newLink
    })
  } catch (error) {
    console.error('POST friendly links error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to add friendly link'
    }, { status: 500 })
  }
}

// PUT - 更新友情链接或设置
export async function PUT(request: NextRequest) {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/friendly-links', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/friendly-links', true)
  try {
    // Load latest data from file before making changes
    friendlyLinksData = await loadFromFile()
    
    const body = await request.json()
    const { action, linkId, linkData, settings } = body

    if (action === 'updateLink' && linkId && linkData) {
      // 更新友情链接
      const linkIndex = friendlyLinksData.links.findIndex(link => link.id === linkId)
      
      if (linkIndex === -1) {
        return NextResponse.json({
          success: false,
          error: 'Link not found'
        }, { status: 404 })
      }

      // 验证URL格式
      if (linkData.url && !isValidUrl(linkData.url)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid URL format'
        }, { status: 400 })
      }

      // 检查URL是否与其他链接重复
      if (linkData.url) {
        const existingLink = friendlyLinksData.links.find(link => link.url === linkData.url && link.id !== linkId)
        if (existingLink) {
          return NextResponse.json({
            success: false,
            error: 'URL already exists'
          }, { status: 400 })
        }
      }

      friendlyLinksData.links[linkIndex] = {
        ...friendlyLinksData.links[linkIndex],
        ...linkData,
        updatedAt: new Date().toISOString()
      }

      // 如果更新了优先级，重新排序
      if (linkData.priority !== undefined) {
        friendlyLinksData.links.sort((a, b) => a.priority - b.priority)
      }

    } else if (action === 'updateSettings' && settings) {
      // 更新设置
      friendlyLinksData.settings = {
        ...friendlyLinksData.settings,
        ...settings
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action or missing parameters'
      }, { status: 400 })
    }

    // 保存到文件
    await saveToFile(friendlyLinksData)

    return NextResponse.json({
      success: true,
      message: 'Updated successfully',
      data: friendlyLinksData
    })
  } catch (error) {
    console.error('PUT friendly links error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update friendly links'
    }, { status: 500 })
  }
}

// DELETE - 删除友情链接
export async function DELETE(request: NextRequest) {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/friendly-links', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/friendly-links', true)
  try {
    // Load latest data from file before making changes
    friendlyLinksData = await loadFromFile()
    
    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get('linkId')

    if (!linkId) {
      return NextResponse.json({
        success: false,
        error: 'Link ID is required'
      }, { status: 400 })
    }

    const linkIndex = friendlyLinksData.links.findIndex(link => link.id === linkId)

    if (linkIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Link not found'
      }, { status: 404 })
    }

    const deletedLink = friendlyLinksData.links.splice(linkIndex, 1)[0]

    // 保存到文件
    await saveToFile(friendlyLinksData)

    return NextResponse.json({
      success: true,
      message: 'Friendly link deleted successfully',
      data: deletedLink
    })
  } catch (error) {
    console.error('DELETE friendly links error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete friendly link'
    }, { status: 500 })
  }
}