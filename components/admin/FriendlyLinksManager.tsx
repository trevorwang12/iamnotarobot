'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  Settings,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Save,
  Link as LinkIcon
} from 'lucide-react'
import { friendlyLinksManager, type FriendlyLink, type FriendlyLinksSettings } from '@/lib/friendly-links-manager'

const FriendlyLinksManager: React.FC = () => {
  const [links, setLinks] = useState<FriendlyLink[]>([])
  const [settings, setSettings] = useState<FriendlyLinksSettings>({
    isVisible: true,
    title: 'Friendly Links',
    subtitle: 'Check out our partner gaming sites',
    maxLinksToShow: 10,
    openInNewTab: true,
    showLogo: true,
    showDescription: true
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<FriendlyLink | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    logo: '',
    priority: 1
  })

  // 设置表单数据
  const [settingsFormData, setSettingsFormData] = useState<FriendlyLinksSettings>(settings)

  // 加载数据
  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await friendlyLinksManager.getData()
      setLinks(data.links.sort((a, b) => a.priority - b.priority))
      setSettings(data.settings)
      setSettingsFormData(data.settings)
    } catch (error) {
      console.error('Failed to load friendly links:', error)
      showMessage('error', 'Failed to load friendly links')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 显示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      description: '',
      logo: '',
      priority: Math.max(...links.map(l => l.priority), 0) + 1
    })
    setEditingLink(null)
  }

  // 打开添加对话框
  const openAddDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  // 打开编辑对话框
  const openEditDialog = (link: FriendlyLink) => {
    setFormData({
      name: link.name,
      url: link.url,
      description: link.description,
      logo: link.logo,
      priority: link.priority
    })
    setEditingLink(link)
    setIsDialogOpen(true)
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证数据
    const validation = friendlyLinksManager.validateLinkData(formData)
    if (!validation.valid) {
      showMessage('error', validation.errors.join(', '))
      return
    }

    try {
      let result
      if (editingLink) {
        result = await friendlyLinksManager.updateLink(editingLink.id, formData)
      } else {
        result = await friendlyLinksManager.addLink({
          ...formData,
          isActive: true
        })
      }

      if (result.success) {
        showMessage('success', result.message || 'Operation completed successfully')
        setIsDialogOpen(false)
        await loadData()
      } else {
        showMessage('error', result.error || 'Operation failed')
      }
    } catch (error) {
      console.error('Submit error:', error)
      showMessage('error', 'An unexpected error occurred')
    }
  }

  // 删除链接
  const handleDelete = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this link?')) {
      return
    }

    try {
      const result = await friendlyLinksManager.deleteLink(linkId)
      if (result.success) {
        showMessage('success', result.message || 'Link deleted successfully')
        await loadData()
      } else {
        showMessage('error', result.error || 'Failed to delete link')
      }
    } catch (error) {
      console.error('Delete error:', error)
      showMessage('error', 'An unexpected error occurred')
    }
  }

  // 切换激活状态
  const handleToggleStatus = async (linkId: string) => {
    try {
      const result = await friendlyLinksManager.toggleLinkStatus(linkId)
      if (result.success) {
        await loadData()
      } else {
        showMessage('error', result.error || 'Failed to toggle status')
      }
    } catch (error) {
      console.error('Toggle status error:', error)
      showMessage('error', 'An unexpected error occurred')
    }
  }

  // 更新优先级
  const handlePriorityChange = async (linkId: string, direction: 'up' | 'down') => {
    const link = links.find(l => l.id === linkId)
    if (!link) return

    const newPriority = direction === 'up' ? link.priority - 1 : link.priority + 1
    
    try {
      const result = await friendlyLinksManager.updateLinkPriority(linkId, newPriority)
      if (result.success) {
        await loadData()
      } else {
        showMessage('error', result.error || 'Failed to update priority')
      }
    } catch (error) {
      console.error('Priority change error:', error)
      showMessage('error', 'An unexpected error occurred')
    }
  }

  // 保存设置
  const handleSaveSettings = async () => {
    try {
      const result = await friendlyLinksManager.updateSettings(settingsFormData)
      if (result.success) {
        showMessage('success', result.message || 'Settings saved successfully')
        setSettings(settingsFormData)
      } else {
        showMessage('error', result.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Save settings error:', error)
      showMessage('error', 'An unexpected error occurred')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 消息显示 */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <Tabs defaultValue="links" className="w-full">
        <TabsList>
          <TabsTrigger value="links">友情链接管理</TabsTrigger>
          <TabsTrigger value="settings">显示设置</TabsTrigger>
        </TabsList>

        {/* 友情链接管理标签页 */}
        <TabsContent value="links" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              友情链接管理
            </h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加友情链接
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingLink ? '编辑友情链接' : '添加友情链接'}
                  </DialogTitle>
                  <DialogDescription>
                    填写友情链接信息。带*号的字段为必填项。
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">网站名称 *</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="例如：Example Gaming Site"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="url">网站链接 *</Label>
                      <Input
                        id="url"
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        placeholder="https://example.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">网站描述</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="简要描述这个网站..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logo">Logo URL</Label>
                      <Input
                        id="logo"
                        type="url"
                        value={formData.logo}
                        onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                        placeholder="/logo.png 或 https://example.com/logo.png"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">显示优先级</Label>
                      <Input
                        id="priority"
                        type="number"
                        min="1"
                        max="1000"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      取消
                    </Button>
                    <Button type="submit">
                      {editingLink ? '保存更改' : '添加链接'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* 友情链接列表 */}
          <div className="grid gap-4">
            {links.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <LinkIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">暂无友情链接</p>
                  <p className="text-sm text-gray-400">点击上方"添加友情链接"按钮开始添加</p>
                </CardContent>
              </Card>
            ) : (
              links.map((link, index) => (
                <Card key={link.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">#{link.priority}</span>
                          {link.logo && (
                            <img 
                              src={link.logo} 
                              alt={link.name} 
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          )}
                          <div>
                            <h3 className="font-semibold">{link.name}</h3>
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {link.url}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            {link.description && (
                              <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge variant={link.isActive ? 'default' : 'secondary'}>
                          {link.isActive ? '显示' : '隐藏'}
                        </Badge>
                        
                        {/* 优先级调整 */}
                        <div className="flex">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePriorityChange(link.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePriorityChange(link.id, 'down')}
                            disabled={index === links.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* 操作按钮 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(link.id)}
                        >
                          {link.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(link)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(link.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* 显示设置标签页 */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                友情链接显示设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 基础设置 */}
                <div className="space-y-4">
                  <h3 className="font-semibold">基础设置</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isVisible">显示友情链接区域</Label>
                    <Switch
                      id="isVisible"
                      checked={settingsFormData.isVisible}
                      onCheckedChange={(checked) => 
                        setSettingsFormData({ ...settingsFormData, isVisible: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">区域标题</Label>
                    <Input
                      id="title"
                      value={settingsFormData.title}
                      onChange={(e) => 
                        setSettingsFormData({ ...settingsFormData, title: e.target.value })
                      }
                      placeholder="友情链接"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subtitle">副标题</Label>
                    <Input
                      id="subtitle"
                      value={settingsFormData.subtitle}
                      onChange={(e) => 
                        setSettingsFormData({ ...settingsFormData, subtitle: e.target.value })
                      }
                      placeholder="查看我们的合作伙伴"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxLinksToShow">最大显示数量</Label>
                    <Input
                      id="maxLinksToShow"
                      type="number"
                      min="1"
                      max="50"
                      value={settingsFormData.maxLinksToShow}
                      onChange={(e) => 
                        setSettingsFormData({ 
                          ...settingsFormData, 
                          maxLinksToShow: parseInt(e.target.value) || 10 
                        })
                      }
                    />
                  </div>
                </div>

                {/* 显示选项 */}
                <div className="space-y-4">
                  <h3 className="font-semibold">显示选项</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="openInNewTab">在新标签页打开链接</Label>
                    <Switch
                      id="openInNewTab"
                      checked={settingsFormData.openInNewTab}
                      onCheckedChange={(checked) => 
                        setSettingsFormData({ ...settingsFormData, openInNewTab: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showLogo">显示网站Logo</Label>
                    <Switch
                      id="showLogo"
                      checked={settingsFormData.showLogo}
                      onCheckedChange={(checked) => 
                        setSettingsFormData({ ...settingsFormData, showLogo: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showDescription">显示网站描述</Label>
                    <Switch
                      id="showDescription"
                      checked={settingsFormData.showDescription}
                      onCheckedChange={(checked) => 
                        setSettingsFormData({ ...settingsFormData, showDescription: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={handleSaveSettings} className="w-full md:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  保存设置
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default FriendlyLinksManager