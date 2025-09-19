import { adManager, AdSlot } from '@/lib/ad-manager'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = mockLocalStorage as any

describe('AdManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe('Ad Slot Management', () => {
    test('should get all ad slots', () => {
      const adSlots = adManager.getAllAdSlots()
      expect(Array.isArray(adSlots)).toBe(true)
      expect(adSlots.length).toBeGreaterThan(0)
      
      // Should include all expected positions
      const positions = adSlots.map(slot => slot.position)
      expect(positions).toContain('header')
      expect(positions).toContain('footer')
      expect(positions).toContain('sidebar')
    })

    test('should get ad slot by position', () => {
      const headerAd = adManager.getAdSlot('header')
      expect(headerAd).toBeTruthy()
      expect(headerAd?.position).toBe('header')
      expect(headerAd?.id).toBeTruthy()
    })

    test('should return null for non-existent position', () => {
      const nonExistentAd = adManager.getAdSlot('non-existent-position' as any)
      expect(nonExistentAd).toBeNull()
    })

    test('should get active ad slots only', () => {
      const activeAds = adManager.getActiveAdSlots()
      expect(Array.isArray(activeAds)).toBe(true)
      
      // All returned slots should be active
      activeAds.forEach(slot => {
        expect(slot.enabled).toBe(true)
      })
    })

    test('should get ad slots by position', () => {
      const positions = ['header', 'footer']
      const adSlots = adManager.getAdSlotsByPosition(positions)
      expect(Array.isArray(adSlots)).toBe(true)
      
      adSlots.forEach(slot => {
        expect(positions).toContain(slot.position)
      })
    })

    test('should update ad slot content', () => {
      const newContent = '<div>Updated Ad Content</div>'
      const success = adManager.updateAdSlot('header', {
        content: newContent,
        enabled: true
      })
      
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      const updatedSlot = adManager.getAdSlot('header')
      expect(updatedSlot?.content).toBe(newContent)
    })

    test('should enable/disable ad slots', () => {
      const success = adManager.updateAdSlot('header', { enabled: false })
      expect(success).toBe(true)
      
      const updatedSlot = adManager.getAdSlot('header')
      expect(updatedSlot?.enabled).toBe(false)
    })

    test('should validate ad slot position', () => {
      expect(adManager.isValidPosition('header')).toBe(true)
      expect(adManager.isValidPosition('footer')).toBe(true)
      expect(adManager.isValidPosition('invalid')).toBe(false)
    })

    test('should sanitize ad content', () => {
      const unsafeContent = '<script>alert("xss")</script><div>Safe content</div>'
      const success = adManager.updateAdSlot('header', {
        content: unsafeContent,
        enabled: true
      })
      
      expect(success).toBe(true)
      const updatedSlot = adManager.getAdSlot('header')
      // Should remove script tags but keep safe HTML
      expect(updatedSlot?.content).not.toContain('<script>')
      expect(updatedSlot?.content).toContain('<div>Safe content</div>')
    })
  })

  describe('Ad Statistics', () => {
    test('should get ad slot statistics', () => {
      const stats = adManager.getAdStats()
      expect(stats).toBeTruthy()
      expect(typeof stats.totalSlots).toBe('number')
      expect(typeof stats.activeSlots).toBe('number')
      expect(typeof stats.inactiveSlots).toBe('number')
      expect(stats.totalSlots).toBe(stats.activeSlots + stats.inactiveSlots)
    })

    test('should get slots by position stats', () => {
      const stats = adManager.getAdStats()
      expect(stats.slotsByPosition).toBeTruthy()
      expect(typeof stats.slotsByPosition).toBe('object')
    })

    test('should track ad impressions', () => {
      const initialStats = adManager.getAdStats()
      
      adManager.trackImpression('header')
      
      const updatedStats = adManager.getAdStats()
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    test('should track ad clicks', () => {
      const initialStats = adManager.getAdStats()
      
      adManager.trackClick('header')
      
      const updatedStats = adManager.getAdStats()
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('Bulk Operations', () => {
    test('should enable all ad slots', () => {
      const success = adManager.enableAllSlots()
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      const allSlots = adManager.getAllAdSlots()
      allSlots.forEach(slot => {
        expect(slot.enabled).toBe(true)
      })
    })

    test('should disable all ad slots', () => {
      const success = adManager.disableAllSlots()
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      const allSlots = adManager.getAllAdSlots()
      allSlots.forEach(slot => {
        expect(slot.enabled).toBe(false)
      })
    })

    test('should clear all ad content', () => {
      const success = adManager.clearAllContent()
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('Data Persistence', () => {
    test('should load ad slots from localStorage if available', () => {
      const mockStoredData = JSON.stringify([
        {
          id: 'stored-header',
          position: 'header',
          content: '<div>Stored Header Ad</div>',
          enabled: true,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01'
        }
      ])
      
      mockLocalStorage.getItem.mockReturnValue(mockStoredData)
      
      // Create new instance to test loading
      const testAdManager = new (adManager.constructor as any)()
      const headerAd = testAdManager.getAdSlot('header')
      
      expect(headerAd?.content).toBe('<div>Stored Header Ad</div>')
    })

    test('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      // Should not throw error and return default slots
      expect(() => {
        const testAdManager = new (adManager.constructor as any)()
        const slots = testAdManager.getAllAdSlots()
        expect(slots).toBeTruthy()
      }).not.toThrow()
    })

    test('should handle invalid JSON in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json')
      
      // Should not throw error and return default slots
      expect(() => {
        const testAdManager = new (adManager.constructor as any)()
        const slots = testAdManager.getAllAdSlots()
        expect(slots).toBeTruthy()
      }).not.toThrow()
    })
  })

  describe('Ad Slot Creation and Deletion', () => {
    test('should add a new ad slot', () => {
      const newSlot: Partial<AdSlot> = {
        position: 'custom-position' as any,
        content: '<div>Custom Ad</div>',
        enabled: true
      }
      
      const success = adManager.addAdSlot(newSlot as AdSlot)
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    test('should delete an ad slot', () => {
      const success = adManager.deleteAdSlot('header')
      expect(success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      const deletedSlot = adManager.getAdSlot('header')
      expect(deletedSlot).toBeNull()
    })

    test('should not delete non-existent ad slot', () => {
      const success = adManager.deleteAdSlot('non-existent')
      expect(success).toBe(false)
    })
  })

  describe('Ad Content Validation', () => {
    test('should validate ad content length', () => {
      const longContent = 'x'.repeat(10001) // Assuming 10000 is the limit
      const success = adManager.updateAdSlot('header', {
        content: longContent,
        enabled: true
      })
      
      // Should either reject or truncate long content
      const updatedSlot = adManager.getAdSlot('header')
      if (success) {
        expect(updatedSlot?.content.length).toBeLessThanOrEqual(10000)
      } else {
        expect(success).toBe(false)
      }
    })

    test('should validate ad content for malicious scripts', () => {
      const maliciousContent = '<script>document.location="http://evil.com"</script>'
      const success = adManager.updateAdSlot('header', {
        content: maliciousContent,
        enabled: true
      })
      
      expect(success).toBe(true)
      const updatedSlot = adManager.getAdSlot('header')
      expect(updatedSlot?.content).not.toContain('<script>')
    })

    test('should allow safe HTML tags', () => {
      const safeContent = '<div class="ad"><img src="/ad.jpg" alt="Ad"><p>Safe ad content</p></div>'
      const success = adManager.updateAdSlot('header', {
        content: safeContent,
        enabled: true
      })
      
      expect(success).toBe(true)
      const updatedSlot = adManager.getAdSlot('header')
      expect(updatedSlot?.content).toContain('<div')
      expect(updatedSlot?.content).toContain('<img')
      expect(updatedSlot?.content).toContain('<p>')
    })
  })
})