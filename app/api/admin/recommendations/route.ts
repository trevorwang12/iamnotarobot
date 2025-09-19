import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import defaultRecommendations from '@/data/recommended-games.json'
import { createAdminResponse, logAdminAccess } from '@/lib/admin-security'

interface RecommendedGame {
  id: string
  gameId: string
  priority: number
  isActive: boolean
  addedDate: string
}

// 内存中的推荐游戏数据，服务重启后会恢复默认值
let recommendationsData: RecommendedGame[] = defaultRecommendations as RecommendedGame[]

// 从文件加载最新数据
async function loadFromFile(): Promise<RecommendedGame[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'recommended-games.json')
    const fileContent = await fs.readFile(filePath, 'utf8')
    const loadedData = JSON.parse(fileContent)
    console.log('Recommendations data loaded from file:', filePath)
    return loadedData
  } catch (error) {
    console.log('Failed to load recommendations data from file, using default:', error)
    return defaultRecommendations as RecommendedGame[]
  }
}

// 将数据保存到 JSON 文件
async function saveToFile(data: RecommendedGame[]) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'recommended-games.json')
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
    console.log('Data saved to file:', filePath)
  } catch (error) {
    console.error('Failed to save data to file:', error)
    // 不抛出错误，让内存更新继续进行
  }
}


export async function GET() {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/recommendations', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/recommendations', true)
  try {
    recommendationsData = await loadFromFile()
    return NextResponse.json(recommendationsData)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/recommendations', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/recommendations', true)
  try {
    // Load latest data from file before making changes
    recommendationsData = await loadFromFile()
    
    const { gameId, priority } = await request.json()
    
    // Check if game already recommended
    const existing = recommendationsData.find(rec => rec.gameId === gameId)
    if (existing) {
      return NextResponse.json({ error: 'Game already recommended' }, { status: 400 })
    }
    
    const newRecommendation: RecommendedGame = {
      id: `rec_${Date.now()}`,
      gameId,
      priority: priority || (recommendationsData.length + 1),
      isActive: true,
      addedDate: new Date().toISOString().split('T')[0]
    }
    
    recommendationsData.push(newRecommendation)
    await saveToFile(recommendationsData)
    
    return NextResponse.json(newRecommendation, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add recommendation' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/recommendations', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/recommendations', true)
  try {
    // Load latest data from file before making changes
    recommendationsData = await loadFromFile()
    
    const { recommendationId, updates } = await request.json()
    
    const recIndex = recommendationsData.findIndex(r => r.id === recommendationId)
    if (recIndex === -1) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
    }
    
    recommendationsData[recIndex] = {
      ...recommendationsData[recIndex],
      ...updates
    }
    await saveToFile(recommendationsData)
    
    return NextResponse.json(recommendationsData[recIndex])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update recommendation' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/recommendations', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/recommendations', true)
  try {
    // Load latest data from file before making changes
    recommendationsData = await loadFromFile()
    
    const { searchParams } = new URL(request.url)
    const recommendationId = searchParams.get('id')
    
    if (!recommendationId) {
      return NextResponse.json({ error: 'Recommendation ID is required' }, { status: 400 })
    }
    
    const recIndex = recommendationsData.findIndex(r => r.id === recommendationId)
    
    if (recIndex === -1) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
    }
    
    recommendationsData.splice(recIndex, 1)
    await saveToFile(recommendationsData)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete recommendation' }, { status: 500 })
  }
}