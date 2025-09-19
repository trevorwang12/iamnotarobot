"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Edit, Save, X, Eye, EyeOff } from "lucide-react"
import { aboutManager, type AboutContent } from '@/lib/about-manager'

interface CustomHtmlSection {
  id: string
  title: string
  content: string
  isVisible: boolean
}

export default function AboutManager() {
  const [content, setContent] = useState<AboutContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    try {
      const aboutContent = await aboutManager.getContent()
      setContent(aboutContent)
    } catch (error) {
      console.error('Error loading about content:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSection = async (sectionName: keyof AboutContent, updates: any) => {
    if (!content) return
    setSaving(true)
    try {
      const success = await aboutManager.updateSection(sectionName, updates)
      if (success) {
        if (sectionName === 'customHtmlSections') {
          // For customHtmlSections, replace the entire array
          setContent({
            ...content,
            customHtmlSections: updates
          })
        } else {
          // For other sections, merge the updates
          setContent({
            ...content,
            [sectionName]: { ...content[sectionName], ...updates }
          })
        }
      }
    } catch (error) {
      console.error('Error updating section:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleSectionVisibility = async (sectionName: keyof AboutContent) => {
    if (!content) return
    const currentSection = content[sectionName] as any
    await updateSection(sectionName, { isVisible: !currentSection.isVisible })
  }

  // Custom HTML Sections Management
  const addCustomHtmlSection = () => {
    if (!content) return
    const newSection: CustomHtmlSection = {
      id: `custom-html-${Date.now()}`,
      title: 'New Custom Section',
      content: '<div class="text-center p-8">\n  <h3 class="text-2xl font-bold mb-4">Custom Section</h3>\n  <p class="text-gray-600">Add your custom HTML content here.</p>\n</div>',
      isVisible: true
    }
    const currentSections = Array.isArray(content.customHtmlSections) ? content.customHtmlSections : []
    const updatedSections = [...currentSections, newSection]
    updateSection('customHtmlSections', updatedSections)
  }

  const updateCustomHtmlSection = (index: number, updates: Partial<CustomHtmlSection>) => {
    if (!content) return
    const currentSections = Array.isArray(content.customHtmlSections) ? content.customHtmlSections : []
    const updatedSections = currentSections.map((section, i) => 
      i === index ? { ...section, ...updates } : section
    )
    updateSection('customHtmlSections', updatedSections)
  }

  const removeCustomHtmlSection = (index: number) => {
    if (!content) return
    const currentSections = Array.isArray(content.customHtmlSections) ? content.customHtmlSections : []
    const updatedSections = currentSections.filter((_, i) => i !== index)
    updateSection('customHtmlSections', updatedSections)
  }

  const resetToDefaults = async () => {
    if (confirm('Are you sure you want to reset all content to defaults? This cannot be undone.')) {
      setSaving(true)
      try {
        const success = await aboutManager.resetToDefaults()
        if (success) {
          await loadContent()
        }
      } catch (error) {
        console.error('Error resetting to defaults:', error)
      } finally {
        setSaving(false)
      }
    }
  }

  if (loading) {
    return <div className="p-4">Loading About Us content...</div>
  }

  if (!content) {
    return <div className="p-4">Failed to load About Us content.</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">About Us Management</h2>
        <div className="flex gap-2">
          <Button 
            onClick={resetToDefaults} 
            variant="outline" 
            disabled={saving}
          >
            Reset to Defaults
          </Button>
        </div>
      </div>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="mission">Mission</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="cta">CTA</TabsTrigger>
          <TabsTrigger value="custom">Custom HTML</TabsTrigger>
          <TabsTrigger value="visibility">Visibility</TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Hero Section</CardTitle>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={content.hero.isVisible}
                  onCheckedChange={() => toggleSectionVisibility('hero')}
                />
                <Label>{content.hero.isVisible ? 'Visible' : 'Hidden'}</Label>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hero-title">Title</Label>
                <Input
                  id="hero-title"
                  value={content.hero.title}
                  onChange={(e) => updateSection('hero', { title: e.target.value })}
                  placeholder="Hero title"
                />
              </div>
              <div>
                <Label htmlFor="hero-subtitle">Subtitle</Label>
                <Textarea
                  id="hero-subtitle"
                  value={content.hero.subtitle}
                  onChange={(e) => updateSection('hero', { subtitle: e.target.value })}
                  placeholder="Hero subtitle"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="hero-icon">Icon</Label>
                <Input
                  id="hero-icon"
                  value={content.hero.icon}
                  onChange={(e) => updateSection('hero', { icon: e.target.value })}
                  placeholder="Icon name (e.g., Gamepad2)"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mission Section */}
        <TabsContent value="mission">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Mission & Values Section</CardTitle>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={content.mission.isVisible}
                  onCheckedChange={() => toggleSectionVisibility('mission')}
                />
                <Label>{content.mission.isVisible ? 'Visible' : 'Hidden'}</Label>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="mission-title">Section Title</Label>
                <Input
                  id="mission-title"
                  value={content.mission.title}
                  onChange={(e) => updateSection('mission', { title: e.target.value })}
                  placeholder="Section title"
                />
              </div>

              {/* Mission Card */}
              <div className="border rounded p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Mission Card</h4>
                  <Switch
                    checked={content.mission.cards.mission.isVisible}
                    onCheckedChange={(checked) => 
                      updateSection('mission', {
                        cards: {
                          ...content.mission.cards,
                          mission: { ...content.mission.cards.mission, isVisible: checked }
                        }
                      })
                    }
                  />
                </div>
                <div className="grid gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={content.mission.cards.mission.title}
                      onChange={(e) => 
                        updateSection('mission', {
                          cards: {
                            ...content.mission.cards,
                            mission: { ...content.mission.cards.mission, title: e.target.value }
                          }
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={content.mission.cards.mission.description}
                      onChange={(e) => 
                        updateSection('mission', {
                          cards: {
                            ...content.mission.cards,
                            mission: { ...content.mission.cards.mission, description: e.target.value }
                          }
                        })
                      }
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Team Card */}
              <div className="border rounded p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Team Card</h4>
                  <Switch
                    checked={content.mission.cards.team.isVisible}
                    onCheckedChange={(checked) => 
                      updateSection('mission', {
                        cards: {
                          ...content.mission.cards,
                          team: { ...content.mission.cards.team, isVisible: checked }
                        }
                      })
                    }
                  />
                </div>
                <div className="grid gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={content.mission.cards.team.title}
                      onChange={(e) => 
                        updateSection('mission', {
                          cards: {
                            ...content.mission.cards,
                            team: { ...content.mission.cards.team, title: e.target.value }
                          }
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={content.mission.cards.team.description}
                      onChange={(e) => 
                        updateSection('mission', {
                          cards: {
                            ...content.mission.cards,
                            team: { ...content.mission.cards.team, description: e.target.value }
                          }
                        })
                      }
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Values Card */}
              <div className="border rounded p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Values Card</h4>
                  <Switch
                    checked={content.mission.cards.values.isVisible}
                    onCheckedChange={(checked) => 
                      updateSection('mission', {
                        cards: {
                          ...content.mission.cards,
                          values: { ...content.mission.cards.values, isVisible: checked }
                        }
                      })
                    }
                  />
                </div>
                <div className="grid gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={content.mission.cards.values.title}
                      onChange={(e) => 
                        updateSection('mission', {
                          cards: {
                            ...content.mission.cards,
                            values: { ...content.mission.cards.values, title: e.target.value }
                          }
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={content.mission.cards.values.description}
                      onChange={(e) => 
                        updateSection('mission', {
                          cards: {
                            ...content.mission.cards,
                            values: { ...content.mission.cards.values, description: e.target.value }
                          }
                        })
                      }
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Section */}
        <TabsContent value="about">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>About Content Section</CardTitle>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={content.about.isVisible}
                  onCheckedChange={() => toggleSectionVisibility('about')}
                />
                <Label>{content.about.isVisible ? 'Visible' : 'Hidden'}</Label>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="about-title">Section Title</Label>
                <Input
                  id="about-title"
                  value={content.about.title}
                  onChange={(e) => updateSection('about', { 
                    ...content.about,
                    title: e.target.value 
                  })}
                  placeholder="About section title"
                />
              </div>
              <div>
                <Label htmlFor="about-description">Description</Label>
                <Textarea
                  id="about-description"
                  value={content.about.content.description}
                  onChange={(e) => updateSection('about', {
                    ...content.about,
                    content: {
                      ...content.about.content,
                      description: e.target.value
                    }
                  })}
                  placeholder="Company description"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="about-vision-content">Vision Content</Label>
                <Textarea
                  id="about-vision-content"
                  value={content.about.content.vision.content}
                  onChange={(e) => updateSection('about', {
                    ...content.about,
                    content: {
                      ...content.about.content,
                      vision: {
                        ...content.about.content.vision,
                        content: e.target.value
                      }
                    }
                  })}
                  placeholder="Vision statement"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="about-contact-content">Contact Content</Label>
                <Textarea
                  id="about-contact-content"
                  value={content.about.content.contact.content}
                  onChange={(e) => updateSection('about', {
                    ...content.about,
                    content: {
                      ...content.about.content,
                      contact: {
                        ...content.about.content.contact,
                        content: e.target.value
                      }
                    }
                  })}
                  placeholder="Contact information"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CTA Section */}
        <TabsContent value="cta">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Call to Action Section</CardTitle>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={content.cta.isVisible}
                  onCheckedChange={() => toggleSectionVisibility('cta')}
                />
                <Label>{content.cta.isVisible ? 'Visible' : 'Hidden'}</Label>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cta-title">Title</Label>
                <Input
                  id="cta-title"
                  value={content.cta.title}
                  onChange={(e) => updateSection('cta', { title: e.target.value })}
                  placeholder="CTA title"
                />
              </div>
              <div>
                <Label htmlFor="cta-description">Description</Label>
                <Textarea
                  id="cta-description"
                  value={content.cta.description}
                  onChange={(e) => updateSection('cta', { description: e.target.value })}
                  placeholder="CTA description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="cta-button-text">Button Text</Label>
                <Input
                  id="cta-button-text"
                  value={content.cta.buttonText}
                  onChange={(e) => updateSection('cta', { buttonText: e.target.value })}
                  placeholder="Button text"
                />
              </div>
              <div>
                <Label htmlFor="cta-button-link">Button Link</Label>
                <Input
                  id="cta-button-link"
                  value={content.cta.buttonLink}
                  onChange={(e) => updateSection('cta', { buttonLink: e.target.value })}
                  placeholder="Button link URL"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom HTML Sections */}
        <TabsContent value="custom">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Custom HTML Sections</CardTitle>
              <Button onClick={addCustomHtmlSection} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </CardHeader>
            <CardContent>
              {Array.isArray(content.customHtmlSections) && content.customHtmlSections.length > 0 ? (
                content.customHtmlSections.map((section, index) => (
                  <Card key={section.id} className="border-l-4 border-l-blue-500 mb-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={section.isVisible}
                            onCheckedChange={(checked) => 
                              updateCustomHtmlSection(index, { isVisible: checked })
                            }
                          />
                          {section.isVisible ? (
                            <Eye className="w-4 h-4 text-green-500" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <Button
                          onClick={() => removeCustomHtmlSection(index)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Section Title</Label>
                        <Input
                          value={section.title}
                          onChange={(e) => 
                            updateCustomHtmlSection(index, { title: e.target.value })
                          }
                          placeholder="Section title"
                        />
                      </div>
                      <div>
                        <Label>HTML Content</Label>
                        <Textarea
                          value={section.content}
                          onChange={(e) => 
                            updateCustomHtmlSection(index, { content: e.target.value })
                          }
                          placeholder="Enter your custom HTML content here"
                          className="font-mono text-sm"
                          rows={10}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No custom HTML sections yet. Click "Add Section" to create one.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section Visibility */}
        <TabsContent value="visibility">
          <Card>
            <CardHeader>
              <CardTitle>Section Visibility</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { key: 'hero', name: 'Hero Section' },
                  { key: 'mission', name: 'Mission & Values Section' },
                  { key: 'about', name: 'About Content Section' },
                  { key: 'cta', name: 'Call to Action Section' }
                ].map(({ key, name }) => {
                  const section = content[key as keyof AboutContent] as any
                  return (
                    <div key={key} className="flex items-center justify-between p-4 border rounded">
                      <span className="font-medium">{name}</span>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={section?.isVisible || false}
                          onCheckedChange={() => toggleSectionVisibility(key as keyof AboutContent)}
                        />
                        <Label className="text-sm">
                          {section?.isVisible ? 'Visible' : 'Hidden'}
                        </Label>
                      </div>
                    </div>
                  )
                })}

                {/* Custom HTML Sections */}
                {Array.isArray(content.customHtmlSections) && content.customHtmlSections.map((section, index) => (
                  <div key={section.id} className="flex items-center justify-between p-4 border rounded">
                    <span className="font-medium">Custom HTML: {section.title}</span>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={section.isVisible}
                        onCheckedChange={(checked) => 
                          updateCustomHtmlSection(index, { isVisible: checked })
                        }
                      />
                      <Label className="text-sm">
                        {section.isVisible ? 'Visible' : 'Hidden'}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}