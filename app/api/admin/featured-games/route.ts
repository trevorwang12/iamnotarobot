import { NextRequest, NextResponse } from 'next/server'
import { createAdminResponse, logAdminAccess } from '@/lib/admin-security'
import { DataService } from '@/lib/data-service'
import { promises as fs } from 'fs'
import path from 'path'

interface FeaturedGame {
  id: string
  name: string
  description: string
  emoji: string
  thumbnailUrl?: string
  gameUrl: string
  isActive: boolean
  gradient: string
  createdAt: string
  updatedAt: string
}

function getDefaultFeaturedGames(): FeaturedGame[] {
  return [
    {
      id: 'chill-guy-clicker',
      name: 'CHILL GUY CLICKER',
      description: 'The most relaxing clicking game you\'ll ever play!',
      emoji: '😎',
      thumbnailUrl: '',
      gameUrl: 'https://www.crazygames.com/embed/chill-guy-clicker',
      isActive: true,
      gradient: 'from-orange-400 to-pink-500',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
}

// 内存中的特色游戏数据，服务重启后会恢复默认值
let featuredGamesData: FeaturedGame[] = getDefaultFeaturedGames()

// 从文件加载最新数据
async function loadFromFile(): Promise<FeaturedGame[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'featured-games.json')
    const fileContent = await fs.readFile(filePath, 'utf8')
    const loadedData = JSON.parse(fileContent)
    console.log('Featured games data loaded from file:', filePath)
    return loadedData
  } catch (error) {
    console.log('Failed to load featured games data from file, using default:', error)
    return getDefaultFeaturedGames()
  }
}

// 将数据保存到 JSON 文件
async function saveToFile(data: FeaturedGame[]) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'featured-games.json')
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
    console.log('Featured games data saved to file:', filePath)
    DataService.clearCache()
  } catch (error) {
    console.error('Failed to save featured games data to file:', error)
    // 不抛出错误，让内存更新继续进行
  }
}


export async function GET() {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/featured-games', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/featured-games', true)
  try {
    featuredGamesData = await loadFromFile()
    return NextResponse.json(featuredGamesData)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch featured games' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/featured-games', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/featured-games', true)
  try {
    const newGame: Omit<FeaturedGame, 'id' | 'createdAt' | 'updatedAt'> = await request.json()
    
    const featuredGame: FeaturedGame = {
      ...newGame,
      id: `featured_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    featuredGamesData.push(featuredGame)
    await saveToFile(featuredGamesData)
    
    return NextResponse.json(featuredGame, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add featured game' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/featured-games', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/featured-games', true)
  try {
    // Load latest data from file before making changes
    featuredGamesData = await loadFromFile()
    
    const { gameId, updates } = await request.json()
    
    const gameIndex = featuredGamesData.findIndex(g => g.id === gameId)
    if (gameIndex === -1) {
      return NextResponse.json({ error: 'Featured game not found' }, { status: 404 })
    }
    
    featuredGamesData[gameIndex] = {
      ...featuredGamesData[gameIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    await saveToFile(featuredGamesData)
    
    return NextResponse.json(featuredGamesData[gameIndex])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update featured game' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/featured-games', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/featured-games', true)
  try {
    // Load latest data from file before making changes
    featuredGamesData = await loadFromFile()
    
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('id')
    
    if (!gameId) {
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 })
    }
    
    const gameIndex = featuredGamesData.findIndex(g => g.id === gameId)
    
    if (gameIndex === -1) {
      return NextResponse.json({ error: 'Featured game not found' }, { status: 404 })
    }
    
    featuredGamesData.splice(gameIndex, 1)
    await saveToFile(featuredGamesData)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete featured game' }, { status: 500 })
  }
}
