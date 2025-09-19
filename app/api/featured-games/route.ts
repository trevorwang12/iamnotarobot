import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// Public API to get featured games (no admin restrictions)
// 公共API获取推荐游戏（无管理员限制）

interface FeaturedGame {
  id: string
  title: string
  description: string
  image: string
  gameUrl: string
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

function getDefaultFeaturedGames(): FeaturedGame[] {
  return []
}

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

export async function GET() {
  try {
    const featuredGames = await loadFromFile()
    // Only return active featured games
    const activeFeaturedGames = featuredGames
      .filter(game => game.isActive)
      .sort((a, b) => a.order - b.order)
    
    return NextResponse.json(activeFeaturedGames)
  } catch (error) {
    console.error('GET featured games error:', error)
    return NextResponse.json(getDefaultFeaturedGames(), { status: 200 })
  }
}