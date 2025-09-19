import { seoManager, SEOSettings, GamePageSEO, CategoryPageSEO } from '@/lib/seo-manager'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = mockLocalStorage as any

describe('SEOManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe('SEO Settings Management', () => {
    test('should get default SEO settings when no stored data', () => {
      const settings = seoManager.getSEOSettings()
      
      expect(settings).toBeTruthy()
      expect(settings?.siteName).toBe('GAMES')
      expect(settings?.siteDescription).toBe('Best Online Gaming Platform - Play hundreds of free browser games')
      expect(settings?.keywords).toContain('online games')
      expect(settings?.keywords).toContain('browser games')
    })

    test('should update SEO settings', () => {
      const newSettings: Partial<SEOSettings> = {
        siteName: 'Updated Gaming Site',
        siteDescription: 'Updated description for testing',
        keywords: ['test', 'gaming', 'updated']
      }
      
      const success = seoManager.updateSEOSettings(newSettings)
      expect(success).toBe(true)
      
      // Should have called localStorage.setItem
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    test('should validate SEO settings correctly', () => {
      // Valid settings
      const validSettings: Partial<SEOSettings> = {
        siteName: 'Valid Site Name',
        siteDescription: 'This is a valid description that is between 50 and 160 characters long for proper SEO optimization',
        siteUrl: 'https://example.com',
        keywords: ['gaming', 'online', 'fun']
      }
      
      const validation = seoManager.validateSEOSettings(validSettings)
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('should detect invalid SEO settings', () => {
      // Invalid settings
      const invalidSettings: Partial<SEOSettings> = {
        siteName: 'A', // Too short
        siteDescription: 'Too short', // Too short
        siteUrl: 'invalid-url', // Invalid URL format
        keywords: [] // Empty keywords
      }
      
      const validation = seoManager.validateSEOSettings(invalidSettings)
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    test('should generate meta tags correctly', () => {
      const metaTags = seoManager.generateMetaTags('home')
      
      expect(typeof metaTags).toBe('string')
      expect(metaTags).toContain('meta name="description"')
      expect(metaTags).toContain('meta name="keywords"')
      expect(metaTags).toContain('meta property="og:')
      expect(metaTags).toContain('meta name="twitter:')
    })

    test('should generate robots.txt content', () => {
      const robotsTxt = seoManager.generateRobotsTxt()
      
      expect(typeof robotsTxt).toBe('string')
      expect(robotsTxt).toContain('User-agent: *')
      expect(robotsTxt).toContain('Disallow: /admin/')
    })

    test('should generate structured data when enabled', () => {
      // First enable structured data
      seoManager.updateSEOSettings({
        structuredData: {
          enabled: true,
          organizationType: 'WebSite',
          organizationName: 'Test Gaming Site'
        }
      })
      
      const structuredData = seoManager.generateStructuredData()
      
      expect(typeof structuredData).toBe('string')
      expect(structuredData).toContain('<script type="application/ld+json">')
      expect(structuredData).toContain('@context')
      expect(structuredData).toContain('@type')
    })
  })

  describe('Game Page SEO Management', () => {
    test('should get default game page SEO settings', () => {
      const gamePageSEO = seoManager.getGamePageSEO()
      
      expect(gamePageSEO).toBeTruthy()
      expect(gamePageSEO?.titleTemplate).toContain('{gameName}')
      expect(gamePageSEO?.descriptionTemplate).toContain('{gameName}')
      expect(gamePageSEO?.keywordsTemplate).toContain('{category}')
    })

    test('should update game page SEO settings', () => {
      const newGamePageSEO: Partial<GamePageSEO> = {
        titleTemplate: '{gameName} - Updated Title | {siteName}',
        descriptionTemplate: 'Updated: Play {gameName} for free! {gameDescription}',
        enableBreadcrumbs: false,
        enableRichSnippets: false
      }
      
      const success = seoManager.updateGamePageSEO(newGamePageSEO)
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('Category Page SEO Management', () => {
    test('should get default category page SEO settings', () => {
      const categoryPageSEO = seoManager.getCategoryPageSEO()
      
      expect(categoryPageSEO).toBeTruthy()
      expect(categoryPageSEO?.titleTemplate).toContain('{categoryName}')
      expect(categoryPageSEO?.descriptionTemplate).toContain('{categoryName}')
      expect(categoryPageSEO?.keywordsTemplate).toContain('{categoryName}')
    })

    test('should update category page SEO settings', () => {
      const newCategoryPageSEO: Partial<CategoryPageSEO> = {
        titleTemplate: '{categoryName} Updated Games | {siteName}',
        descriptionTemplate: 'Updated category description for {categoryName}',
        enablePagination: false
      }
      
      const success = seoManager.updateCategoryPageSEO(newCategoryPageSEO)
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('Data Persistence', () => {
    test('should load settings from localStorage if available', () => {
      const mockStoredData = JSON.stringify({
        seoSettings: {
          id: 'test-settings',
          siteName: 'Stored Gaming Site',
          siteDescription: 'This is a stored description from localStorage',
          keywords: ['stored', 'test'],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      })
      
      mockLocalStorage.getItem.mockReturnValue(mockStoredData)
      
      // Create a new instance to test loading
      const testSeoManager = new (seoManager.constructor as any)()
      const settings = testSeoManager.getSEOSettings()
      
      expect(settings?.siteName).toBe('Stored Gaming Site')
      expect(settings?.keywords).toContain('stored')
    })

    test('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      // Should not throw error and return default settings
      expect(() => {
        const testSeoManager = new (seoManager.constructor as any)()
        const settings = testSeoManager.getSEOSettings()
        expect(settings).toBeTruthy()
      }).not.toThrow()
    })

    test('should handle invalid JSON in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json data')
      
      // Should not throw error and return default settings
      expect(() => {
        const testSeoManager = new (seoManager.constructor as any)()
        const settings = testSeoManager.getSEOSettings()
        expect(settings).toBeTruthy()
      }).not.toThrow()
    })
  })
})