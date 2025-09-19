"use client"

import { useEffect, useRef } from 'react'

interface HtmlContentProps {
  html: string
  className?: string
}

export function HtmlContent({ html, className }: HtmlContentProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Reset content before injecting new HTML to avoid script duplication
    container.innerHTML = html

    const scriptElements = Array.from(container.querySelectorAll('script'))
    scriptElements.forEach((oldScript) => {
      const newScript = document.createElement('script')
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value)
      })

      if (oldScript.src) {
        newScript.src = oldScript.src
      } else {
        let scriptContent = oldScript.innerHTML
        // Allow repeated execution by avoiding block-scoped redeclarations
        scriptContent = scriptContent
          .replace(/\bconst\b/g, 'var')
          .replace(/\blet\b/g, 'var')

        newScript.textContent = scriptContent
      }

      oldScript.replaceWith(newScript)
    })

    return () => {
      container.innerHTML = ''
    }
  }, [html])

  return <div ref={containerRef} className={className} suppressHydrationWarning />
}

export default HtmlContent
