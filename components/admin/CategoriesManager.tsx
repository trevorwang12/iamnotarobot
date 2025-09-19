"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Edit, Trash2, Palette } from "lucide-react"
import { sanitizeInput, validateCategoryData, generateSecureId, rateLimiter } from "@/lib/security"

interface CategoryData {
  id: string
  name: string
  description: string
  icon: string
  color: string
  isActive: boolean
}

interface CategoryFormData {
  name: string
  description: string
  icon: string
  color: string
  isActive: boolean
}

const initialFormData: CategoryFormData = {
  name: '',
  description: '',
  icon: '🎮',
  color: '#3b82f6',
  isActive: true
}

const presetColors = [
  '#ef4444', // red
  '#f97316', // orange  
  '#f59e0b', // yellow
  '#10b981', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6b7280', // gray
  '#7c2d12', // brown
]

const presetIcons = ['🎮', '⚔️', '🧩', '🎯', '🕹️', '⚽', '🏎️', '🗺️', '🏗️', '👥', '🎨', '📚', '🎵', '⭐', '🔥']

export default function CategoriesManager() {
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData)
  const [alert, setAlert] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        showAlert('error', 'Failed to load categories')
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      showAlert('error', 'Failed to load categories')
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleInputChange = (field: keyof CategoryFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    if (!rateLimiter.isAllowed('admin-submit', 10, 60000)) {
      showAlert('error', 'Too many requests. Please wait.')
      return
    }

    setLoading(true)
    try {
      const sanitizedData = {
        name: sanitizeInput(formData.name),
        description: sanitizeInput(formData.description),
        icon: sanitizeInput(formData.icon),
        color: formData.color,
        isActive: formData.isActive
      }

      const validation = validateCategoryData(sanitizedData)
      if (!validation.isValid) {
        showAlert('error', validation.errors.join(', '))
        setLoading(false)
        return
      }

      const url = editingCategory 
        ? `/api/admin/categories?id=${editingCategory.id}`
        : '/api/admin/categories'
      
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      })

      if (response.ok) {
        showAlert('success', editingCategory ? 'Category updated successfully!' : 'Category created successfully!')
        loadCategories()
        handleDialogClose()
      } else {
        const errorData = await response.json()
        showAlert('error', errorData.error || 'Failed to save category')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      showAlert('error', 'An error occurred while saving the category')
    }
    setLoading(false)
  }

  const handleEdit = (category: CategoryData) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      isActive: category.isActive
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (confirm(`Are you sure you want to delete "${categoryName}"? This cannot be undone and will fail if any games use this category.`)) {
      try {
        const response = await fetch(`/api/admin/categories?id=${categoryId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          showAlert('success', 'Category deleted successfully!')
          loadCategories()
        } else {
          const errorData = await response.json()
          showAlert('error', errorData.error || 'Failed to delete category')
        }
      } catch (error) {
        console.error('Error deleting category:', error)
        showAlert('error', 'An error occurred while deleting the category')
      }
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setFormData(initialFormData)
    setEditingCategory(null)
  }

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({type, message})
    setTimeout(() => setAlert(null), 3000)
  }

  const handleAddNewCategory = () => {
    setEditingCategory(null)
    setFormData(initialFormData)
    setIsDialogOpen(true)
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
            <CardTitle>Categories Management</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNewCategory}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                  <DialogDescription>
                    {editingCategory ? 'Modify category details.' : 'Create a new game category.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="name">Category Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter category name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe this category"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="icon">Icon *</Label>
                    <div className="space-y-2">
                      <Input
                        id="icon"
                        value={formData.icon}
                        onChange={(e) => handleInputChange('icon', e.target.value)}
                        placeholder="🎮"
                        className="text-center text-xl"
                      />
                      <div className="grid grid-cols-5 gap-2">
                        {presetIcons.map((icon) => (
                          <Button
                            key={icon}
                            variant={formData.icon === icon ? 'default' : 'outline'}
                            size="sm"
                            className="text-lg p-2"
                            onClick={() => handleInputChange('icon', icon)}
                            type="button"
                          >
                            {icon}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="color">Color *</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          id="color"
                          type="color"
                          value={formData.color}
                          onChange={(e) => handleInputChange('color', e.target.value)}
                          className="w-16 h-10 p-1 border rounded cursor-pointer"
                        />
                        <Input
                          value={formData.color}
                          onChange={(e) => handleInputChange('color', e.target.value)}
                          placeholder="#3b82f6"
                          className="flex-1"
                        />
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {presetColors.map((color) => (
                          <Button
                            key={color}
                            variant={formData.color === color ? 'default' : 'outline'}
                            size="sm"
                            className="p-2"
                            style={{ backgroundColor: color, borderColor: color }}
                            onClick={() => handleInputChange('color', color)}
                            type="button"
                          >
                            <div className="w-4 h-4 rounded"></div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  
                  {/* Preview */}
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <Label className="text-sm text-gray-600">Preview:</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <span 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: formData.color }}
                      >
                        {formData.icon}
                      </span>
                      <div>
                        <div className="font-medium">{formData.name || 'Category Name'}</div>
                        <div className="text-sm text-gray-600">{formData.description || 'Category description...'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleDialogClose} disabled={loading}>Cancel</Button>
                  <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Saving...' : editingCategory ? 'Update' : 'Create'} Category
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
          </div>
          
          <div className="grid gap-4">
            {filteredCategories.map((category) => (
              <div key={category.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-xl"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          ID: {category.id}
                        </span>
                        <span className="text-xs text-gray-500" style={{ color: category.color }}>
                          {category.color}
                        </span>
                        {category.isActive && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>}
                        {!category.isActive && <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Inactive</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(category)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDelete(category.id, category.name)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No categories found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}