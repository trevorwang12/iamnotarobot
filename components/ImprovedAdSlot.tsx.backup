"use client"

import { useEffect, useState, useRef } from 'react'

interface AdSlotProps {
  position: 'header' | 'footer' | 'sidebar' | 'hero-bottom' | 'content-top' | 'game-details-bottom' | 'content-bottom' | 'recommendations-top' | 'adsense-auto' | 'adsense-display' | 'adsense-in-article' | 'adsense-in-feed' | 'adsense-verification'
  className?: string
}

export default function ImprovedAdSlot({ position, className = '' }: AdSlotProps) {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const hasLoaded = useRef(false)
  
  useEffect(() => {
    if (hasLoaded.current) return
    hasLoaded.current = true
    
    loadAndRenderAd()
  }, [position])
  
  const loadAndRenderAd = async () => {
    try {
      const response = await fetch('/api/ads')
      if (!response.ok) return
      
      const data = await response.json()
      const ad = data.find((ad: any) => ad.position === position && ad.isActive !== false)
      if (!ad) return
      
      const uniqueId = `${ad.id}-${position}-${Date.now()}`
      const content = ad.htmlContent
        .replace(/container-[a-f0-9-]+/g, `container-${uniqueId}`)
        .replace(/id="[^"]*container[^"]*"/g, `id="container-${uniqueId}"`)
      
      setHtmlContent(content)
      
      setTimeout(() => executeScripts(content), 100)
    } catch (error) {
      console.error(`AdSlot-${position}:`, error)
    }
  }
  
  const executeScripts = (html: string) => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    const scripts = tempDiv.querySelectorAll('script')
    
    scripts.forEach(script => {
      const newScript = document.createElement('script')
      
      for (let i = 0; i < script.attributes.length; i++) {
        const attr = script.attributes[i]
        newScript.setAttribute(attr.name, attr.value)
      }
      
      if (script.src) {
        newScript.src = script.src
        document.head.appendChild(newScript)
      } else {
        newScript.textContent = script.textContent
        document.head.appendChild(newScript)
      }
    })
  }
  
  if (!htmlContent) return null
  
  return (
    <div className={`ad-slot ad-slot-${position} ${className}`}>
      <div 
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        suppressHydrationWarning={true}
      />
    </div>
  )
}