import { 
  sanitizeInput, 
  validateGameData, 
  generateSecureId, 
  rateLimiter, 
  validatePassword, 
  hashPassword, 
  validateUrl, 
  escapeHtml, 
  validateImageUrl 
} from '@/lib/security'

// Mock crypto for generateSecureId
const mockCrypto = {
  randomUUID: jest.fn(() => 'mock-uuid-123'),
}
global.crypto = mockCrypto as any

describe('Security Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Input Sanitization', () => {
    test('should sanitize dangerous HTML characters', () => {
      const dangerousInput = '<script>alert("xss")</script><img src=x onerror="alert(1)">'
      const sanitized = sanitizeInput(dangerousInput)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('onerror')
      expect(sanitized).not.toContain('javascript:')
    })

    test('should preserve safe HTML entities', () => {
      const safeInput = 'Game &amp; Fun &lt;3'
      const sanitized = sanitizeInput(safeInput)
      
      expect(sanitized).toContain('&amp;')
      expect(sanitized).toContain('&lt;')
    })

    test('should handle empty and null inputs', () => {
      expect(sanitizeInput('')).toBe('')
      expect(sanitizeInput(null as any)).toBe('')
      expect(sanitizeInput(undefined as any)).toBe('')
    })

    test('should trim whitespace', () => {
      const input = '  test input  '
      const sanitized = sanitizeInput(input)
      expect(sanitized).toBe('test input')
    })

    test('should handle SQL injection attempts', () => {
      const sqlInjection = "'; DROP TABLE users; --"
      const sanitized = sanitizeInput(sqlInjection)
      expect(sanitized).not.toContain('DROP TABLE')
      expect(sanitized).not.toContain('--')
    })
  })

  describe('HTML Escaping', () => {
    test('should escape HTML special characters', () => {
      const htmlInput = '<div class="test">Hello & "World"</div>'
      const escaped = escapeHtml(htmlInput)
      
      expect(escaped).toBe('&lt;div class=&quot;test&quot;&gt;Hello &amp; &quot;World&quot;&lt;/div&gt;')
    })

    test('should handle empty string', () => {
      expect(escapeHtml('')).toBe('')
    })

    test('should handle string with no special characters', () => {
      const normalInput = 'Hello World'
      expect(escapeHtml(normalInput)).toBe('Hello World')
    })
  })

  describe('Game Data Validation', () => {
    const validGameData = {
      name: 'Valid Game',
      description: 'This is a valid game description that meets all requirements',
      category: 'puzzle',
      developer: 'Valid Developer',
      gameUrl: 'https://example.com/game',
      thumbnailUrl: 'https://example.com/thumb.png',
      tags: ['puzzle', 'fun'],
      rating: 4.5
    }

    test('should validate correct game data', () => {
      const validation = validateGameData(validGameData)
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('should detect missing required fields', () => {
      const invalidData = {
        ...validGameData,
        name: '',
        description: ''
      }
      
      const validation = validateGameData(invalidData)
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
      expect(validation.errors.some(e => e.includes('name'))).toBe(true)
      expect(validation.errors.some(e => e.includes('description'))).toBe(true)
    })

    test('should validate game name length', () => {
      const shortNameData = { ...validGameData, name: 'A' }
      const longNameData = { ...validGameData, name: 'A'.repeat(101) }
      
      const shortValidation = validateGameData(shortNameData)
      const longValidation = validateGameData(longNameData)
      
      expect(shortValidation.isValid).toBe(false)
      expect(longValidation.isValid).toBe(false)
    })

    test('should validate description length', () => {
      const shortDescData = { ...validGameData, description: 'Short' }
      const validLongDescData = { ...validGameData, description: 'A'.repeat(2000) }
      
      const shortValidation = validateGameData(shortDescData)
      const longValidation = validateGameData(validLongDescData)
      
      expect(shortValidation.isValid).toBe(false)
      expect(longValidation.isValid).toBe(true) // Long descriptions are now allowed
    })

    test('should validate rating range', () => {
      const lowRatingData = { ...validGameData, rating: -1 }
      const highRatingData = { ...validGameData, rating: 6 }
      
      const lowValidation = validateGameData(lowRatingData)
      const highValidation = validateGameData(highRatingData)
      
      expect(lowValidation.isValid).toBe(false)
      expect(highValidation.isValid).toBe(false)
    })

    test('should validate URL format', () => {
      const invalidUrlData = { ...validGameData, gameUrl: 'not-a-url' }
      const validation = validateGameData(invalidUrlData)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(e => e.includes('URL'))).toBe(true)
    })

    test('should validate tags array', () => {
      const emptyTagsData = { ...validGameData, tags: [] }
      const tooManyTagsData = { ...validGameData, tags: new Array(11).fill('tag') }
      
      const emptyValidation = validateGameData(emptyTagsData)
      const tooManyValidation = validateGameData(tooManyTagsData)
      
      expect(emptyValidation.isValid).toBe(false)
      expect(tooManyValidation.isValid).toBe(false)
    })
  })

  describe('URL Validation', () => {
    test('should validate HTTP and HTTPS URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true)
      expect(validateUrl('http://example.com')).toBe(true)
      expect(validateUrl('https://example.com/path?query=1')).toBe(true)
    })

    test('should reject invalid URLs', () => {
      expect(validateUrl('not-a-url')).toBe(false)
      expect(validateUrl('ftp://example.com')).toBe(false)
      expect(validateUrl('javascript:alert(1)')).toBe(false)
      expect(validateUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    })

    test('should handle empty or null URLs', () => {
      expect(validateUrl('')).toBe(false)
      expect(validateUrl(null as any)).toBe(false)
      expect(validateUrl(undefined as any)).toBe(false)
    })
  })

  describe('Image URL Validation', () => {
    test('should validate image URLs with correct extensions', () => {
      expect(validateImageUrl('https://example.com/image.jpg')).toBe(true)
      expect(validateImageUrl('https://example.com/image.png')).toBe(true)
      expect(validateImageUrl('https://example.com/image.gif')).toBe(true)
      expect(validateImageUrl('https://example.com/image.webp')).toBe(true)
    })

    test('should reject non-image URLs', () => {
      expect(validateImageUrl('https://example.com/file.txt')).toBe(false)
      expect(validateImageUrl('https://example.com/script.js')).toBe(false)
      expect(validateImageUrl('https://example.com/page.html')).toBe(false)
    })

    test('should reject invalid URLs', () => {
      expect(validateImageUrl('not-a-url.jpg')).toBe(false)
      expect(validateImageUrl('javascript:alert(1).png')).toBe(false)
    })
  })

  describe('Secure ID Generation', () => {
    test('should generate secure IDs', () => {
      const id1 = generateSecureId()
      const id2 = generateSecureId()
      
      expect(id1).toBeTruthy()
      expect(id2).toBeTruthy()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
    })

    test('should generate IDs with optional prefix', () => {
      const id = generateSecureId('game')
      expect(id).toContain('game')
    })
  })

  describe('Password Validation', () => {
    test('should validate strong passwords', () => {
      const strongPassword = 'StrongP@ss123'
      const validation = validatePassword(strongPassword)
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('should detect weak passwords', () => {
      const weakPasswords = [
        'weak', // Too short
        'password', // No uppercase, numbers, or special chars
        'PASSWORD', // No lowercase, numbers, or special chars
        '12345678', // No letters
        'WeakPass', // No numbers or special chars
      ]
      
      weakPasswords.forEach(password => {
        const validation = validatePassword(password)
        expect(validation.isValid).toBe(false)
        expect(validation.errors.length).toBeGreaterThan(0)
      })
    })

    test('should provide specific error messages', () => {
      const shortPassword = 'Weak1'
      const validation = validatePassword(shortPassword)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(e => e.includes('8 characters'))).toBe(true)
    })
  })

  describe('Password Hashing', () => {
    test('should hash passwords securely', () => {
      const password = 'testPassword123'
      const hashed1 = hashPassword(password)
      const hashed2 = hashPassword(password)
      
      expect(hashed1).toBeTruthy()
      expect(hashed2).toBeTruthy()
      expect(hashed1).not.toBe(password)
      expect(hashed2).not.toBe(password)
      expect(hashed1).not.toBe(hashed2) // Should use salt
    })

    test('should produce consistent length hashes', () => {
      const password1 = 'short'
      const password2 = 'averyverylongpasswordwithmanycharacters'
      
      const hash1 = hashPassword(password1)
      const hash2 = hashPassword(password2)
      
      // Hashes should be consistent length (assuming SHA-256 + salt)
      expect(hash1.length).toBe(hash2.length)
    })
  })

  describe('Rate Limiting', () => {
    beforeEach(() => {
      // Clear rate limiter state
      rateLimiter.clear('test-key')
    })

    test('should allow requests within limit', () => {
      const key = 'test-key'
      const limit = 5
      const window = 60000 // 1 minute
      
      // First few requests should be allowed
      for (let i = 0; i < limit; i++) {
        const allowed = rateLimiter.isAllowed(key, limit, window)
        expect(allowed).toBe(true)
      }
    })

    test('should block requests exceeding limit', () => {
      const key = 'test-key'
      const limit = 3
      const window = 60000
      
      // Exhaust the limit
      for (let i = 0; i < limit; i++) {
        rateLimiter.isAllowed(key, limit, window)
      }
      
      // Next request should be blocked
      const blocked = rateLimiter.isAllowed(key, limit, window)
      expect(blocked).toBe(false)
    })

    test('should reset after time window', async () => {
      const key = 'test-key'
      const limit = 2
      const window = 100 // Very short window for testing
      
      // Exhaust the limit
      for (let i = 0; i < limit; i++) {
        rateLimiter.isAllowed(key, limit, window)
      }
      
      // Should be blocked
      expect(rateLimiter.isAllowed(key, limit, window)).toBe(false)
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, window + 10))
      
      // Should be allowed again
      expect(rateLimiter.isAllowed(key, limit, window)).toBe(true)
    })

    test('should handle multiple keys independently', () => {
      const limit = 2
      const window = 60000
      
      // Exhaust limit for key1
      for (let i = 0; i < limit; i++) {
        rateLimiter.isAllowed('key1', limit, window)
      }
      
      // key1 should be blocked, key2 should be allowed
      expect(rateLimiter.isAllowed('key1', limit, window)).toBe(false)
      expect(rateLimiter.isAllowed('key2', limit, window)).toBe(true)
    })

    test('should get remaining attempts', () => {
      const key = 'test-key'
      const limit = 5
      const window = 60000
      
      // Make some requests
      rateLimiter.isAllowed(key, limit, window)
      rateLimiter.isAllowed(key, limit, window)
      
      const remaining = rateLimiter.getRemainingAttempts(key, limit, window)
      expect(remaining).toBe(limit - 2)
    })

    test('should clear specific key', () => {
      const key = 'test-key'
      const limit = 1
      const window = 60000
      
      // Exhaust limit
      rateLimiter.isAllowed(key, limit, window)
      expect(rateLimiter.isAllowed(key, limit, window)).toBe(false)
      
      // Clear and try again
      rateLimiter.clear(key)
      expect(rateLimiter.isAllowed(key, limit, window)).toBe(true)
    })

    test('should clear all keys', () => {
      const limit = 1
      const window = 60000
      
      // Exhaust limits for multiple keys
      rateLimiter.isAllowed('key1', limit, window)
      rateLimiter.isAllowed('key2', limit, window)
      
      expect(rateLimiter.isAllowed('key1', limit, window)).toBe(false)
      expect(rateLimiter.isAllowed('key2', limit, window)).toBe(false)
      
      // Clear all
      rateLimiter.clearAll()
      
      expect(rateLimiter.isAllowed('key1', limit, window)).toBe(true)
      expect(rateLimiter.isAllowed('key2', limit, window)).toBe(true)
    })
  })

  describe('Security Edge Cases', () => {
    test('should handle extremely long inputs', () => {
      const veryLongInput = 'x'.repeat(100000)
      expect(() => sanitizeInput(veryLongInput)).not.toThrow()
    })

    test('should handle unicode characters', () => {
      const unicodeInput = '游戏名称 🎮 émojis & spéciał çhars'
      const sanitized = sanitizeInput(unicodeInput)
      expect(sanitized).toContain('游戏')
      expect(sanitized).toContain('🎮')
      expect(sanitized).toContain('émojis')
    })

    test('should handle nested HTML/script attempts', () => {
      const nestedScript = '<div><script>alert("xss")</script></div>'
      const sanitized = sanitizeInput(nestedScript)
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
    })

    test('should handle malformed URLs', () => {
      const malformedUrls = [
        'http://',
        'https://',
        'http://.',
        'http://..',
        'http://../',
        'http://?',
        'http://??/',
      ]
      
      malformedUrls.forEach(url => {
        expect(validateUrl(url)).toBe(false)
      })
    })
  })
})