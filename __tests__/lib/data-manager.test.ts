import { dataManager } from '@/lib/data-manager'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = mockLocalStorage as any

describe('DataManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Game Management', () => {
    test('should get all games', () => {
      const games = dataManager.getAllGames()
      expect(Array.isArray(games)).toBe(true)
      expect(games.length).toBeGreaterThan(0)
    })

    test('should get game by ID', () => {
      const games = dataManager.getAllGames()
      if (games.length > 0) {
        const firstGame = games[0]
        const foundGame = dataManager.getGameById(firstGame.id)
        expect(foundGame).toEqual(firstGame)
      }
    })

    test('should return null for non-existent game ID', () => {
      const foundGame = dataManager.getGameById('non-existent-id')
      expect(foundGame).toBeNull()
    })

    test('should get hot games with correct limit', () => {
      const limit = 5
      const hotGames = dataManager.getHotGames(limit)
      expect(Array.isArray(hotGames)).toBe(true)
      expect(hotGames.length).toBeLessThanOrEqual(limit)
      
      // Should be sorted by view count in descending order
      for (let i = 0; i < hotGames.length - 1; i++) {
        expect(hotGames[i].viewCount).toBeGreaterThanOrEqual(hotGames[i + 1].viewCount)
      }
    })

    test('should get new games with correct limit', () => {
      const limit = 5
      const newGames = dataManager.getNewGames(limit)
      expect(Array.isArray(newGames)).toBe(true)
      expect(newGames.length).toBeLessThanOrEqual(limit)
      
      // Should be sorted by addedDate in descending order (newest first)
      for (let i = 0; i < newGames.length - 1; i++) {
        const current = new Date(newGames[i].addedDate)
        const next = new Date(newGames[i + 1].addedDate)
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime())
      }
    })

    test('should search games by name', () => {
      const games = dataManager.getAllGames()
      if (games.length > 0) {
        const firstGame = games[0]
        const searchTerm = firstGame.name.toLowerCase().substring(0, 3)
        const searchResults = dataManager.searchGames(searchTerm)
        
        expect(Array.isArray(searchResults)).toBe(true)
        expect(searchResults.length).toBeGreaterThan(0)
        
        // All results should contain the search term
        searchResults.forEach(game => {
          const matchFound = (
            game.name.toLowerCase().includes(searchTerm) ||
            game.description.toLowerCase().includes(searchTerm) ||
            game.category.toLowerCase().includes(searchTerm) ||
            game.developer.toLowerCase().includes(searchTerm) ||
            game.tags.some(tag => tag.toLowerCase().includes(searchTerm))
          )
          expect(matchFound).toBe(true)
        })
      }
    })

    test('should search games with limit', () => {
      const limit = 3
      const searchResults = dataManager.searchGames('game', limit)
      expect(Array.isArray(searchResults)).toBe(true)
      expect(searchResults.length).toBeLessThanOrEqual(limit)
    })

    test('should return empty array for search with no results', () => {
      const searchResults = dataManager.searchGames('xyznonexistentgame123')
      expect(Array.isArray(searchResults)).toBe(true)
      expect(searchResults.length).toBe(0)
    })

    test('should update game view count', () => {
      const games = dataManager.getAllGames()
      if (games.length > 0) {
        const gameId = games[0].id
        const originalViewCount = games[0].viewCount
        
        // Mock localStorage.setItem to track calls
        const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')
        
        dataManager.updateGameViews(gameId)
        
        // Should have called localStorage.setItem to update the view count
        expect(setItemSpy).toHaveBeenCalled()
        
        setItemSpy.mockRestore()
      }
    })

    test('should format play count correctly', () => {
      expect(dataManager.formatPlayCount(999)).toBe('999')
      expect(dataManager.formatPlayCount(1000)).toBe('1.0K')
      expect(dataManager.formatPlayCount(1500)).toBe('1.5K')
      expect(dataManager.formatPlayCount(1000000)).toBe('1.0M')
      expect(dataManager.formatPlayCount(1500000)).toBe('1.5M')
      expect(dataManager.formatPlayCount(1000000000)).toBe('1.0B')
    })
  })

  describe('Category Management', () => {
    test('should get all categories', () => {
      const categories = dataManager.getAllCategories()
      expect(Array.isArray(categories)).toBe(true)
      expect(categories.length).toBeGreaterThan(0)
    })

    test('should get category by ID', () => {
      const categories = dataManager.getAllCategories()
      if (categories.length > 0) {
        const firstCategory = categories[0]
        const foundCategory = dataManager.getCategoryById(firstCategory.id)
        expect(foundCategory).toEqual(firstCategory)
      }
    })

    test('should return null for non-existent category ID', () => {
      const foundCategory = dataManager.getCategoryById('non-existent-category')
      expect(foundCategory).toBeNull()
    })
  })

  describe('Game Addition', () => {
    test('should add a new game', () => {
      const initialCount = dataManager.getAllGames().length
      
      const newGame = {
        name: 'Test Game',
        description: 'A test game for unit testing',
        thumbnailUrl: '/test-image.png',
        category: 'puzzle',
        tags: ['test', 'puzzle'],
        rating: 4.5,
        developer: 'Test Developer',
        releaseDate: '2025',
        gameType: 'iframe' as const,
        gameUrl: 'https://example.com/test-game',
        controls: ['mouse'],
        platforms: ['web'],
        languages: ['en'],
        features: ['single-player'],
        isActive: true,
        isFeatured: false
      }
      
      const addedGame = dataManager.addGame({ ...newGame, id: 'test-game-123' })
      
      expect(addedGame).toBeTruthy()
      expect(addedGame.name).toBe(newGame.name)
      expect(addedGame.description).toBe(newGame.description)
      
      // Should have increased the total count
      const newCount = dataManager.getAllGames().length
      expect(newCount).toBe(initialCount + 1)
    })

    test('should update an existing game', () => {
      const games = dataManager.getAllGames()
      if (games.length > 0) {
        const gameToUpdate = games[0]
        const updatedName = 'Updated Game Name'
        
        const success = dataManager.updateGame(gameToUpdate.id, {
          ...gameToUpdate,
          name: updatedName
        })
        
        expect(success).toBe(true)
        
        const updatedGame = dataManager.getGameById(gameToUpdate.id)
        expect(updatedGame?.name).toBe(updatedName)
      }
    })

    test('should delete a game', () => {
      // First add a game to delete
      const testGame = dataManager.addGame({
        id: 'test-delete-game',
        name: 'Game to Delete',
        description: 'This game will be deleted',
        thumbnailUrl: '/test.png',
        category: 'action',
        tags: ['test'],
        rating: 3.0,
        developer: 'Test Dev',
        releaseDate: '2025',
        gameType: 'iframe',
        gameUrl: 'https://example.com/delete-test',
        controls: ['mouse'],
        platforms: ['web'],
        languages: ['en'],
        features: ['single-player'],
        isActive: true,
        isFeatured: false
      })
      
      const initialCount = dataManager.getAllGames().length
      
      const success = dataManager.deleteGame('test-delete-game')
      expect(success).toBe(true)
      
      const finalCount = dataManager.getAllGames().length
      expect(finalCount).toBe(initialCount - 1)
      
      const deletedGame = dataManager.getGameById('test-delete-game')
      expect(deletedGame).toBeNull()
    })
  })
})