// Security utilities for the application
'use client'

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (!input || input === null || input === undefined) return ''
  
  return input
    .replace(/[<>]/g, '') // Remove basic XSS vectors
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/DROP\s+TABLE/gi, '') // Remove SQL injection attempts
    .replace(/--/g, '') // Remove SQL comments
    .replace(/script/gi, '') // Remove script tags
    .replace(/alert/gi, '') // Remove alert calls
    .trim()
}

// HTML escaping
export const escapeHtml = (text: string): string => {
  if (!text) return ''
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// URL validation
export const validateUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false
  
  try {
    const parsedUrl = new URL(url)
    // Check for valid protocol and hostname
    const hasValidProtocol = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
    const hasValidHostname = parsedUrl.hostname && parsedUrl.hostname !== '.' && parsedUrl.hostname !== '..' && !parsedUrl.hostname.startsWith('.')
    return hasValidProtocol && hasValidHostname
  } catch {
    return false
  }
}

// Image URL validation
export const validateImageUrl = (url: string): boolean => {
  if (!validateUrl(url)) return false
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  const lowerUrl = url.toLowerCase()
  return imageExtensions.some(ext => lowerUrl.includes(ext))
}

// Generate secure ID with optional prefix
export const generateSecureId = (input?: string): string => {
  if (input && typeof input === 'string') {
    // Generate ID from name for categories
    return input
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50) // Limit length
  }
  
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? 
    crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  
  return uuid
}

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Password hashing (simple implementation for demo)
export const hashPassword = (password: string): string => {
  // In a real application, use bcrypt or similar
  let hash = 0
  const salt = Math.random().toString(36).substring(2, 15) // Fixed length salt
  const combined = password + salt
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  // Ensure consistent length by padding
  const hashStr = Math.abs(hash).toString(16).padStart(8, '0')
  return hashStr + salt // This ensures consistent total length
}

// URL validation for iframe sources
export const isValidGameUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url)
    
    // Only allow HTTPS URLs
    if (parsedUrl.protocol !== 'https:') {
      return false
    }
    
    // Allowed domains for iframe games (add more as needed)
    const allowedDomains = [
      'crazygames.com',
      'poki.com',
      'games.com',
      'kongregate.com',
      'newgrounds.com',
      'itch.io'
    ]
    
    // Check if domain is in allowed list
    const isAllowedDomain = allowedDomains.some(domain => 
      parsedUrl.hostname.endsWith(domain)
    )
    
    return isAllowedDomain
  } catch {
    return false
  }
}

// Content Security Policy headers (for Next.js middleware)
export const getSecurityHeaders = () => ({
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pl27550504.revenuecpmgate.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "frame-src https://crazygames.com https://poki.com https://games.com https://kongregate.com https://newgrounds.com https://itch.io",
    "connect-src 'self'",
    "media-src 'self'"
  ].join('; '),
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
})

// Rate limiting (simple implementation)
class RateLimiter {
  private attempts: Map<string, { count: number; timestamp: number }> = new Map()
  
  isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now()
    const record = this.attempts.get(key)
    
    if (!record || (now - record.timestamp) > windowMs) {
      this.attempts.set(key, { count: 1, timestamp: now })
      return true
    }
    
    if (record.count >= maxAttempts) {
      return false
    }
    
    record.count++
    return true
  }
  
  getRemainingAttempts(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): number {
    const now = Date.now()
    const record = this.attempts.get(key)
    
    if (!record || (now - record.timestamp) > windowMs) {
      return maxAttempts
    }
    
    return Math.max(0, maxAttempts - record.count)
  }
  
  clear(key: string): void {
    this.attempts.delete(key)
  }
  
  clearAll(): void {
    this.attempts.clear()
  }
  
  reset(key: string): void {
    this.attempts.delete(key)
  }
}

export const rateLimiter = new RateLimiter()

// Data validation schemas
export const gameDataSchema = {
  name: (value: string) => value.length > 0 && value.length <= 100,
  description: (value: string) => value.length > 0,
  gameUrl: (value: string) => isValidGameUrl(value),
  category: (value: string) => /^[a-z-]+$/.test(value),
  rating: (value: number) => value >= 1 && value <= 5,
  developer: (value: string) => value.length > 0 && value.length <= 50
}

// Validate game data
export const validateGameData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!data.name || data.name === '' || data.name.length < 2 || data.name.length > 100) {
    errors.push('Game name must be 2-100 characters')
  }
  
  if (!data.description || data.description === '' || data.description.length < 10) {
    errors.push('Game description must be at least 10 characters')
  }
  
  if (data.gradientDescription && data.gradientDescription.length > 150) {
    errors.push('Gradient description must be less than 150 characters')
  }
  
  if (!data.gameUrl || !validateUrl(data.gameUrl)) {
    errors.push('Invalid or unsafe game URL')
  }
  
  if (!data.category || !/^[a-z-]+$/.test(data.category)) {
    errors.push('Invalid category format')
  }
  
  if (data.rating === undefined || data.rating < 0 || data.rating > 5) {
    errors.push('Rating must be between 0 and 5')
  }
  
  if (data.developer && data.developer.length > 50) {
    errors.push('Developer name must be less than 50 characters')
  }
  
  if (!data.tags || !Array.isArray(data.tags) || data.tags.length === 0 || data.tags.length > 10) {
    errors.push('Tags must be an array with 1-10 items')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validate category data
export const validateCategoryData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!data.name || typeof data.name !== 'string' || data.name.length < 2 || data.name.length > 50) {
    errors.push('Category name must be 2-50 characters')
  }
  
  if (!data.description || typeof data.description !== 'string' || data.description.length < 5 || data.description.length > 200) {
    errors.push('Category description must be 5-200 characters')
  }
  
  if (!data.icon || typeof data.icon !== 'string' || data.icon.length > 10) {
    errors.push('Category icon must be provided and less than 10 characters')
  }
  
  if (!data.color || typeof data.color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
    errors.push('Category color must be a valid hex color code')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

