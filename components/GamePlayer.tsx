"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Maximize, 
  Minimize, 
  RotateCcw, 
  Loader2, 
  AlertCircle, 
  Play,
  Pause,
  Volume2,
  VolumeX,
  Share2,
  Facebook,
  Twitter,
  MessageCircle,
  Copy
} from "lucide-react"

interface GamePlayerProps {
  gameUrl: string
  gameName: string
  gameId: string
  allowFullscreen?: boolean
  showControls?: boolean
}

export default function GamePlayer({ 
  gameUrl, 
  gameName, 
  gameId, 
  allowFullscreen = true,
  showControls = true 
}: GamePlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement
      setIsFullscreen(isNowFullscreen)
      
      // Close share menu when entering fullscreen
      if (isNowFullscreen) {
        setShowShareMenu(false)
      }
      
      // Force iframe refresh when exiting fullscreen to fix white screen
      if (!isNowFullscreen && iframeRef.current) {
        setTimeout(() => {
          if (iframeRef.current) {
            const currentSrc = iframeRef.current.src
            iframeRef.current.src = 'about:blank'
            setTimeout(() => {
              if (iframeRef.current) {
                iframeRef.current.src = currentSrc
              }
            }, 50)
          }
        }, 100)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  const handleIframeLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current || !allowFullscreen) return

    try {
      if (document.fullscreenElement || 
          (document as any).webkitFullscreenElement || 
          (document as any).mozFullScreenElement || 
          (document as any).msFullscreenElement) {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen()
        }
      } else {
        // Enter fullscreen
        const element = containerRef.current
        if (element.requestFullscreen) {
          await element.requestFullscreen()
        } else if ((element as any).webkitRequestFullscreen) {
          (element as any).webkitRequestFullscreen()
        } else if ((element as any).mozRequestFullScreen) {
          (element as any).mozRequestFullScreen()
        } else if ((element as any).msRequestFullscreen) {
          (element as any).msRequestFullscreen()
        }
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error)
    }
  }

  const refreshGame = () => {
    if (iframeRef.current) {
      setIsLoading(true)
      setHasError(false)
      iframeRef.current.src = gameUrl + '?refresh=' + Date.now()
    }
  }

  const togglePause = () => {
    // This is a placeholder - actual pause functionality would depend on the game
    setIsPaused(!isPaused)
    if (iframeRef.current) {
      try {
        // Send message to iframe game (if it supports it)
        iframeRef.current.contentWindow?.postMessage(
          { action: isPaused ? 'resume' : 'pause' }, 
          '*'
        )
      } catch (error) {
        console.log('Game does not support pause/resume')
      }
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.postMessage(
          { action: 'mute', muted: !isMuted }, 
          '*'
        )
      } catch (error) {
        console.log('Game does not support mute/unmute')
      }
    }
  }

  const shareToFacebook = () => {
    if (typeof window === 'undefined') return
    const url = encodeURIComponent(window.location.href)
    const title = encodeURIComponent(`Check out this amazing game: ${gameName}!`)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title}`, '_blank', 'width=600,height=400')
  }

  const shareToTwitter = () => {
    if (typeof window === 'undefined') return
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(`Playing ${gameName} - such an awesome game! 🎮`)
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400')
  }

  const shareToWhatsApp = () => {
    if (typeof window === 'undefined') return
    const url = window.location.href
    const text = encodeURIComponent(`Hey! Check out this cool game: ${gameName}! ${url}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const copyToClipboard = async () => {
    try {
      if (typeof window === 'undefined') return
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
        alert('Game link copied to clipboard! 📋')
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = window.location.href
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        alert('Game link copied to clipboard! 📋')
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      alert('Failed to copy link. Please copy manually: ' + window.location.href)
    }
  }

  const shareNative = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: gameName,
          text: `Check out this amazing game: ${gameName}!`,
          url: window.location.href
        })
      } else {
        copyToClipboard()
      }
    } catch (error) {
      console.error('Native sharing failed:', error)
      copyToClipboard()
    }
  }

  if (hasError) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Failed to Load Game</h3>
            <p className="text-gray-600 mb-4">
              The game "{gameName}" could not be loaded. Please check your internet connection or try again later.
            </p>
            <Button onClick={refreshGame} className="mr-2">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`game-player relative w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}
    >
      <Card className={`card w-full overflow-hidden ${isFullscreen ? 'border-0 rounded-none h-full' : 'border-0 rounded-lg shadow-none h-auto'}`}>

        {/* Game Container */}
        <CardContent className={`game-content p-0 relative ${isFullscreen ? 'rounded-none h-full' : 'rounded-lg overflow-hidden h-auto'}`}>
          {/* Loading Overlay - Hidden in fullscreen */}
          {isLoading && !isFullscreen && (
            <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Loading Game...</h3>
                <p className="text-gray-600">Please wait while {gameName} loads</p>
              </div>
            </div>
          )}

          {/* Pause Overlay - Hidden in fullscreen */}
          {isPaused && !isFullscreen && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <div className="bg-white rounded-lg p-6 text-center">
                <Pause className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Game Paused</h3>
                <Button onClick={togglePause}>
                  <Play className="w-4 h-4 mr-2" />
                  Resume Game
                </Button>
              </div>
            </div>
          )}

          {/* Game iframe */}
          <iframe
            ref={iframeRef}
            src={gameUrl}
            title={gameName}
            className={`w-full h-full border-0 block ${
              isFullscreen ? '' : 'h-[600px]'
            }`}
            style={{
              margin: 0,
              padding: 0,
              borderRadius: isFullscreen ? '0' : '8px'
            }}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allow="fullscreen; autoplay; encrypted-media; gyroscope; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
            loading="lazy"
          />
        </CardContent>
        
        {/* Game Controls - Bottom Bar (Hidden in fullscreen) */}
        {showControls && !isFullscreen && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-3">
            <div className="flex items-center justify-between">
              {/* Left side - Game info and basic controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🎮</span>
                  </div>
                  <span className="text-white font-medium text-sm">{gameName}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePause}
                    className="text-white hover:bg-slate-600 h-7 w-7 p-0"
                    title={isPaused ? "Resume Game" : "Pause Game"}
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-slate-600 h-7 w-7 p-0"
                    title={isMuted ? "Unmute Game" : "Mute Game"}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              
              {/* Right side - Advanced controls */}
              <div className="flex items-center gap-2">
                {/* Share Button with Custom Dropdown */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-slate-600 h-7 px-2"
                    title="Share Game"
                    onClick={() => setShowShareMenu(!showShareMenu)}
                  >
                    <Share2 className="w-3.5 h-3.5 mr-1" />
                    <span className="text-xs">Share</span>
                  </Button>
                  
                  {showShareMenu && (
                    <>
                      {/* Backdrop to close menu */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowShareMenu(false)}
                      ></div>
                      
                      {/* Share Menu */}
                      <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                        <button
                          onClick={() => { shareToFacebook(); setShowShareMenu(false) }}
                          className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">f</span>
                          </div>
                          <span className="text-xs text-gray-700">Share on Facebook</span>
                        </button>
                        
                        <button
                          onClick={() => { shareToTwitter(); setShowShareMenu(false) }}
                          className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Twitter className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-gray-700">Share on Twitter</span>
                        </button>
                        
                        <button
                          onClick={() => { shareToWhatsApp(); setShowShareMenu(false) }}
                          className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <MessageCircle className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-gray-700">Share on WhatsApp</span>
                        </button>
                        
                        <button
                          onClick={() => { copyToClipboard(); setShowShareMenu(false) }}
                          className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4 text-gray-500" />
                          <span className="text-xs text-gray-700">Copy Link</span>
                        </button>
                        
                        {typeof navigator !== 'undefined' && navigator.share && (
                          <button
                            onClick={() => { shareNative(); setShowShareMenu(false) }}
                            className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Share2 className="w-4 h-4 text-gray-500" />
                            <span className="text-xs text-gray-700">More Options</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="w-px h-6 bg-slate-600 mx-1"></div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshGame}
                  className="text-white hover:bg-slate-600 h-7 w-7 p-0"
                  title="Refresh Game"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
                
                {allowFullscreen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-slate-600 h-7 px-2 bg-slate-600/50"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  >
                    <Maximize className="w-3.5 h-3.5 mr-1" />
                    <span className="text-xs">Fullscreen</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Minimal fullscreen controls - only exit fullscreen */}
      {isFullscreen && (
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="bg-black/50 text-white hover:bg-black/70 backdrop-blur"
            title="Exit Fullscreen"
          >
            <Minimize className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}