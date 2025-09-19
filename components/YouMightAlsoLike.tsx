"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { recommendedGamesManager } from '@/lib/recommended-games-manager'
import { GameData } from '@/lib/data-manager'
import AdSlot from '@/components/SafeAdSlot'

export default function YouMightAlsoLike() {
  const [recommendedGames, setRecommendedGames] = useState<GameData[]>([])

  useEffect(() => {
    const loadRecommendedGames = async () => {
      // 获取混合推荐游戏（手动设置 + 随机补充）
      const games = await recommendedGamesManager.getMixedRecommendedGames(8)
      setRecommendedGames(games)
    }

    loadRecommendedGames()

    // 只在客户端添加事件监听器
    if (typeof window !== 'undefined') {
      const handleRecommendedGamesUpdate = () => {
        loadRecommendedGames()
      }

      // 监听localStorage变化和自定义事件
      window.addEventListener('storage', handleRecommendedGamesUpdate)
      window.addEventListener('recommendedGamesUpdated', handleRecommendedGamesUpdate)

      return () => {
        window.removeEventListener('storage', handleRecommendedGamesUpdate)
        window.removeEventListener('recommendedGamesUpdated', handleRecommendedGamesUpdate)
      }
    }
  }, [])

  if (recommendedGames.length === 0) {
    return null
  }

  return (
    <section className="bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Ad Slot - Recommendations Top Position */}
        <AdSlot position="recommendations-top" className="mb-8" />
        
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
          You might also like
        </h2>
        
        {/* Games Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {recommendedGames.map((game, index) => (
            <Link 
              key={game.id} 
              href={`/game/${game.id}`}
              className="group block"
            >
              <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-105">
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={game.thumbnailUrl || "/placeholder.svg"}
                    alt={game.name}
                    className="w-full h-full object-cover object-center"
                    style={{ aspectRatio: '1/1' }}
                  />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="bg-white rounded-full p-2">
                        <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 5v10l8-5-8-5z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  <h3 className="text-xs font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                    {game.name}
                  </h3>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                      <span className="text-xs text-gray-600 ml-1">{game.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}