"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Link as LinkIcon, Check, X, AlertCircle, Loader2 } from "lucide-react"

interface PageInfo {
  path: string
  title: string
  hasCanonical: boolean
  canonicalUrl?: string
}

export default function CanonicalChecker() {
  const [pageStatuses, setPageStatuses] = useState<PageInfo[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [alert, setAlert] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null)

  // 定义所有需要检查的页面
  const pagesToCheck: Omit<PageInfo, 'hasCanonical' | 'canonicalUrl'>[] = [
    { path: '/', title: 'Homepage' },
    { path: '/about', title: 'About Us' },
    { path: '/search', title: 'Search' },
    { path: '/privacy', title: 'Privacy Policy' },
    { path: '/terms', title: 'Terms of Service' },
    { path: '/contact', title: 'Contact Us' },
    { path: '/hot-games', title: 'Hot Games' },
    { path: '/new-games', title: 'New Games' },
  ]

  const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
    setAlert({type, message})
    setTimeout(() => setAlert(null), 5000)
  }

  // 检查页面的canonical状态
  const checkCanonicalURLs = async () => {
    setIsChecking(true)
    const results: PageInfo[] = []
    
    try {
      for (const page of pagesToCheck) {
        try {
          // 模拟检查页面源码中是否包含canonical
          const response = await fetch(page.path, { 
            method: 'GET',
            headers: { 'Accept': 'text/html' }
          })
          
          if (response.ok) {
            const html = await response.text()
            const hasCanonical = html.includes('rel="canonical"')
            
            let canonicalUrl = ''
            if (hasCanonical) {
              const canonicalMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"[^>]*>/i)
              canonicalUrl = canonicalMatch ? canonicalMatch[1] : ''
            }
            
            results.push({
              ...page,
              hasCanonical,
              canonicalUrl
            })
          } else {
            results.push({
              ...page,
              hasCanonical: false
            })
          }
        } catch (error) {
          console.error(`Error checking ${page.path}:`, error)
          results.push({
            ...page,
            hasCanonical: false
          })
        }
      }
      
      setPageStatuses(results)
      showAlert('success', `检查完成！共检查 ${results.length} 个页面`)
    } catch (error) {
      console.error('Canonical check error:', error)
      showAlert('error', '检查过程中发生错误')
    } finally {
      setIsChecking(false)
    }
  }

  // 为缺少canonical的页面生成canonical URL
  const generateMissingCanonicals = async () => {
    setIsGenerating(true)
    
    try {
      const missingPages = pageStatuses.filter(page => !page.hasCanonical)
      
      if (missingPages.length === 0) {
        showAlert('info', '所有页面都已经有canonical URL了！')
        return
      }

      // 获取基础URL
      const baseUrl = window.location.origin
      
      // 为每个缺少canonical的页面生成代码片段
      const codeSnippets = missingPages.map(page => ({
        page: page.title,
        path: page.path,
        code: `<DynamicSEO 
  title="${page.title} - GAMES"
  description="${getDefaultDescription(page.path)}"
  canonical="${baseUrl}${page.path}"
/>`
      }))
      
      // 显示生成的代码
      const snippetText = codeSnippets.map(item => 
        `// ${item.page} (${item.path})\n${item.code}\n`
      ).join('\n')
      
      // 复制到剪贴板
      await navigator.clipboard.writeText(snippetText)
      
      showAlert('success', `已为 ${missingPages.length} 个页面生成canonical代码片段并复制到剪贴板！`)
      
    } catch (error) {
      console.error('Generate canonicals error:', error)
      showAlert('error', '生成canonical时发生错误')
    } finally {
      setIsGenerating(false)
    }
  }

  // 获取默认描述
  const getDefaultDescription = (path: string): string => {
    const descriptions: Record<string, string> = {
      '/': 'Play the best free online games. No download required!',
      '/about': 'Learn about our mission to provide the best free online gaming experience.',
      '/search': 'Search for your favorite free online games.',
      '/privacy': 'Read our privacy policy to understand how we protect your data.',
      '/terms': 'Read our terms of service and user agreement.',
      '/contact': 'Get in touch with us. Contact our support team for assistance.',
      '/hot-games': 'Play the hottest and most popular free online games.',
      '/new-games': 'Discover the latest free online games added to our collection.'
    }
    return descriptions[path] || 'Free online games platform'
  }

  const missingCount = pageStatuses.filter(page => !page.hasCanonical).length
  const totalCount = pageStatuses.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5" />
          Canonical URL 检查器
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alert && (
          <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={checkCanonicalURLs}
            disabled={isChecking}
            className="flex items-center gap-2"
          >
            {isChecking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LinkIcon className="w-4 h-4" />
            )}
            检查所有页面
          </Button>
          
          {pageStatuses.length > 0 && missingCount > 0 && (
            <Button 
              onClick={generateMissingCanonicals}
              disabled={isGenerating}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              一键生成代码
            </Button>
          )}
        </div>

        {pageStatuses.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">检查结果</h3>
              <div className="flex gap-2">
                <Badge variant="default" className="bg-green-500">
                  ✓ {totalCount - missingCount} 已有
                </Badge>
                {missingCount > 0 && (
                  <Badge variant="destructive">
                    ✗ {missingCount} 缺失
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              {pageStatuses.map((page, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {page.hasCanonical ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">{page.title}</div>
                      <div className="text-sm text-gray-500">{page.path}</div>
                      {page.canonicalUrl && (
                        <div className="text-xs text-blue-600 mt-1 max-w-md truncate">
                          {page.canonicalUrl}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={page.hasCanonical ? "default" : "destructive"}>
                    {page.hasCanonical ? "有 Canonical" : "缺失"}
                  </Badge>
                </div>
              ))}
            </div>

            {missingCount > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  发现 {missingCount} 个页面缺少 canonical URL。点击"一键生成代码"可以生成相应的 DynamicSEO 组件代码。
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}