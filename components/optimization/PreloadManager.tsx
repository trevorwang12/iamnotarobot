"use client"

import { useEffect } from "react"
import { cacheManager } from "@/lib/cache-manager"
import { dataManager } from "@/lib/data-manager"

export default function PreloadManager() {
  useEffect(() => {
    // Only preload on client-side to avoid SSR issues
    if (typeof window === 'undefined') return
    
    // Preload critical data on app start
    const preloadCriticalData = async () => {
      try {
        // Only preload if not in admin panel to avoid conflicts
        if (window.location.pathname === '/admin') {
          return
        }
        
        // Preload hot games (most likely to be viewed)
        await cacheManager.preload('hot-games-8', () => dataManager.getHotGames(8))
        
        // Preload new games 
        await cacheManager.preload('new-games-8', () => dataManager.getNewGames(8))
        
        // Preload categories
        await cacheManager.preload('categories', () => dataManager.getAllCategories())
        
        // Preload featured games
        await cacheManager.preload('featured-games-8', () => dataManager.getFeaturedGames(8))
        
        console.log('Critical data preloaded successfully')
      } catch (error) {
        console.warn('Preload failed:', error)
      }
    }

    // Start preloading after a short delay to avoid blocking initial render
    const timer = setTimeout(preloadCriticalData, 500)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Preload DNS for external resources
    const preloadDNS = () => {
      const domains = [
        'fonts.googleapis.com',
        'fonts.gstatic.com',
        // Add other external domains your site uses
      ]

      domains.forEach(domain => {
        const link = document.createElement('link')
        link.rel = 'dns-prefetch'
        link.href = `//${domain}`
        document.head.appendChild(link)
      })
    }

    preloadDNS()
  }, [])

  useEffect(() => {
    // Intelligent preloading based on user interactions
    const handleMouseEnter = async (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const link = target.closest('a[href]') as HTMLAnchorElement
      
      if (link && link.href) {
        const url = new URL(link.href)
        
        // Preload game pages
        if (url.pathname.startsWith('/game/')) {
          const gameId = url.pathname.split('/')[2]
          cacheManager.preload(`game-${gameId}`, () => dataManager.getGameById(gameId))
        }
        
        // Preload category pages
        if (url.pathname.startsWith('/category/')) {
          const categoryId = url.pathname.split('/')[2]
          cacheManager.preload(
            `games-category-${categoryId}-12`, 
            () => dataManager.getGamesByCategory(categoryId, 12)
          )
        }
      }
    }

    // Add hover preloading
    document.addEventListener('mouseenter', handleMouseEnter, true)
    
    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true)
    }
  }, [])

  // This component doesn't render anything
  return null
}