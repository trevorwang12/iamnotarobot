"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Settings, 
  Link as LinkIcon, 
  Share2, 
  Layers, 
  Mail, 
  Copyright, 
  Palette, 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  MessageCircle,
  Gamepad2
} from "lucide-react"
import type { FooterContent, FooterLink, SocialLink } from "@/lib/footer-manager"
import { sanitizeInput } from "@/lib/security"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import {
  CSS,
} from '@dnd-kit/utilities'

// Icon mapping for social media
const socialIcons = {
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  messageCircle: MessageCircle,
  gamepad2: Gamepad2
}

// Sortable Link Component
function SortableLink({ 
  link, 
  onEdit, 
  onDelete, 
  onToggle 
}: { 
  link: FooterLink, 
  onEdit: (link: FooterLink) => void,
  onDelete: (id: string) => void,
  onToggle: (id: string, isVisible: boolean) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({id: link.id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between p-3 border rounded-lg bg-white">
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{link.label}</span>
            {link.isExternal && <ExternalLink className="w-3 h-3 text-gray-400" />}
            {link.isVisible ? (
              <Badge variant="secondary" className="text-xs">Visible</Badge>
            ) : (
              <Badge variant="outline" className="text-xs">Hidden</Badge>
            )}
          </div>
          <span className="text-sm text-gray-500">{link.url}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          checked={link.isVisible}
          onCheckedChange={(checked) => onToggle(link.id, checked)}
        />
        <Button size="sm" variant="outline" onClick={() => onEdit(link)}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => onDelete(link.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Helper function to get footer content
const getFooterContent = async (): Promise<FooterContent | null> => {
  try {
    const response = await fetch('/api/admin/footer')
    return response.ok ? await response.json() : null
  } catch (error) {
    console.error('Failed to fetch footer content:', error)
    return null
  }
}

export default function FooterManager() {
  const [content, setContent] = useState<FooterContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [alert, setAlert] = useState<{type: 'success' | 'error', message: string} | null>(null)

  // Link dialog states
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null)
  const [linkSection, setLinkSection] = useState<'navigation' | 'quickLinks'>('navigation')
  const [linkFormData, setLinkFormData] = useState({
    label: '',
    url: '',
    isExternal: false,
    isVisible: true
  })

  // Local states for controlled inputs
  const [copyrightText, setCopyrightText] = useState('')
  const [customCopyrightText, setCustomCopyrightText] = useState('')

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load content on mount
  useEffect(() => {
    const loadContent = async () => {
      const footerContent = await getFooterContent()
      if (footerContent) {
        setContent(footerContent)
        
        // Initialize local states
        setCopyrightText(footerContent.copyright.text)
        setCustomCopyrightText(footerContent.copyright.customText)
      }
    }
    loadContent()
  }, [])

  // Sync local states when content updates
  useEffect(() => {
    if (content) {
      setCopyrightText(content.copyright.text)
      setCustomCopyrightText(content.copyright.customText)
    }
  }, [content])

  // Debounced update functions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content && copyrightText !== content.copyright.text) {
        updateSection('copyright', { text: copyrightText })
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [copyrightText])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content && customCopyrightText !== content.copyright.customText) {
        updateSection('copyright', { customText: customCopyrightText })
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [customCopyrightText])

  // Update section
  const updateSection = async (section: keyof FooterContent, updates: any) => {
    try {
      console.log('Updating section:', section, 'with updates:', updates)
      
      const response = await fetch('/api/admin/footer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSection',
          section,
          data: updates
        })
      })

      const responseData = await response.json()
      console.log('Server response:', responseData)

      if (response.ok) {
        const updatedContent = await getFooterContent()
        if (updatedContent) {
          setContent(updatedContent)
        }
        console.log('Updated content:', updatedContent[section])
        showAlert('success', 'Footer updated successfully!')
        // Dispatch custom event to notify frontend components
        window.dispatchEvent(new CustomEvent('footerUpdated', { detail: updatedContent }))
      } else {
        console.error('Server error:', responseData)
        showAlert('error', responseData.error || 'Failed to update footer')
      }
    } catch (error) {
      console.error('Update error:', error)
      showAlert('error', 'An error occurred while updating')
    }
  }

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({type, message})
    setTimeout(() => setAlert(null), 3000)
  }

  const handleSave = () => {
    setLoading(true)
    setLastSaved(new Date().toLocaleTimeString())
    setLoading(false)
  }

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset footer to defaults? This cannot be undone.')) {
      try {
        const response = await fetch('/api/admin/footer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset' })
        })

        if (response.ok) {
          const updatedContent = await getFooterContent()
          if (updatedContent) {
            setContent(updatedContent)
          }
          showAlert('success', 'Footer reset to defaults!')
          setLastSaved(null)
        } else {
          showAlert('error', 'Failed to reset footer')
        }
      } catch (error) {
        console.error('Reset error:', error)
        showAlert('error', 'An error occurred while resetting')
      }
    }
  }

  // Link management functions
  const handleAddLink = () => {
    setEditingLink(null)
    setLinkFormData({
      label: '',
      url: '',
      isExternal: false,
      isVisible: true
    })
    setIsLinkDialogOpen(true)
  }

  const handleEditLink = (link: FooterLink) => {
    setEditingLink(link)
    setLinkFormData({
      label: link.label,
      url: link.url,
      isExternal: link.isExternal,
      isVisible: link.isVisible
    })
    setIsLinkDialogOpen(true)
  }

  const handleLinkSubmit = async () => {
    try {
      const sanitizedData = {
        label: sanitizeInput(linkFormData.label),
        url: linkFormData.url.trim(),
        isExternal: linkFormData.isExternal,
        isVisible: linkFormData.isVisible
      }

      if (!sanitizedData.label || !sanitizedData.url) {
        showAlert('error', 'Label and URL are required')
        return
      }

      let response
      if (editingLink) {
        // Update existing link
        const action = linkSection === 'navigation' ? 'updateNavigationLink' : 'updateQuickLink'
        response = await fetch('/api/admin/footer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            id: editingLink.id,
            updates: sanitizedData
          })
        })
      } else {
        // Add new link
        const action = linkSection === 'navigation' ? 'addNavigationLink' : 'addQuickLink'
        response = await fetch('/api/admin/footer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            data: sanitizedData
          })
        })
      }

      if (response.ok) {
        const updatedContent = await getFooterContent()
        if (updatedContent) {
          setContent(updatedContent)
        }
        showAlert('success', editingLink ? 'Link updated!' : 'Link added!')
        setIsLinkDialogOpen(false)
      } else {
        showAlert('error', 'Failed to save link')
      }
    } catch (error) {
      console.error('Link submit error:', error)
      showAlert('error', 'An error occurred while saving link')
    }
  }

  const handleDeleteLink = async (id: string, section: 'navigation' | 'quickLinks') => {
    if (confirm('Are you sure you want to delete this link?')) {
      try {
        const action = section === 'navigation' ? 'deleteNavigationLink' : 'deleteQuickLink'
        const response = await fetch('/api/admin/footer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            id
          })
        })

        if (response.ok) {
          const updatedContent = await getFooterContent()
          if (updatedContent) {
            setContent(updatedContent)
          }
          showAlert('success', 'Link deleted!')
        } else {
          showAlert('error', 'Failed to delete link')
        }
      } catch (error) {
        console.error('Delete link error:', error)
        showAlert('error', 'An error occurred while deleting link')
      }
    }
  }

  const handleToggleLink = async (id: string, isVisible: boolean, section: 'navigation' | 'quickLinks') => {
    try {
      const action = section === 'navigation' ? 'updateNavigationLink' : 'updateQuickLink'
      const response = await fetch('/api/admin/footer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          id,
          updates: { isVisible }
        })
      })

      if (response.ok) {
        const updatedContent = await getFooterContent()
        if (updatedContent) {
          setContent(updatedContent)
        }
      } else {
        showAlert('error', 'Failed to toggle link visibility')
      }
    } catch (error) {
      console.error('Toggle link error:', error)
      showAlert('error', 'An error occurred while toggling link')
    }
  }

  const handleDragEnd = async (event: DragEndEvent, section: 'navigation' | 'quickLinks') => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const links = section === 'navigation' ? content!.navigation.links : content!.quickLinks.links
      const oldIndex = links.findIndex((link) => link.id === active.id)
      const newIndex = links.findIndex((link) => link.id === over.id)

      const newLinks = arrayMove(links, oldIndex, newIndex)

      try {
        const response = await fetch('/api/admin/footer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reorderLinks',
            section,
            data: newLinks
          })
        })

        if (response.ok) {
          const updatedContent = await getFooterContent()
          if (updatedContent) {
            setContent(updatedContent)
          }
          setLastSaved(new Date().toLocaleTimeString())
        } else {
          showAlert('error', 'Failed to reorder links')
        }
      } catch (error) {
        console.error('Reorder error:', error)
        showAlert('error', 'An error occurred while reordering')
      }
    }
  }

  const handleSocialLinkUpdate = async (id: string, updates: Partial<SocialLink>) => {
    try {
      const response = await fetch('/api/admin/footer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSocialLink',
          id,
          updates
        })
      })

      if (response.ok) {
        const updatedContent = await getFooterContent()
        if (updatedContent) {
          setContent(updatedContent)
        }
        showAlert('success', 'Social link updated!')
      } else {
        showAlert('error', 'Failed to update social link')
      }
    } catch (error) {
      console.error('Social link update error:', error)
      showAlert('error', 'An error occurred while updating social link')
    }
  }

  if (!content) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {alert && (
        <Alert className={alert.type === 'error' ? 'border-red-500' : 'border-green-500'}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Footer Management</h1>
            <p className="text-gray-600">Customize footer content, links, and appearance</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-sm text-gray-500">Last saved: {lastSaved}</span>
          )}
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </div>

      <Tabs defaultValue="branding" className="space-y-4">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="quick-links">Quick Links</TabsTrigger>
          <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
          <TabsTrigger value="layout">Layout & Style</TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Footer Branding</CardTitle>
              <p className="text-sm text-gray-600">Configure logo and branding in footer</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Show Logo</Label>
                <Switch
                  checked={content.branding.showLogo}
                  onCheckedChange={(checked) => updateSection('branding', { showLogo: checked })}
                />
              </div>
              
              <div>
                <Label htmlFor="logoText">Logo Text</Label>
                <Input
                  id="logoText"
                  value={content.branding.logoText}
                  onChange={(e) => updateSection('branding', { logoText: e.target.value })}
                  placeholder="Your site name"
                />
              </div>
              
              <div>
                <Label htmlFor="logoIcon">Logo Icon</Label>
                <Select
                  value={content.branding.logoIcon}
                  onValueChange={(value) => updateSection('branding', { logoIcon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gamepad2">Gamepad</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                    <SelectItem value="star">Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={content.branding.description}
                  onChange={(e) => updateSection('branding', { description: e.target.value })}
                  placeholder="Brief description of your site"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="customDescription">Custom Description (optional)</Label>
                <Textarea
                  id="customDescription"
                  value={content.branding.customDescription}
                  onChange={(e) => updateSection('branding', { customDescription: e.target.value })}
                  placeholder="Override the default description"
                  rows={2}
                />
                <p className="text-xs text-gray-500 mt-1">If provided, this will override the main description</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Copyright Section</CardTitle>
              <p className="text-sm text-gray-600">Configure copyright notice</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Show Copyright</Label>
                <Switch
                  checked={content.copyright.isVisible}
                  onCheckedChange={(checked) => updateSection('copyright', { isVisible: checked })}
                />
              </div>
              
              <div>
                <Label htmlFor="copyrightText">Copyright Text</Label>
                <Input
                  id="copyrightText"
                  value={copyrightText}
                  onChange={(e) => setCopyrightText(e.target.value)}
                  placeholder="&copy; 2025 {siteName}. All rights reserved."
                />
                <p className="text-xs text-gray-500 mt-1">Use {"{siteName}"} to insert site name dynamically</p>
              </div>
              
              <div>
                <Label htmlFor="customCopyright">Custom Copyright Text (optional)</Label>
                <Input
                  id="customCopyright"
                  value={customCopyrightText}
                  onChange={(e) => setCustomCopyrightText(e.target.value)}
                  placeholder="Override the default copyright text"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Navigation Tab */}
        <TabsContent value="navigation" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Navigation Links</CardTitle>
                  <p className="text-sm text-gray-600">Manage footer navigation links</p>
                </div>
                <Button onClick={() => { setLinkSection('navigation'); handleAddLink() }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Link
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Show Navigation Section</Label>
                <Switch
                  checked={content.navigation.isVisible}
                  onCheckedChange={(checked) => updateSection('navigation', { isVisible: checked })}
                />
              </div>

              {/* Navigation Title Settings */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="navTitle">Section Title</Label>
                  <Input
                    id="navTitle"
                    value={content.navigation.title}
                    onChange={(e) => updateSection('navigation', { title: e.target.value })}
                    placeholder="Navigation"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Show Title</Label>
                  <Switch
                    checked={content.navigation.showTitle}
                    onCheckedChange={(checked) => updateSection('navigation', { showTitle: checked })}
                  />
                </div>
              </div>

              {/* Navigation Layout Settings */}
              <div className="space-y-3">
                <Label>Layout Style</Label>
                <Select
                  value={content.navigation.layout}
                  onValueChange={(value) => updateSection('navigation', { layout: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vertical">Vertical (Column)</SelectItem>
                    <SelectItem value="horizontal">Horizontal (Row)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Vertical: Links stacked vertically | Horizontal: Links arranged in a row with wrapping
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(e, 'navigation')}
                >
                  <SortableContext 
                    items={content.navigation.links.map(l => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {content.navigation.links.map((link) => (
                      <SortableLink
                        key={link.id}
                        link={link}
                        onEdit={handleEditLink}
                        onDelete={(id) => handleDeleteLink(id, 'navigation')}
                        onToggle={(id, isVisible) => handleToggleLink(id, isVisible, 'navigation')}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                
                {content.navigation.links.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No navigation links yet. Click "Add Link" to create your first link.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <p className="text-sm text-gray-600">Configure social media presence in footer</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Show Social Media Section</Label>
                <Switch
                  checked={content.socialMedia.isVisible}
                  onCheckedChange={(checked) => updateSection('socialMedia', { isVisible: checked })}
                />
              </div>
              
              <div>
                <Label htmlFor="socialTitle">Section Title</Label>
                <Input
                  id="socialTitle"
                  value={content.socialMedia.title}
                  onChange={(e) => updateSection('socialMedia', { title: e.target.value })}
                  placeholder="Follow Us"
                />
              </div>
              
              <Separator />
              
              <div className="grid md:grid-cols-2 gap-4">
                {content.socialMedia.links.map((link) => {
                  const IconComponent = socialIcons[link.icon as keyof typeof socialIcons]
                  return (
                    <Card key={link.id} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {IconComponent && <IconComponent className="w-5 h-5 text-blue-600" />}
                        <span className="font-medium">{link.platform}</span>
                        <Switch
                          checked={link.isVisible}
                          onCheckedChange={(checked) => handleSocialLinkUpdate(link.id, { isVisible: checked })}
                        />
                      </div>
                      <Input
                        value={link.url}
                        onChange={(e) => handleSocialLinkUpdate(link.id, { url: e.target.value })}
                        placeholder={`${link.platform} URL`}
                      />
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Links Tab */}
        <TabsContent value="quick-links" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quick Links</CardTitle>
                  <p className="text-sm text-gray-600">Manage additional footer links</p>
                </div>
                <Button onClick={() => { setLinkSection('quickLinks'); handleAddLink() }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Quick Link
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Show Quick Links Section</Label>
                <Switch
                  checked={content.quickLinks.isVisible}
                  onCheckedChange={(checked) => updateSection('quickLinks', { isVisible: checked })}
                />
              </div>
              
              <div>
                <Label htmlFor="quickLinksTitle">Section Title</Label>
                <Input
                  id="quickLinksTitle"
                  value={content.quickLinks.title}
                  onChange={(e) => updateSection('quickLinks', { title: e.target.value })}
                  placeholder="Quick Links"
                />
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(e, 'quickLinks')}
                >
                  <SortableContext 
                    items={content.quickLinks.links.map(l => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {content.quickLinks.links.map((link) => (
                      <SortableLink
                        key={link.id}
                        link={link}
                        onEdit={handleEditLink}
                        onDelete={(id) => handleDeleteLink(id, 'quickLinks')}
                        onToggle={(id, isVisible) => handleToggleLink(id, isVisible, 'quickLinks')}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                
                {content.quickLinks.links.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No quick links yet. Click "Add Quick Link" to create your first link.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Newsletter Tab */}
        <TabsContent value="newsletter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Newsletter Signup</CardTitle>
              <p className="text-sm text-gray-600">Configure newsletter subscription section</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Show Newsletter Section</Label>
                <Switch
                  checked={content.newsletter.isVisible}
                  onCheckedChange={(checked) => updateSection('newsletter', { isVisible: checked })}
                />
              </div>
              
              <div>
                <Label htmlFor="newsletterTitle">Title</Label>
                <Input
                  id="newsletterTitle"
                  value={content.newsletter.title}
                  onChange={(e) => updateSection('newsletter', { title: e.target.value })}
                  placeholder="Stay Updated"
                />
              </div>
              
              <div>
                <Label htmlFor="newsletterDesc">Description</Label>
                <Textarea
                  id="newsletterDesc"
                  value={content.newsletter.description}
                  onChange={(e) => updateSection('newsletter', { description: e.target.value })}
                  placeholder="Get the latest gaming news and updates"
                  rows={2}
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newsletterPlaceholder">Input Placeholder</Label>
                  <Input
                    id="newsletterPlaceholder"
                    value={content.newsletter.placeholder}
                    onChange={(e) => updateSection('newsletter', { placeholder: e.target.value })}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <Label htmlFor="newsletterButton">Button Text</Label>
                  <Input
                    id="newsletterButton"
                    value={content.newsletter.buttonText}
                    onChange={(e) => updateSection('newsletter', { buttonText: e.target.value })}
                    placeholder="Subscribe"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Layout & Styling</CardTitle>
              <p className="text-sm text-gray-600">Customize footer appearance</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="columns">Layout Columns</Label>
                <Select
                  value={content.layout.columns.toString()}
                  onValueChange={(value) => updateSection('layout', { columns: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Column</SelectItem>
                    <SelectItem value="2">2 Columns</SelectItem>
                    <SelectItem value="3">3 Columns</SelectItem>
                    <SelectItem value="4">4 Columns</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="spacing">Spacing</Label>
                <Select
                  value={content.layout.spacing}
                  onValueChange={(value) => updateSection('layout', { spacing: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bgColor">Background Color</Label>
                  <Input
                    id="bgColor"
                    value={content.layout.backgroundColor}
                    onChange={(e) => updateSection('layout', { backgroundColor: e.target.value })}
                    placeholder="gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="textColor">Text Color</Label>
                  <Input
                    id="textColor"
                    value={content.layout.textColor}
                    onChange={(e) => updateSection('layout', { textColor: e.target.value })}
                    placeholder="gray-600"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="linkHoverColor">Link Hover Color</Label>
                  <Input
                    id="linkHoverColor"
                    value={content.layout.linkHoverColor}
                    onChange={(e) => updateSection('layout', { linkHoverColor: e.target.value })}
                    placeholder="blue-600"
                  />
                </div>
                <div>
                  <Label htmlFor="borderColor">Border Color</Label>
                  <Input
                    id="borderColor"
                    value={content.layout.borderColor}
                    onChange={(e) => updateSection('layout', { borderColor: e.target.value })}
                    placeholder="gray-200"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Show Friendly Links</Label>
                <Switch
                  checked={content.friendlyLinks.isVisible}
                  onCheckedChange={(checked) => updateSection('friendlyLinks', { isVisible: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLink ? 'Edit Link' : 'Add New Link'}</DialogTitle>
            <DialogDescription>
              {editingLink ? 'Update the link details.' : 'Create a new link for the footer.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="linkLabel">Label *</Label>
              <Input
                id="linkLabel"
                value={linkFormData.label}
                onChange={(e) => setLinkFormData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Link text"
              />
            </div>
            <div>
              <Label htmlFor="linkUrl">URL *</Label>
              <Input
                id="linkUrl"
                value={linkFormData.url}
                onChange={(e) => setLinkFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com or /internal-page"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isExternal"
                checked={linkFormData.isExternal}
                onCheckedChange={(checked) => setLinkFormData(prev => ({ ...prev, isExternal: checked }))}
              />
              <Label htmlFor="isExternal">External Link (opens in new tab)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isVisible"
                checked={linkFormData.isVisible}
                onCheckedChange={(checked) => setLinkFormData(prev => ({ ...prev, isVisible: checked }))}
              />
              <Label htmlFor="isVisible">Visible</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLinkSubmit}>{editingLink ? 'Update' : 'Add'} Link</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}