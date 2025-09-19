'use client'

// 友情链接数据接口
export interface FriendlyLink {
  id: string
  name: string
  url: string
  description: string
  logo: string
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

export interface FriendlyLinksSettings {
  isVisible: boolean
  title: string
  subtitle: string
  maxLinksToShow: number
  openInNewTab: boolean
  showLogo: boolean
  showDescription: boolean
}

export interface FriendlyLinksData {
  links: FriendlyLink[]
  settings: FriendlyLinksSettings
}

// 友情链接管理器类
class FriendlyLinksManager {
  private apiUrl = '/api/admin/friendly-links'

  // 获取所有友情链接数据
  async getData(): Promise<FriendlyLinksData> {
    try {
      const response = await fetch(this.apiUrl)
      const result = await response.json()
      
      if (result.success) {
        return result.data
      } else {
        console.error('Failed to fetch friendly links:', result.error)
        return this.getDefaultData()
      }
    } catch (error) {
      console.error('Error fetching friendly links:', error)
      return this.getDefaultData()
    }
  }

  // 获取活动的友情链接（仅前端显示用）
  async getActiveLinks(): Promise<FriendlyLink[]> {
    try {
      const data = await this.getData()
      return data.links
        .filter(link => link.isActive)
        .sort((a, b) => a.priority - b.priority)
        .slice(0, data.settings.maxLinksToShow)
    } catch (error) {
      console.error('Error getting active links:', error)
      return []
    }
  }

  // 获取设置
  async getSettings(): Promise<FriendlyLinksSettings> {
    try {
      const data = await this.getData()
      return data.settings
    } catch (error) {
      console.error('Error getting friendly links settings:', error)
      return this.getDefaultSettings()
    }
  }

  // 添加友情链接
  async addLink(linkData: Omit<FriendlyLink, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(linkData),
      })

      const result = await response.json()
      
      if (result.success) {
        // 触发更新事件
        this.dispatchUpdateEvent()
        return { success: true, message: result.message }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error adding friendly link:', error)
      return { success: false, error: 'Failed to add friendly link' }
    }
  }

  // 更新友情链接
  async updateLink(linkId: string, linkData: Partial<Omit<FriendlyLink, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateLink',
          linkId,
          linkData
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        this.dispatchUpdateEvent()
        return { success: true, message: result.message }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error updating friendly link:', error)
      return { success: false, error: 'Failed to update friendly link' }
    }
  }

  // 删除友情链接
  async deleteLink(linkId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}?linkId=${linkId}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      
      if (result.success) {
        this.dispatchUpdateEvent()
        return { success: true, message: result.message }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error deleting friendly link:', error)
      return { success: false, error: 'Failed to delete friendly link' }
    }
  }

  // 更新设置
  async updateSettings(settings: Partial<FriendlyLinksSettings>): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateSettings',
          settings
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        this.dispatchUpdateEvent()
        return { success: true, message: result.message }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error updating friendly links settings:', error)
      return { success: false, error: 'Failed to update settings' }
    }
  }

  // 切换链接激活状态
  async toggleLinkStatus(linkId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const data = await this.getData()
      const link = data.links.find(l => l.id === linkId)
      
      if (!link) {
        return { success: false, error: 'Link not found' }
      }

      return await this.updateLink(linkId, { isActive: !link.isActive })
    } catch (error) {
      console.error('Error toggling link status:', error)
      return { success: false, error: 'Failed to toggle link status' }
    }
  }

  // 更新链接优先级
  async updateLinkPriority(linkId: string, priority: number): Promise<{ success: boolean; message?: string; error?: string }> {
    return await this.updateLink(linkId, { priority })
  }

  // 批量更新优先级
  async batchUpdatePriorities(updates: { id: string; priority: number }[]): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      for (const update of updates) {
        await this.updateLink(update.id, { priority: update.priority })
      }
      return { success: true, message: 'Priorities updated successfully' }
    } catch (error) {
      console.error('Error updating priorities:', error)
      return { success: false, error: 'Failed to update priorities' }
    }
  }

  // 触发更新事件
  private dispatchUpdateEvent(): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('friendlyLinksUpdated')
      window.dispatchEvent(event)
    }
  }

  // 获取默认数据
  private getDefaultData(): FriendlyLinksData {
    return {
      links: [],
      settings: this.getDefaultSettings()
    }
  }

  // 获取默认设置
  private getDefaultSettings(): FriendlyLinksSettings {
    return {
      isVisible: true,
      title: 'Friendly Links',
      subtitle: 'Check out our partner gaming sites',
      maxLinksToShow: 10,
      openInNewTab: true,
      showLogo: true,
      showDescription: true
    }
  }

  // 验证URL格式
  isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // 验证链接数据
  validateLinkData(linkData: Partial<FriendlyLink>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!linkData.name || linkData.name.trim().length === 0) {
      errors.push('Name is required')
    }

    if (!linkData.url || linkData.url.trim().length === 0) {
      errors.push('URL is required')
    } else if (!this.isValidUrl(linkData.url)) {
      errors.push('Invalid URL format')
    }

    if (linkData.priority !== undefined && (linkData.priority < 1 || linkData.priority > 1000)) {
      errors.push('Priority must be between 1 and 1000')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// 创建单例实例
export const friendlyLinksManager = new FriendlyLinksManager()