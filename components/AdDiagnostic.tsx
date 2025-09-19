"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AdStatus {
  position: string
  name: string
  isActive: boolean
  htmlContent: string
  containerId?: string
  scriptSrc?: string
  loaded: boolean
  blocked: boolean
  error?: string
}

export default function AdDiagnostic() {
  const [adStatuses, setAdStatuses] = useState<AdStatus[]>([])
  const [isAdBlockerDetected, setIsAdBlockerDetected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAdStatuses()
    detectAdBlocker()
  }, [])

  const loadAdStatuses = async () => {
    try {
      const response = await fetch('/api/ads')
      if (response.ok) {
        const ads = await response.json()
        const statuses: AdStatus[] = ads.map((ad: any) => {
          const containerId = extractContainerId(ad.htmlContent)
          const scriptSrc = extractScriptSrc(ad.htmlContent)
          
          return {
            position: ad.position,
            name: ad.name,
            isActive: ad.isActive,
            htmlContent: ad.htmlContent,
            containerId,
            scriptSrc,
            loaded: false,
            blocked: false
          }
        })
        
        setAdStatuses(statuses)
        
        // Test each ad script
        testAdScripts(statuses)
      }
    } catch (error) {
      console.error('Failed to load ads:', error)
    } finally {
      setLoading(false)
    }
  }

  const extractContainerId = (html: string): string | undefined => {
    const match = html.match(/id="([^"]*container[^"]*)"/i)
    return match ? match[1] : undefined
  }

  const extractScriptSrc = (html: string): string | undefined => {
    const match = html.match(/src="([^"]+)"/i)
    return match ? match[1] : undefined
  }

  const testAdScripts = async (statuses: AdStatus[]) => {
    const updatedStatuses = [...statuses]
    
    for (let i = 0; i < updatedStatuses.length; i++) {
      const status = updatedStatuses[i]
      
      if (status.scriptSrc && status.isActive) {
        try {
          // Test if script URL is accessible
          const response = await fetch(status.scriptSrc, { 
            method: 'HEAD',
            mode: 'no-cors'
          })
          
          status.loaded = true
          status.blocked = false
        } catch (error) {
          status.loaded = false
          status.blocked = true
          status.error = 'Script blocked or inaccessible'
        }
      }
    }
    
    setAdStatuses(updatedStatuses)
  }

  const detectAdBlocker = () => {
    const testAd = document.createElement('div')
    testAd.innerHTML = '&nbsp;'
    testAd.className = 'adsbox ads ad-banner'
    testAd.style.cssText = 'position:absolute;left:-999px;top:-999px;width:1px;height:1px;'
    document.body.appendChild(testAd)
    
    setTimeout(() => {
      const blocked = testAd.offsetHeight === 0 || testAd.offsetWidth === 0
      setIsAdBlockerDetected(blocked)
      document.body.removeChild(testAd)
    }, 100)
  }

  const testAdPosition = (position: string) => {
    const container = document.querySelector(`.ad-slot-${position}`)
    if (container) {
      const rect = container.getBoundingClientRect()
      alert(`Ad position "${position}" found:\n- Width: ${rect.width}px\n- Height: ${rect.height}px\n- Visible: ${rect.width > 0 && rect.height > 0}`)
    } else {
      alert(`Ad position "${position}" not found in DOM`)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>广告诊断工具</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">加载中...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>广告诊断工具</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 广告拦截器检测 */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">广告拦截器检测</h3>
              {isAdBlockerDetected === null ? (
                <Badge variant="outline">检测中...</Badge>
              ) : isAdBlockerDetected ? (
                <div>
                  <Badge variant="destructive">❌ 检测到广告拦截器</Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    这可能是广告无法显示的主要原因。约70%的用户使用广告拦截器。
                  </p>
                </div>
              ) : (
                <Badge variant="default">✅ 未检测到广告拦截器</Badge>
              )}
            </div>

            {/* 广告状态列表 */}
            <div className="space-y-3">
              <h3 className="font-semibold">广告位状态</h3>
              {adStatuses.map((status) => (
                <div key={status.position} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <strong>{status.name}</strong>
                      <span className="text-sm text-gray-500 ml-2">({status.position})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {status.isActive ? (
                        <Badge variant="default">激活</Badge>
                      ) : (
                        <Badge variant="outline">未激活</Badge>
                      )}
                      <Button size="sm" onClick={() => testAdPosition(status.position)}>
                        测试
                      </Button>
                    </div>
                  </div>
                  
                  {status.isActive && (
                    <div className="text-sm space-y-1">
                      {status.containerId && (
                        <div>容器ID: <code>{status.containerId}</code></div>
                      )}
                      {status.scriptSrc && (
                        <div>
                          脚本: <code>{status.scriptSrc}</code>
                          {status.blocked && <Badge variant="destructive" className="ml-2">被拦截</Badge>}
                        </div>
                      )}
                      {status.error && (
                        <div className="text-red-600">错误: {status.error}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 解决建议 */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold mb-2">常见问题解决方案</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>1. 广告拦截器问题：</strong>
                  <p>• 提示用户将网站添加到广告拦截器白名单</p>
                  <p>• 使用更隐蔽的广告格式（原生广告）</p>
                  <p>• 考虑使用反广告拦截技术</p>
                </div>
                <div>
                  <strong>2. 容器ID冲突：</strong>
                  <p>• 确保每个广告位使用唯一的容器ID</p>
                  <p>• 检查是否有重复的ID在同一页面</p>
                </div>
                <div>
                  <strong>3. 脚本加载问题：</strong>
                  <p>• 检查广告脚本URL是否可访问</p>
                  <p>• 确保脚本在DOM准备好后执行</p>
                  <p>• 验证广告代码格式正确</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}