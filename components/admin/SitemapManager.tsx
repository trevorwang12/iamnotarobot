"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ExternalLink, RefreshCw, Settings, Globe, List } from 'lucide-react'

interface SitemapUrl {
  url: string
  lastModified?: string
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
  isActive?: boolean
}

interface SitemapSettings {
  baseUrl: string
  defaultChangeFreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  defaultPriority: number
  includeStaticPages: boolean
  includeGamePages: boolean
  includeCategoryPages: boolean
  customUrls: SitemapUrl[]
  excludeUrls: string[]
  autoGenerate: boolean
  generateSitemapIndex: boolean
  lastGenerated?: string
}

interface SitemapData {
  settings: SitemapSettings
  generatedUrls: SitemapUrl[]
  totalUrls: number
}

export default function SitemapManager() {
  const [data, setData] = useState<SitemapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showAllUrls, setShowAllUrls] = useState(false)
  const [loadingAllUrls, setLoadingAllUrls] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (includeAll = false) => {
    if (includeAll) {
      setLoadingAllUrls(true)
    } else {
      setLoading(true)
    }
    
    try {
      const url = includeAll ? '/api/admin/sitemap?includeAll=true' : '/api/admin/sitemap'
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
        if (includeAll) {
          setShowAllUrls(true)
        }
      } else {
        toast({
          title: "错误",
          description: result.error || "加载sitemap数据失败",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error loading sitemap data:', error)
      toast({
        title: "错误",
        description: "网络错误，请重试",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setLoadingAllUrls(false)
    }
  }

  const toggleShowAllUrls = () => {
    if (showAllUrls) {
      setShowAllUrls(false)
      loadData(false)
    } else {
      loadData(true)
    }
  }

  const generateSitemap = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/admin/sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
        
        // 检查是否为.cc域名，只有.cc域名才生成静态sitemap-0.xml
        const isCcDomain = data?.settings?.baseUrl?.includes('.cc')
        let message = `Sitemap生成成功！动态sitemap: ${result.totalUrls}个URL`
        
        if (isCcDomain) {
          const staticResponse = await fetch('/api/generate-sitemap-static')
          const staticResult = await staticResponse.json()
          
          if (staticResult.success) {
            message += `，静态sitemap-0.xml: ${staticResult.urls}个URL`
          }
        }
        
        toast({
          title: "成功", 
          description: message
        })
      } else {
        toast({
          title: "错误",
          description: result.error || "生成sitemap失败",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error generating sitemap:', error)
      toast({
        title: "错误",
        description: "网络错误，请重试",
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  const updateSettings = async (newSettings: Partial<SitemapSettings>) => {
    if (!data) return
    
    try {
      const response = await fetch('/api/admin/sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'updateSettings', 
          settings: { ...data.settings, ...newSettings }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
        toast({
          title: "成功",
          description: "设置已更新"
        })
      } else {
        toast({
          title: "错误", 
          description: result.error || "更新设置失败",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      toast({
        title: "错误",
        description: "网络错误，请重试",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Sitemap管理</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin mr-3" />
            <span>正在加载...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Sitemap管理</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>无法加载sitemap数据</p>
          <Button onClick={() => loadData()} className="mt-4">
            重试
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isCcDomain = data?.settings?.baseUrl?.includes('.cc')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>Sitemap管理</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                总URL数: <Badge variant="secondary">{data.totalUrls}</Badge>
              </div>
              <Button 
                onClick={generateSitemap} 
                disabled={generating}
                className="flex items-center space-x-2"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>{generating ? '生成中...' : '重新生成'}</span>
              </Button>
            </div>
          </div>
          {data.settings.lastGenerated && (
            <p className="text-sm text-gray-500">
              最后生成: {new Date(data.settings.lastGenerated).toLocaleString()}
            </p>
          )}
        </CardHeader>
      </Card>

      <Tabs defaultValue="settings">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>基础设置</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center space-x-2">
            <List className="w-4 h-4" />
            <span>预览</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>基础设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="baseUrl">网站基础URL</Label>
                  <Input
                    id="baseUrl"
                    value={data.settings.baseUrl}
                    onChange={(e) => updateSettings({ baseUrl: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="defaultPriority">默认优先级</Label>
                  <Input
                    id="defaultPriority"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={data.settings.defaultPriority}
                    onChange={(e) => updateSettings({ defaultPriority: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="changeFreq">默认更新频率</Label>
                <Select
                  value={data.settings.defaultChangeFreq}
                  onValueChange={(value: any) => updateSettings({ defaultChangeFreq: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always">始终</SelectItem>
                    <SelectItem value="hourly">每小时</SelectItem>
                    <SelectItem value="daily">每天</SelectItem>
                    <SelectItem value="weekly">每周</SelectItem>
                    <SelectItem value="monthly">每月</SelectItem>
                    <SelectItem value="yearly">每年</SelectItem>
                    <SelectItem value="never">从不</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">包含页面类型</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="staticPages">静态页面</Label>
                  <Switch
                    id="staticPages"
                    checked={data.settings.includeStaticPages}
                    onCheckedChange={(checked) => updateSettings({ includeStaticPages: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="gamePages">游戏页面</Label>
                  <Switch
                    id="gamePages"
                    checked={data.settings.includeGamePages}
                    onCheckedChange={(checked) => updateSettings({ includeGamePages: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="categoryPages">分类页面</Label>
                  <Switch
                    id="categoryPages"
                    checked={data.settings.includeCategoryPages}
                    onCheckedChange={(checked) => updateSettings({ includeCategoryPages: checked })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">搜索引擎设置</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sitemapIndex">生成Sitemap索引</Label>
                    <p className="text-sm text-gray-500">
                      为.cc域名生成sitemapindex.xml指向sitemap.xml
                      <br />Google提交sitemapindex.xml，Bing提交sitemap.xml
                    </p>
                  </div>
                  <Switch
                    id="sitemapIndex"
                    checked={data.settings.generateSitemapIndex}
                    onCheckedChange={(checked) => updateSettings({ generateSitemapIndex: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Sitemap提交地址</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data?.settings.generateSitemapIndex && isCcDomain ? (
                    <>
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-600">Google Search Console</h4>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-gray-700 mb-2">提交地址（.cc域名专用）:</p>
                          <a 
                            href={`${data.settings.baseUrl}/sitemapindex.xml`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center space-x-1 font-mono text-sm"
                          >
                            <span>{data.settings.baseUrl}/sitemapindex.xml</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <p className="text-xs text-gray-500 mt-2">此文件指向 sitemap-0.xml，包含所有页面</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-600">Bing Webmaster Tools</h4>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-gray-700 mb-2">提交地址:</p>
                          <a 
                            href={`${data.settings.baseUrl}/sitemap.xml`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center space-x-1 font-mono text-sm"
                          >
                            <span>{data.settings.baseUrl}/sitemap.xml</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-full">
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-800">所有搜索引擎</h4>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-sm text-gray-700 mb-2">统一提交地址:</p>
                          <a 
                            href={`${data.settings.baseUrl}/sitemap.xml`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center space-x-1 font-mono text-sm"
                          >
                            <span>{data.settings.baseUrl}/sitemap.xml</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>提示：</strong>
                    {isCcDomain && data?.settings.generateSitemapIndex
                      ? '已启用.cc域名优化：sitemapindex.xml指向sitemap-0.xml，双sitemap策略提升搜索引擎收录'
                      : isCcDomain && !data?.settings.generateSitemapIndex
                      ? '检测到.cc域名，建议启用"生成Sitemap索引"选项以优化Google搜索收录'
                      : data?.settings.generateSitemapIndex
                      ? '已启用sitemap索引，使用标准sitemap.xml即可'
                      : '使用标准sitemap.xml，适用于大多数域名'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>URL内容预览</CardTitle>
                    <p className="text-sm text-gray-500">
                      {showAllUrls ? '显示所有URL' : '显示前10个URL'}
                    </p>
                  </div>
                  {data && data.totalUrls > 10 && (
                    <Button
                      variant="outline"
                      onClick={toggleShowAllUrls}
                      disabled={loadingAllUrls}
                      className="flex items-center space-x-2"
                    >
                      {loadingAllUrls ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : showAllUrls ? (
                        <span>显示前10个</span>
                      ) : (
                        <span>显示全部 ({data.totalUrls})</span>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {data.generatedUrls.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">暂无生成的sitemap</p>
                    <Button onClick={generateSitemap} className="mt-4">
                      立即生成
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {data.generatedUrls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <a 
                            href={url.url}
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline flex items-center space-x-1 truncate"
                          >
                            <span className="truncate">{url.url}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span>优先级: {url.priority || 0.5}</span>
                            <span>频率: {url.changeFrequency || 'weekly'}</span>
                            {url.lastModified && (
                              <span>更新: {url.lastModified}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {!showAllUrls && data.totalUrls > 10 && (
                      <div className="text-center pt-4">
                        <p className="text-sm text-gray-500 mb-2">
                          还有 {data.totalUrls - 10} 个URL未显示
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={toggleShowAllUrls}
                          disabled={loadingAllUrls}
                        >
                          {loadingAllUrls ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              加载中...
                            </>
                          ) : (
                            '查看全部'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}