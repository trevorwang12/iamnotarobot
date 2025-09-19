interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })

    // Auto cleanup after TTL expires
    setTimeout(() => {
      this.delete(key)
    }, ttl)
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  // Cache with stale-while-revalidate pattern
  async getOrFetch<T>(
    key: string, 
    fetchFn: () => Promise<T> | T, 
    ttl: number = this.DEFAULT_TTL,
    staleTime: number = ttl * 2
  ): Promise<T> {
    const entry = this.cache.get(key)
    
    // If we have fresh data, return it
    if (entry && Date.now() - entry.timestamp <= ttl) {
      return entry.data
    }

    // If we have stale data, return it but fetch fresh data in background
    if (entry && Date.now() - entry.timestamp <= staleTime) {
      // Return stale data immediately
      const staleData = entry.data
      
      // Fetch fresh data in background
      Promise.resolve(fetchFn()).then(freshData => {
        this.set(key, freshData, ttl)
      }).catch(error => {
        console.warn('Background fetch failed:', error)
      })
      
      return staleData
    }

    // No data or too stale, fetch fresh data
    try {
      const freshData = await Promise.resolve(fetchFn())
      this.set(key, freshData, ttl)
      return freshData
    } catch (error) {
      // If fetch fails and we have stale data, return it
      if (entry) {
        return entry.data
      }
      throw error
    }
  }

  // Preload data for better performance
  async preload<T>(key: string, fetchFn: () => Promise<T> | T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    if (!this.has(key)) {
      try {
        const data = await Promise.resolve(fetchFn())
        this.set(key, data, ttl)
      } catch (error) {
        console.warn('Preload failed:', error)
      }
    }
  }

  // Get cache statistics
  getStats() {
    let totalEntries = 0
    let expiredEntries = 0
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      totalEntries++
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++
      }
    }

    return {
      totalEntries,
      expiredEntries,
      activeEntries: totalEntries - expiredEntries
    }
  }

  // Clean up expired entries
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }

    return cleaned
  }
}

export const cacheManager = new CacheManager()

// Auto cleanup every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheManager.cleanup()
  }, 10 * 60 * 1000)
}