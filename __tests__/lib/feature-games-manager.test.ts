import { featuredGamesManager, FeaturedGame } from '@/lib/feature-games-manager'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = mockLocalStorage as any

describe('FeaturedGamesManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe('Featured Games Management', () => {
    test('should get all featured games', () => {
      const featuredGames = featuredGamesManager.getAllFeaturedGames()
      expect(Array.isArray(featuredGames)).toBe(true)
      expect(featuredGames.length).toBeGreaterThan(0)
    })

    test('should get active featured game', () => {
      const activeFeaturedGame = featuredGamesManager.getActiveFeaturedGame()
      if (activeFeaturedGame) {
        expect(activeFeaturedGame.isActive).toBe(true)
        expect(activeFeaturedGame.id).toBeTruthy()
        expect(activeFeaturedGame.name).toBeTruthy()
        expect(activeFeaturedGame.description).toBeTruthy()
      }
    })

    test('should get featured game by id', () => {
      const allFeatured = featuredGamesManager.getAllFeaturedGames()
      if (allFeatured.length > 0) {
        const firstFeatured = allFeatured[0]
        const foundFeatured = featuredGamesManager.getFeaturedGameById(firstFeatured.id)
        expect(foundFeatured).toEqual(firstFeatured)
      }
    })

    test('should return null for non-existent featured game id', () => {
      const foundFeatured = featuredGamesManager.getFeaturedGameById('non-existent-id')
      expect(foundFeatured).toBeNull()
    })

    test('should add a new featured game', () => {
      const newFeaturedGame: Omit<FeaturedGame, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Test Featured Game',
        description: 'A test featured game for testing',
        emoji: '🎮',
        gradient: 'from-blue-500 to-purple-600',
        gameUrl: 'https://example.com/test-game',
        isActive: false,
        order: 1
      }
      
      const addedGame = featuredGamesManager.addFeaturedGame(newFeaturedGame)
      expect(addedGame).toBeTruthy()
      expect(addedGame.name).toBe(newFeaturedGame.name)
      expect(addedGame.id).toBeTruthy()
      expect(addedGame.createdAt).toBeTruthy()
      expect(addedGame.updatedAt).toBeTruthy()
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    test('should update a featured game', () => {
      const allFeatured = featuredGamesManager.getAllFeaturedGames()
      if (allFeatured.length > 0) {
        const gameToUpdate = allFeatured[0]
        const updatedName = 'Updated Featured Game Name'
        
        const success = featuredGamesManager.updateFeaturedGame(gameToUpdate.id, {
          name: updatedName,
          description: 'Updated description',
          isActive: !gameToUpdate.isActive
        })
        
        expect(success).toBe(true)
        expect(mockLocalStorage.setItem).toHaveBeenCalled()
        
        const updatedGame = featuredGamesManager.getFeaturedGameById(gameToUpdate.id)
        expect(updatedGame?.name).toBe(updatedName)
      }
    })

    test('should delete a featured game', () => {
      // First add a game to delete
      const testGame = featuredGamesManager.addFeaturedGame({
        name: 'Game to Delete',
        description: 'This game will be deleted',
        emoji: '🗑️',
        gradient: 'from-red-500 to-pink-600',
        gameUrl: 'https://example.com/delete-test',
        isActive: false,
        order: 999
      })
      
      const initialCount = featuredGamesManager.getAllFeaturedGames().length
      
      const success = featuredGamesManager.deleteFeaturedGame(testGame.id)
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      const finalCount = featuredGamesManager.getAllFeaturedGames().length
      expect(finalCount).toBe(initialCount - 1)
      
      const deletedGame = featuredGamesManager.getFeaturedGameById(testGame.id)
      expect(deletedGame).toBeNull()
    })

    test('should not delete non-existent featured game', () => {
      const success = featuredGamesManager.deleteFeaturedGame('non-existent-id')
      expect(success).toBe(false)
    })
  })

  describe('Featured Games Activation', () => {
    test('should activate a featured game', () => {
      const allFeatured = featuredGamesManager.getAllFeaturedGames()
      if (allFeatured.length > 0) {
        const gameToActivate = allFeatured.find(g => !g.isActive) || allFeatured[0]
        
        const success = featuredGamesManager.activateFeaturedGame(gameToActivate.id)
        expect(success).toBe(true)
        expect(mockLocalStorage.setItem).toHaveBeenCalled()
        
        const activatedGame = featuredGamesManager.getFeaturedGameById(gameToActivate.id)
        expect(activatedGame?.isActive).toBe(true)
        
        // Should be the active featured game
        const activeGame = featuredGamesManager.getActiveFeaturedGame()
        expect(activeGame?.id).toBe(gameToActivate.id)
      }
    })

    test('should deactivate all other games when activating one', () => {
      const allFeatured = featuredGamesManager.getAllFeaturedGames()
      if (allFeatured.length > 1) {
        const gameToActivate = allFeatured[0]
        
        featuredGamesManager.activateFeaturedGame(gameToActivate.id)
        
        const updatedFeatured = featuredGamesManager.getAllFeaturedGames()
        const activeGames = updatedFeatured.filter(g => g.isActive)
        
        // Only one game should be active
        expect(activeGames.length).toBe(1)
        expect(activeGames[0].id).toBe(gameToActivate.id)
      }
    })

    test('should deactivate all featured games', () => {
      const success = featuredGamesManager.deactivateAllFeaturedGames()
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      const allFeatured = featuredGamesManager.getAllFeaturedGames()
      const activeGames = allFeatured.filter(g => g.isActive)
      expect(activeGames.length).toBe(0)
      
      const activeGame = featuredGamesManager.getActiveFeaturedGame()
      expect(activeGame).toBeNull()
    })
  })

  describe('Featured Games Ordering', () => {
    test('should reorder featured games', () => {
      const allFeatured = featuredGamesManager.getAllFeaturedGames()
      if (allFeatured.length >= 2) {
        const gameIds = allFeatured.map(g => g.id)
        const reorderedIds = [gameIds[1], gameIds[0], ...gameIds.slice(2)]
        
        const success = featuredGamesManager.reorderFeaturedGames(reorderedIds)
        expect(success).toBe(true)
        expect(mockLocalStorage.setItem).toHaveBeenCalled()
        
        const reorderedGames = featuredGamesManager.getAllFeaturedGames()
        expect(reorderedGames[0].id).toBe(gameIds[1])
        expect(reorderedGames[1].id).toBe(gameIds[0])
      }
    })

    test('should move featured game up in order', () => {
      const allFeatured = featuredGamesManager.getAllFeaturedGames()
      if (allFeatured.length >= 2) {
        const gameToMove = allFeatured[1] // Second game
        
        const success = featuredGamesManager.moveFeaturedGameUp(gameToMove.id)
        expect(success).toBe(true)
        expect(mockLocalStorage.setItem).toHaveBeenCalled()
        
        const reorderedGames = featuredGamesManager.getAllFeaturedGames()
        expect(reorderedGames[0].id).toBe(gameToMove.id)
      }
    })

    test('should move featured game down in order', () => {
      const allFeatured = featuredGamesManager.getAllFeaturedGames()
      if (allFeatured.length >= 2) {
        const gameToMove = allFeatured[0] // First game
        
        const success = featuredGamesManager.moveFeaturedGameDown(gameToMove.id)
        expect(success).toBe(true)
        expect(mockLocalStorage.setItem).toHaveBeenCalled()
        
        const reorderedGames = featuredGamesManager.getAllFeaturedGames()
        expect(reorderedGames[1].id).toBe(gameToMove.id)
      }
    })

    test('should not move first game up further', () => {
      const allFeatured = featuredGamesManager.getAllFeaturedGames()
      if (allFeatured.length > 0) {
        const firstGame = allFeatured[0]
        
        const success = featuredGamesManager.moveFeaturedGameUp(firstGame.id)
        expect(success).toBe(false) // Should not be able to move up
      }
    })

    test('should not move last game down further', () => {
      const allFeatured = featuredGamesManager.getAllFeaturedGames()
      if (allFeatured.length > 0) {
        const lastGame = allFeatured[allFeatured.length - 1]
        
        const success = featuredGamesManager.moveFeaturedGameDown(lastGame.id)
        expect(success).toBe(false) // Should not be able to move down
      }
    })
  })

  describe('Featured Games Validation', () => {
    test('should validate featured game data', () => {
      const validGame = {
        name: 'Valid Game',
        description: 'A valid game description that meets minimum requirements',
        emoji: '🎮',
        gradient: 'from-blue-500 to-purple-600',
        gameUrl: 'https://example.com/valid-game',
        isActive: false,
        order: 1
      }
      
      const validation = featuredGamesManager.validateFeaturedGame(validGame)
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('should detect invalid featured game data', () => {
      const invalidGame = {
        name: '', // Empty name
        description: 'Short', // Too short description
        emoji: '', // Empty emoji
        gradient: 'invalid-gradient', // Invalid gradient
        gameUrl: 'invalid-url', // Invalid URL
        isActive: false,
        order: -1 // Negative order
      }
      
      const validation = featuredGamesManager.validateFeaturedGame(invalidGame)
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    test('should validate gradient format', () => {
      const validGradients = [
        'from-blue-500 to-purple-600',
        'from-red-400 via-pink-500 to-purple-600',
        'from-green-300 to-blue-500'
      ]
      
      validGradients.forEach(gradient => {
        expect(featuredGamesManager.isValidGradient(gradient)).toBe(true)
      })
      
      const invalidGradients = [
        'invalid-gradient',
        'from-invalid to-invalid',
        'blue to purple',
        ''
      ]
      
      invalidGradients.forEach(gradient => {
        expect(featuredGamesManager.isValidGradient(gradient)).toBe(false)
      })
    })
  })

  describe('Data Persistence', () => {
    test('should load featured games from localStorage if available', () => {
      const mockStoredData = JSON.stringify([
        {
          id: 'stored-featured-1',
          name: 'Stored Featured Game',
          description: 'This is a stored featured game from localStorage',
          emoji: '💾',
          gradient: 'from-purple-500 to-blue-600',
          gameUrl: 'https://example.com/stored-game',
          isActive: true,
          order: 1,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      ])
      
      mockLocalStorage.getItem.mockReturnValue(mockStoredData)
      
      // Create new instance to test loading
      const testFeaturedManager = new (featuredGamesManager.constructor as any)()
      const storedGame = testFeaturedManager.getFeaturedGameById('stored-featured-1')
      
      expect(storedGame?.name).toBe('Stored Featured Game')
      expect(storedGame?.emoji).toBe('💾')
    })

    test('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      // Should not throw error and return default games
      expect(() => {
        const testFeaturedManager = new (featuredGamesManager.constructor as any)()
        const games = testFeaturedManager.getAllFeaturedGames()
        expect(games).toBeTruthy()
      }).not.toThrow()
    })

    test('should handle invalid JSON in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json data')
      
      // Should not throw error and return default games
      expect(() => {
        const testFeaturedManager = new (featuredGamesManager.constructor as any)()
        const games = testFeaturedManager.getAllFeaturedGames()
        expect(games).toBeTruthy()
      }).not.toThrow()
    })
  })

  describe('Featured Games Statistics', () => {
    test('should get featured games statistics', () => {
      const stats = featuredGamesManager.getFeaturedGamesStats()
      
      expect(stats).toBeTruthy()
      expect(typeof stats.totalFeatured).toBe('number')
      expect(typeof stats.activeFeatured).toBe('number')
      expect(typeof stats.inactiveFeatured).toBe('number')
      expect(stats.totalFeatured).toBe(stats.activeFeatured + stats.inactiveFeatured)
    })

    test('should get most recently updated featured game', () => {
      const allFeatured = featuredGamesManager.getAllFeaturedGames()
      if (allFeatured.length > 0) {
        const mostRecent = featuredGamesManager.getMostRecentlyUpdated()
        expect(mostRecent).toBeTruthy()
        
        // Should be one of the existing games
        const foundGame = allFeatured.find(g => g.id === mostRecent?.id)
        expect(foundGame).toBeTruthy()
      }
    })
  })
})