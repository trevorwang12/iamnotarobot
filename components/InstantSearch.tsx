"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Loader2 } from "lucide-react"
import { simpleSearch, GameData } from "@/lib/simple-search"

interface InstantSearchProps {
  className?: string
  placeholder?: string
  maxResults?: number
}

export default function InstantSearch({ 
  className = "", 
  placeholder = "Search games...",
  maxResults = 8
}: InstantSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<GameData[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // 实时搜索
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (searchTerm.trim().length >= 1) {
      setIsSearching(true)
      setIsOpen(true)
      
      debounceRef.current = setTimeout(async () => {
        try {
          console.log('Searching for:', searchTerm)
          const results = await simpleSearch.searchGames(searchTerm.trim(), maxResults)
          setSearchResults(results)
          setSelectedIndex(-1)
        } catch (error) {
          console.error('Search error:', error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      }, 300)
    } else {
      setSearchResults([])
      setIsOpen(false)
      setSelectedIndex(-1)
      setIsSearching(false)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchTerm, maxResults])

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" && searchTerm.trim()) {
        e.preventDefault()
        router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
        handleClearSearch()
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex(prev => prev < searchResults.length - 1 ? prev + 1 : prev)
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          router.push(`/game/${searchResults[selectedIndex].id}`)
          handleClearSearch()
        } else if (searchTerm.trim()) {
          router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
          handleClearSearch()
        }
        break
      case "Escape":
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleClearSearch = () => {
    setSearchTerm("")
    setSearchResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const handleGameClick = (gameId: string) => {
    router.push(`/game/${gameId}`)
    handleClearSearch()
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border border-gray-300 rounded-md pl-3 pr-8 py-1 text-sm w-48 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          ) : searchTerm ? (
            <button
              onClick={handleClearSearch}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          ) : (
            <Search className="w-4 h-4 text-gray-400 pointer-events-none" />
          )}
        </div>
      </div>

      {/* 搜索结果下拉框 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {searchResults.length > 0 ? (
            <>
              {searchResults.map((game, index) => (
                <div
                  key={game.id}
                  onClick={() => handleGameClick(game.id)}
                  className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                    selectedIndex === index ? "bg-blue-50 border-blue-200" : ""
                  }`}
                >
                  <img
                    src={game.thumbnailUrl}
                    alt={game.name}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {game.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="capitalize">{game.category}</span>
                      <span>•</span>
                      <span>⭐ {game.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* 查看所有结果 */}
              {searchResults.length >= maxResults && (
                <div
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
                    handleClearSearch()
                  }}
                  className="flex items-center justify-center gap-2 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-t border-gray-200 text-blue-600 font-medium text-sm"
                >
                  <Search className="w-4 h-4" />
                  View all results for "{searchTerm}"
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <div className="text-sm">No games found for "{searchTerm}"</div>
              <div className="text-xs text-gray-400 mt-1">Try a different search term</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}