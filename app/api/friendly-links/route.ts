import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// Public API to get friendly links (no admin restrictions)
// 公共API获取友情链接（无管理员限制）

interface FriendlyLink {
  id: string
  name: string
  url: string
  description: string
  isVisible: boolean
  order: number
  createdAt: string
  updatedAt: string
}

function getDefaultFriendlyLinks(): FriendlyLink[] {
  return []
}

async function loadFromFile(): Promise<FriendlyLink[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'friendly-links.json')
    const fileContent = await fs.readFile(filePath, 'utf8')
    const loadedData = JSON.parse(fileContent)
    console.log('Friendly links data loaded from file:', filePath)
    
    // Handle the actual data structure which has links array
    if (loadedData.links && Array.isArray(loadedData.links)) {
      return loadedData.links.map((link: any) => ({
        id: link.id,
        name: link.name,
        url: link.url,
        description: link.description || '',
        isVisible: link.isActive, // isActive maps to isVisible
        order: link.priority || 0, // priority maps to order
        createdAt: link.createdAt,
        updatedAt: link.updatedAt
      }))
    }
    return loadedData
  } catch (error) {
    console.log('Failed to load friendly links data from file, using default:', error)
    return getDefaultFriendlyLinks()
  }
}

export async function GET() {
  try {
    const friendlyLinks = await loadFromFile()
    // Only return visible friendly links
    const visibleFriendlyLinks = friendlyLinks
      .filter(link => link.isVisible)
      .sort((a, b) => a.order - b.order)
    
    return NextResponse.json(visibleFriendlyLinks)
  } catch (error) {
    console.error('GET friendly links error:', error)
    return NextResponse.json(getDefaultFriendlyLinks(), { status: 200 })
  }
}