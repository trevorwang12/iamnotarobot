"use client"

import { useEffect } from 'react'

export default function HydrationFix() {
  useEffect(() => {
    // 清理可能由浏览器扩展注入的元素
    const cleanupExtensionElements = () => {
      // 删除已知会引起水合问题的扩展元素
      const extensionSelectors = [
        'input[name="market-mate-for-1688"]',
        'input[id^="a31qww91sv"]',
        'input[data-version]',
        'input[data-package="chrome-store"]',
        'input[type="hidden"][value="installed"]'
      ]

      extensionSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        elements.forEach(element => {
          try {
            element.remove()
          } catch (error) {
            console.debug('Could not remove extension element:', error)
          }
        })
      })
    }

    // 立即执行一次
    cleanupExtensionElements()

    // 监听DOM变化，防止扩展重新注入
    const observer = new MutationObserver(() => {
      cleanupExtensionElements()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}