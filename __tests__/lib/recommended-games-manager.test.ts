import { recommendedGamesManager } from '../../lib/recommended-games-manager'
import { dataManager } from '../../lib/data-manager'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = mockLocalStorage as any

// Mock dataManager
jest.mock('../../lib/data-manager', () => ({
  dataManager: {
    getAllGames: jest.fn().mockResolvedValue([
      {
        id: 'game-1',
        name: 'Test Game 1',
        category: 'puzzle',
        rating: 4.5,
        isActive: true,
      },
      {
        id: 'game-2', 
        name: 'Test Game 2',
        category: 'action',
        rating: 4.0,
        isActive: true,
      },
    ]),
    getGameById: jest.fn().mockImplementation(async (id) => {
      const games = [
        { id: 'game-1', name: 'Test Game 1', category: 'puzzle', rating: 4.5, isActive: true },
        { id: 'game-2', name: 'Test Game 2', category: 'action', rating: 4.0, isActive: true },
      ]
      return games.find(g => g.id === id) || null
    }),
  },
}))

const mockGetAllGames = dataManager.getAllGames as jest.MockedFunction<typeof dataManager.getAllGames>
const mockGetGameById = dataManager.getGameById as jest.MockedFunction<typeof dataManager.getGameById>

describe('RecommendedGamesManager', () => {
  const mockGames = [
    {
      id: 'game-1',
      name: 'Test Game 1',
      description: 'First test game',
      category: 'puzzle',
      rating: 4.5,
      thumbnailUrl: '/test1.png',
      developer: 'Test Dev 1',
      tags: ['puzzle', 'casual'],
      releaseDate: '2025',
      addedDate: '2025-01-01',
      viewCount: 1000,
      playCount: 500,
      gameType: 'iframe' as const,
      gameUrl: 'https://example.com/game1',
      controls: ['mouse'],
      platforms: ['web'],
      languages: ['en'],
      features: ['single-player'],
      isActive: true,
      isFeatured: false
    },
    {
      id: 'game-2',
      name: 'Test Game 2',
      description: 'Second test game',
      category: 'action',
      rating: 4.0,
      thumbnailUrl: '/test2.png',
      developer: 'Test Dev 2',
      tags: ['action', 'arcade'],
      releaseDate: '2025',
      addedDate: '2025-01-01',
      viewCount: 800,
      playCount: 400,
      gameType: 'iframe' as const,
      gameUrl: 'https://example.com/game2',
      controls: ['keyboard'],
      platforms: ['web'],
      languages: ['en'],
      features: ['multiplayer'],
      isActive: true,
      isFeatured: true
    },
    {
      id: 'game-3',
      name: 'Test Game 3',
      description: 'Third test game',
      category: 'strategy',
      rating: 4.2,
      thumbnailUrl: '/test3.png',
      developer: 'Test Dev 3',
      tags: ['strategy', 'thinking'],
      releaseDate: '2025',
      addedDate: '2025-01-01',
      viewCount: 1200,
      playCount: 600,
      gameType: 'iframe' as const,
      gameUrl: 'https://example.com/game3',
      controls: ['mouse', 'keyboard'],
      platforms: ['web'],
      languages: ['en'],
      features: ['single-player'],
      isActive: true,
      isFeatured: false
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockGetAllGames.mockReturnValue(mockGames)
    mockGetGameById.mockImplementation((id) => mockGames.find(g => g.id === id) || null)
  })

  describe('Recommendation Management', () => {
    test('should get all recommendations', () => {
      const recommendations = recommendedGamesManager.getAllRecommendations()
      expect(Array.isArray(recommendations)).toBe(true)
    })

    test('should get active recommendations', () => {
      const activeRecommendations = recommendedGamesManager.getActiveRecommendations()
      expect(Array.isArray(activeRecommendations)).toBe(true)
      
      // All returned recommendations should be active
      activeRecommendations.forEach(rec => {
        expect(rec.isActive).toBe(true)
      })
    })

    test('should get recommendations for display with limit', () => {
      const limit = 4
      const recommendations = recommendedGamesManager.getRecommendationsForDisplay(limit)
      expect(Array.isArray(recommendations)).toBe(true)
      expect(recommendations.length).toBeLessThanOrEqual(limit)
    })

    test('should add a new recommendation', () => {
      const gameId = 'game-1'
      const success = recommendedGamesManager.addRecommendation(gameId, 1)
      
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      const recommendations = recommendedGamesManager.getAllRecommendations()
      const addedRec = recommendations.find(r => r.gameId === gameId)
      expect(addedRec).toBeTruthy()
    })

    test('should not add duplicate recommendation', () => {
      const gameId = 'game-1'
      
      // Add first recommendation
      recommendedGamesManager.addRecommendation(gameId, 1)
      const initialCount = recommendedGamesManager.getAllRecommendations().length
      
      // Try to add same game again
      const success = recommendedGamesManager.addRecommendation(gameId, 2)
      expect(success).toBe(false)
      
      const finalCount = recommendedGamesManager.getAllRecommendations().length
      expect(finalCount).toBe(initialCount)
    })

    test('should remove a recommendation', () => {
      const gameId = 'game-1'
      
      // Add recommendation first
      recommendedGamesManager.addRecommendation(gameId, 1)
      const initialCount = recommendedGamesManager.getAllRecommendations().length
      
      // Remove it
      const success = recommendedGamesManager.removeRecommendation(gameId)
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      const finalCount = recommendedGamesManager.getAllRecommendations().length
      expect(finalCount).toBe(initialCount - 1)
    })

    test('should not remove non-existent recommendation', () => {
      const success = recommendedGamesManager.removeRecommendation('non-existent-game')
      expect(success).toBe(false)
    })

    test('should update recommendation priority', () => {
      const gameId = 'game-1'
      
      // Add recommendation first
      recommendedGamesManager.addRecommendation(gameId, 1)
      
      // Update priority
      const newPriority = 5
      const success = recommendedGamesManager.updateRecommendationPriority(gameId, newPriority)
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      const recommendations = recommendedGamesManager.getAllRecommendations()
      const updatedRec = recommendations.find(r => r.gameId === gameId)
      expect(updatedRec?.priority).toBe(newPriority)
    })

    test('should toggle recommendation active status', () => {
      const gameId = 'game-1'
      
      // Add recommendation first
      recommendedGamesManager.addRecommendation(gameId, 1)
      
      const recommendations = recommendedGamesManager.getAllRecommendations()
      const rec = recommendations.find(r => r.gameId === gameId)
      const initialStatus = rec?.isActive || false
      
      // Toggle status
      const success = recommendedGamesManager.toggleRecommendationStatus(gameId)
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      const updatedRecommendations = recommendedGamesManager.getAllRecommendations()
      const updatedRec = updatedRecommendations.find(r => r.gameId === gameId)
      expect(updatedRec?.isActive).toBe(!initialStatus)
    })
  })

  describe('Recommendation Ordering', () => {
    test('should reorder recommendations', () => {
      // Add multiple recommendations
      recommendedGamesManager.addRecommendation('game-1', 1)
      recommendedGamesManager.addRecommendation('game-2', 2)
      recommendedGamesManager.addRecommendation('game-3', 3)
      
      const newOrder = ['game-3', 'game-1', 'game-2']
      const success = recommendedGamesManager.reorderRecommendations(newOrder)
      
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      const recommendations = recommendedGamesManager.getAllRecommendations()
        .sort((a, b) => a.priority - b.priority)
      
      expect(recommendations[0].gameId).toBe('game-3')
      expect(recommendations[1].gameId).toBe('game-1')
      expect(recommendations[2].gameId).toBe('game-2')
    })

    test('should move recommendation up', () => {
      // Add multiple recommendations
      recommendedGamesManager.addRecommendation('game-1', 1)
      recommendedGamesManager.addRecommendation('game-2', 2)
      
      const success = recommendedGamesManager.moveRecommendationUp('game-2')
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      const recommendations = recommendedGamesManager.getAllRecommendations()
        .sort((a, b) => a.priority - b.priority)
      
      expect(recommendations[0].gameId).toBe('game-2')
      expect(recommendations[1].gameId).toBe('game-1')
    })

    test('should move recommendation down', () => {
      // Add multiple recommendations
      recommendedGamesManager.addRecommendation('game-1', 1)
      recommendedGamesManager.addRecommendation('game-2', 2)
      
      const success = recommendedGamesManager.moveRecommendationDown('game-1')
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      const recommendations = recommendedGamesManager.getAllRecommendations()
        .sort((a, b) => a.priority - b.priority)
      
      expect(recommendations[0].gameId).toBe('game-2')
      expect(recommendations[1].gameId).toBe('game-1')
    })

    test('should not move first recommendation up further', () => {
      recommendedGamesManager.addRecommendation('game-1', 1)
      
      const success = recommendedGamesManager.moveRecommendationUp('game-1')
      expect(success).toBe(false)
    })

    test('should not move last recommendation down further', () => {
      recommendedGamesManager.addRecommendation('game-1', 1)
      recommendedGamesManager.addRecommendation('game-2', 2)
      
      const success = recommendedGamesManager.moveRecommendationDown('game-2')
      expect(success).toBe(false)
    })
  })

  describe('Smart Recommendations', () => {
    test('should get smart recommendations based on game data', () => {
      const smartRecommendations = recommendedGamesManager.getSmartRecommendations(4)
      expect(Array.isArray(smartRecommendations)).toBe(true)
      expect(smartRecommendations.length).toBeLessThanOrEqual(4)
      
      // Should return game objects, not recommendation objects
      smartRecommendations.forEach(game => {
        expect(game.id).toBeTruthy()
        expect(game.name).toBeTruthy()
      })
    })

    test('should fill remaining slots with random games when manual recommendations are insufficient', () => {
      // Add only 2 manual recommendations
      recommendedGamesManager.addRecommendation('game-1', 1)
      recommendedGamesManager.addRecommendation('game-2', 2)
      
      // Request 4 recommendations
      const recommendations = recommendedGamesManager.getRecommendationsForDisplay(4)
      
      expect(recommendations.length).toBeLessThanOrEqual(4)
      // Should include the 2 manual ones plus potentially random ones
    })

    test('should get recommended games by category', () => {
      const puzzleRecommendations = recommendedGamesManager.getRecommendationsByCategory('puzzle', 2)
      expect(Array.isArray(puzzleRecommendations)).toBe(true)
      
      puzzleRecommendations.forEach(game => {
        expect(game.category).toBe('puzzle')
      })
    })

    test('should get recommended games by rating threshold', () => {
      const highRatedRecommendations = recommendedGamesManager.getRecommendationsByRating(4.0, 3)
      expect(Array.isArray(highRatedRecommendations)).toBe(true)
      
      highRatedRecommendations.forEach(game => {
        expect(game.rating).toBeGreaterThanOrEqual(4.0)
      })
    })
  })

  describe('Recommendation Statistics', () => {
    test('should get recommendation statistics', () => {
      // Add some recommendations
      recommendedGamesManager.addRecommendation('game-1', 1)
      recommendedGamesManager.addRecommendation('game-2', 2)
      recommendedGamesManager.toggleRecommendationStatus('game-2') // Make it inactive
      
      const stats = recommendedGamesManager.getRecommendationStats()
      
      expect(stats).toBeTruthy()
      expect(typeof stats.totalRecommendations).toBe('number')
      expect(typeof stats.activeRecommendations).toBe('number')
      expect(typeof stats.inactiveRecommendations).toBe('number')
      expect(stats.totalRecommendations).toBe(stats.activeRecommendations + stats.inactiveRecommendations)
    })

    test('should get category distribution of recommendations', () => {
      recommendedGamesManager.addRecommendation('game-1', 1) // puzzle
      recommendedGamesManager.addRecommendation('game-2', 2) // action
      
      const stats = recommendedGamesManager.getRecommendationStats()
      expect(stats.categoryDistribution).toBeTruthy()
      expect(typeof stats.categoryDistribution).toBe('object')
    })
  })

  describe('Bulk Operations', () => {
    test('should clear all recommendations', () => {
      // Add some recommendations first
      recommendedGamesManager.addRecommendation('game-1', 1)
      recommendedGamesManager.addRecommendation('game-2', 2)
      
      const success = recommendedGamesManager.clearAllRecommendations()
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      const recommendations = recommendedGamesManager.getAllRecommendations()
      expect(recommendations.length).toBe(0)
    })

    test('should activate all recommendations', () => {
      // Add some recommendations and make some inactive
      recommendedGamesManager.addRecommendation('game-1', 1)
      recommendedGamesManager.addRecommendation('game-2', 2)
      recommendedGamesManager.toggleRecommendationStatus('game-2') // Make inactive
      
      const success = recommendedGamesManager.activateAllRecommendations()
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      const activeRecommendations = recommendedGamesManager.getActiveRecommendations()
      const allRecommendations = recommendedGamesManager.getAllRecommendations()
      expect(activeRecommendations.length).toBe(allRecommendations.length)
    })

    test('should deactivate all recommendations', () => {
      // Add some recommendations
      recommendedGamesManager.addRecommendation('game-1', 1)
      recommendedGamesManager.addRecommendation('game-2', 2)
      
      const success = recommendedGamesManager.deactivateAllRecommendations()
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      const activeRecommendations = recommendedGamesManager.getActiveRecommendations()
      expect(activeRecommendations.length).toBe(0)
    })
  })

  describe('Data Persistence', () => {
    test('should load recommendations from localStorage if available', () => {
      const mockStoredData = JSON.stringify([
        {
          gameId: 'stored-game-1',
          priority: 1,
          isActive: true,
          addedAt: '2025-01-01T00:00:00.000Z'
        }
      ])
      
      mockLocalStorage.getItem.mockReturnValue(mockStoredData)
      
      // Create new instance to test loading
      const testRecommendedManager = new (recommendedGamesManager.constructor as any)()
      const storedRecommendations = testRecommendedManager.getAllRecommendations()
      
      const storedRec = storedRecommendations.find((r: any) => r.gameId === 'stored-game-1')
      expect(storedRec).toBeTruthy()
    })

    test('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      // Should not throw error and return empty array
      expect(() => {
        const testRecommendedManager = new (recommendedGamesManager.constructor as any)()
        const recommendations = testRecommendedManager.getAllRecommendations()
        expect(Array.isArray(recommendations)).toBe(true)
      }).not.toThrow()
    })

    test('should handle invalid JSON in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json data')
      
      // Should not throw error and return empty array
      expect(() => {
        const testRecommendedManager = new (recommendedGamesManager.constructor as any)()
        const recommendations = testRecommendedManager.getAllRecommendations()
        expect(Array.isArray(recommendations)).toBe(true)
      }).not.toThrow()
    })
  })

  describe('Game Validation', () => {
    test('should validate that game exists before adding recommendation', () => {
      mockGetGameById.mockReturnValue(null)
      
      const success = recommendedGamesManager.addRecommendation('non-existent-game', 1)
      expect(success).toBe(false)
    })

    test('should validate that game is active before adding recommendation', () => {
      const inactiveGame = { ...mockGames[0], isActive: false }
      mockGetGameById.mockReturnValue(inactiveGame)
      
      const success = recommendedGamesManager.addRecommendation('game-1', 1)
      expect(success).toBe(false)
    })

    test('should validate priority ranges', () => {
      const success1 = recommendedGamesManager.addRecommendation('game-1', 0) // Invalid priority
      expect(success1).toBe(false)
      
      const success2 = recommendedGamesManager.addRecommendation('game-1', -1) // Invalid priority
      expect(success2).toBe(false)
      
      const success3 = recommendedGamesManager.addRecommendation('game-1', 1) // Valid priority
      expect(success3).toBe(true)
    })
  })
})