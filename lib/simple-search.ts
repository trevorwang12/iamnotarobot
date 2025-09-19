// 简单的搜索工具，直接从API获取数据
export interface GameData {
  id: string
  name: string
  description?: string
  thumbnailUrl: string
  category: string
  tags?: string[]
  rating: number
  developer?: string
  isActive: boolean
}

class SimpleSearch {
  private games: GameData[] = []
  private initialized = false

  async loadGames(): Promise<GameData[]> {
    if (this.initialized && this.games.length > 0) {
      return this.games
    }

    try {
      console.log('Loading games from API...')
      const response = await fetch('/api/games')
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }
      
      const data = await response.json()
      this.games = data || []
      this.initialized = true
      console.log(`Loaded ${this.games.length} games from API`)
      return this.games
    } catch (error) {
      console.error('Failed to load games from API:', error)
      // 如果API失败，返回一些示例数据
      this.games = [
        {
          id: "cut-the-rope",
          name: "Take Care of Shadow Milk",
          thumbnailUrl: "/uploads/1756619405301-aiazr8.png",
          category: "meme-games",
          rating: 5,
          isActive: true
        },
        {
          id: "bubble-shooter", 
          name: "Bubble Shooter",
          thumbnailUrl: "/placeholder.svg",
          category: "puzzle",
          rating: 4.5,
          isActive: true
        }
      ]
      this.initialized = true
      console.log(`Using fallback data: ${this.games.length} games`)
      return this.games
    }
  }

  async searchGames(query: string, limit?: number): Promise<GameData[]> {
    const games = await this.loadGames()
    
    if (!query || query.trim() === '') {
      return []
    }

    const searchTerm = query.toLowerCase().trim()
    const results = games.filter(game => 
      game.isActive && (
        game.name.toLowerCase().includes(searchTerm) ||
        (game.description && game.description.toLowerCase().includes(searchTerm)) ||
        game.category.toLowerCase().includes(searchTerm) ||
        (game.developer && game.developer.toLowerCase().includes(searchTerm)) ||
        (game.tags && game.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      )
    )

    console.log(`Search for "${query}": found ${results.length} results`)
    return limit ? results.slice(0, limit) : results
  }

  async getHotGames(limit: number = 8): Promise<GameData[]> {
    const games = await this.loadGames()
    return games.filter(game => game.isActive).slice(0, limit)
  }

  async getNewGames(limit: number = 8): Promise<GameData[]> {
    const games = await this.loadGames()
    return games.filter(game => game.isActive).slice(0, limit)
  }
}

// 导出单例
export const simpleSearch = new SimpleSearch()