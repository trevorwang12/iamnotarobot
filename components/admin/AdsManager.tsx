"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Edit, Trash2, Eye, Monitor } from "lucide-react"
import { adManager, type AdSlot } from "@/lib/ad-manager"
import { sanitizeInput } from "@/lib/security"

interface AdFormData {
  name: string
  htmlContent: string
  position: 'header' | 'footer' | 'sidebar' | 'hero-bottom' | 'content-top' | 'game-details-bottom' | 'content-bottom' | 'recommendations-top' | 'adsense-auto' | 'adsense-display' | 'adsense-in-article' | 'adsense-in-feed' | 'adsense-verification'
  isActive: boolean
}

const initialAdFormData: AdFormData = {
  name: '',
  htmlContent: '',
  position: 'header',
  isActive: true
}

export default function AdsManager() {
  const [ads, setAds] = useState<AdSlot[]>([])
  const [adFormData, setAdFormData] = useState<AdFormData>(initialAdFormData)
  const [editingAd, setEditingAd] = useState<AdSlot | null>(null)
  const [isAdDialogOpen, setIsAdDialogOpen] = useState(false)
  const [alert, setAlert] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')

  useEffect(() => {
    loadAds()
  }, [])

  const loadAds = async () => {
    const ads = await adManager.getAllAds()
    setAds(ads)
  }

  const handleAdSubmit = async () => {
    try {
      const sanitizedData = {
        ...adFormData,
        name: sanitizeInput(adFormData.name),
        htmlContent: adFormData.htmlContent.trim()
      }

      const validation = adManager.validateHtmlContent(sanitizedData.htmlContent)
      if (!validation.isValid) {
        showAlert('error', validation.message || 'Invalid ad content')
        return
      }

      if (editingAd) {
        const updated = await adManager.updateAd(editingAd.id, sanitizedData)
        if (updated) {
          showAlert('success', 'Ad updated successfully!')
        } else {
          showAlert('error', 'Failed to update ad')
        }
      } else {
        const newAd = await adManager.createAd(sanitizedData)
        if (newAd) {
          showAlert('success', 'Ad created successfully!')
        } else {
          showAlert('error', 'Failed to create ad')
        }
      }

      loadAds()
      handleAdDialogClose()
    } catch (error) {
      console.error('Error saving ad:', error)
      showAlert('error', 'An error occurred while saving the ad')
    }
  }

  const handleAdEdit = (ad: AdSlot) => {
    setEditingAd(ad)
    setAdFormData({
      name: ad.name,
      htmlContent: ad.htmlContent,
      position: ad.position,
      isActive: ad.isActive
    })
    setIsAdDialogOpen(true)
  }

  const handleAdDelete = async (adId: string) => {
    if (confirm('Are you sure you want to delete this ad?')) {
      const success = await adManager.deleteAd(adId)
      if (success) {
        showAlert('success', 'Ad deleted successfully!')
        loadAds()
      } else {
        showAlert('error', 'Failed to delete ad')
      }
    }
  }

  const handleAdToggle = async (adId: string, isActive: boolean) => {
    const success = await adManager.updateAd(adId, { isActive })
    if (success) {
      showAlert('success', `Ad ${isActive ? 'enabled' : 'disabled'} successfully!`)
      loadAds()
    } else {
      showAlert('error', 'Failed to update ad status')
    }
  }

  const handleAdDialogClose = () => {
    setIsAdDialogOpen(false)
    setAdFormData(initialAdFormData)
    setEditingAd(null)
    setPreviewHtml('')
  }

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({type, message})
    setTimeout(() => setAlert(null), 3000)
  }

  const handlePreview = () => {
    setPreviewHtml(adFormData.htmlContent)
  }

  const getPositionLabel = (position: string) => {
    const labels: Record<string, string> = {
      header: 'Header',
      footer: 'Footer', 
      sidebar: 'Sidebar',
      'hero-bottom': 'Hero Bottom',
      'content-top': 'Content Top',
      'game-details-bottom': 'Game Details Bottom',
      'content-bottom': 'Content Bottom',
      'recommendations-top': 'Recommendations Top',
      'adsense-auto': 'AdSense Auto Ads',
      'adsense-display': 'AdSense Display',
      'adsense-in-article': 'AdSense In-Article',
      'adsense-in-feed': 'AdSense In-Feed',
      'adsense-verification': 'AdSense Verification'
    }
    return labels[position] || position
  }

  return (
    <div className="space-y-6">
      {alert && (
        <Alert className={`${alert.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ads Management</CardTitle>
            <Dialog open={isAdDialogOpen} onOpenChange={setIsAdDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setAdFormData(initialAdFormData)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Ad
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingAd ? 'Edit Ad' : 'Add New Ad'}</DialogTitle>
                  <DialogDescription>
                    {editingAd ? 'Modify the advertisement content and placement settings.' : 'Create a new advertisement to display on your website.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="adName">Ad Name *</Label>
                      <Input
                        id="adName"
                        value={adFormData.name}
                        onChange={(e) => setAdFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter ad name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="adPosition">Position *</Label>
                      <Select 
                        value={adFormData.position} 
                        onValueChange={(value) => setAdFormData(prev => ({ ...prev, position: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="header">Header</SelectItem>
                          <SelectItem value="footer">Footer</SelectItem>
                          <SelectItem value="sidebar">Sidebar</SelectItem>
                          <SelectItem value="hero-bottom">Hero Bottom</SelectItem>
                          <SelectItem value="content-top">Content Top</SelectItem>
                          <SelectItem value="game-details-bottom">Game Details Bottom</SelectItem>
                          <SelectItem value="content-bottom">Content Bottom</SelectItem>
                          <SelectItem value="recommendations-top">Recommendations Top</SelectItem>
                          <SelectItem value="adsense-auto">AdSense Auto Ads</SelectItem>
                          <SelectItem value="adsense-display">AdSense Display</SelectItem>
                          <SelectItem value="adsense-in-article">AdSense In-Article</SelectItem>
                          <SelectItem value="adsense-in-feed">AdSense In-Feed</SelectItem>
                          <SelectItem value="adsense-verification">AdSense Verification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="adContent">HTML Content *</Label>
                    <Textarea
                      id="adContent"
                      value={adFormData.htmlContent}
                      onChange={(e) => setAdFormData(prev => ({ ...prev, htmlContent: e.target.value }))}
                      placeholder="Enter HTML/JavaScript ad code"
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="adActive"
                        checked={adFormData.isActive}
                        onCheckedChange={(checked) => setAdFormData(prev => ({ ...prev, isActive: checked }))}
                      />
                      <Label htmlFor="adActive">Active</Label>
                    </div>
                    <Button type="button" variant="outline" onClick={handlePreview}>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                  
                  {previewHtml && (
                    <div>
                      <Label>Preview</Label>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleAdDialogClose}>Cancel</Button>
                  <Button onClick={handleAdSubmit}>{editingAd ? 'Update' : 'Add'} Ad</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ads.map((ad) => (
              <div key={ad.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold">{ad.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        ad.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {ad.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {getPositionLabel(ad.position)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span>Created: {new Date(ad.createdAt).toLocaleDateString()}</span>
                        <span>Updated: {new Date(ad.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          View HTML Content
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {ad.htmlContent}
                        </pre>
                      </details>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={ad.isActive}
                      onCheckedChange={(checked) => handleAdToggle(ad.id, checked)}
                    />
                    <Button size="sm" variant="outline" onClick={() => handleAdEdit(ad)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAdDelete(ad.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {ads.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No ads created yet. Click "Add Ad" to create your first advertisement.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}