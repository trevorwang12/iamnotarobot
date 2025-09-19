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
import { Plus, Edit, Trash2, Star, Play, ArrowUp, ArrowDown } from "lucide-react"
import { featuredGamesManager, type FeaturedGame } from "@/lib/feature-games-manager"
import { sanitizeInput } from "@/lib/security"
import ImageUploader from "@/components/ImageUploader"

interface FeaturedGameFormData {
  name: string
  description: string
  emoji: string
  thumbnailUrl: string
  gameUrl: string
  gradient: string
  isActive: boolean
}

const initialFeaturedGameFormData: FeaturedGameFormData = {
  name: '',
  description: '',
  emoji: '🎮',
  thumbnailUrl: '',
  gameUrl: '',
  gradient: 'from-orange-400 to-pink-500',
  isActive: false
}

const gradientOptions = [
  { value: 'from-orange-400 to-pink-500', label: 'Orange to Pink', preview: 'bg-gradient-to-r from-orange-400 to-pink-500' },
  { value: 'from-blue-500 to-purple-600', label: 'Blue to Purple', preview: 'bg-gradient-to-r from-blue-500 to-purple-600' },
  { value: 'from-green-400 to-blue-500', label: 'Green to Blue', preview: 'bg-gradient-to-r from-green-400 to-blue-500' },
  { value: 'from-purple-500 to-pink-500', label: 'Purple to Pink', preview: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { value: 'from-red-500 to-orange-500', label: 'Red to Orange', preview: 'bg-gradient-to-r from-red-500 to-orange-500' },
  { value: 'from-indigo-500 to-purple-600', label: 'Indigo to Purple', preview: 'bg-gradient-to-r from-indigo-500 to-purple-600' },
  { value: 'from-yellow-400 to-orange-500', label: 'Yellow to Orange', preview: 'bg-gradient-to-r from-yellow-400 to-orange-500' },
  { value: 'from-teal-400 to-blue-500', label: 'Teal to Blue', preview: 'bg-gradient-to-r from-teal-400 to-blue-500' }
]

export default function FeaturedGamesManager() {
  const [featuredGames, setFeaturedGames] = useState<FeaturedGame[]>([])
  const [featuredGameFormData, setFeaturedGameFormData] = useState<FeaturedGameFormData>(initialFeaturedGameFormData)
  const [editingFeaturedGame, setEditingFeaturedGame] = useState<FeaturedGame | null>(null)
  const [isFeaturedGameDialogOpen, setIsFeaturedGameDialogOpen] = useState(false)
  const [alert, setAlert] = useState<{type: 'success' | 'error', message: string} | null>(null)

  useEffect(() => {
    loadFeaturedGames()
  }, [])

  const loadFeaturedGames = async () => {
    const games = await featuredGamesManager.getAllFeaturedGames()
    setFeaturedGames(games)
  }

  const handleFeaturedGameSubmit = async () => {
    try {
      const sanitizedData = {
        ...featuredGameFormData,
        name: sanitizeInput(featuredGameFormData.name),
        description: sanitizeInput(featuredGameFormData.description),
        gameUrl: featuredGameFormData.gameUrl.trim(),
        thumbnailUrl: featuredGameFormData.thumbnailUrl.trim()
      }

      if (!sanitizedData.name || !sanitizedData.description || !sanitizedData.gameUrl) {
        showAlert('error', 'Name, description, and game URL are required')
        return
      }

      if (editingFeaturedGame) {
        const updated = await featuredGamesManager.updateFeaturedGame(editingFeaturedGame.id, sanitizedData)
        if (updated) {
          showAlert('success', 'Featured game updated successfully!')
        } else {
          showAlert('error', 'Failed to update featured game')
        }
      } else {
        const newGame = await featuredGamesManager.createFeaturedGame(sanitizedData)
        if (newGame) {
          showAlert('success', 'Featured game created successfully!')
        } else {
          showAlert('error', 'Failed to create featured game')
        }
      }

      loadFeaturedGames()
      handleFeaturedGameDialogClose()
    } catch (error) {
      console.error('Error saving featured game:', error)
      showAlert('error', 'An error occurred while saving the featured game')
    }
  }

  const handleFeaturedGameEdit = (game: FeaturedGame) => {
    setEditingFeaturedGame(game)
    setFeaturedGameFormData({
      name: game.name,
      description: game.description,
      emoji: game.emoji,
      thumbnailUrl: game.thumbnailUrl,
      gameUrl: game.gameUrl,
      gradient: game.gradient,
      isActive: game.isActive
    })
    setIsFeaturedGameDialogOpen(true)
  }

  const handleFeaturedGameDelete = async (gameId: string) => {
    if (confirm('Are you sure you want to delete this featured game?')) {
      const success = await featuredGamesManager.deleteFeaturedGame(gameId)
      if (success) {
        showAlert('success', 'Featured game deleted successfully!')
        loadFeaturedGames()
      } else {
        showAlert('error', 'Failed to delete featured game')
      }
    }
  }

  const handleFeaturedGameToggle = async (gameId: string, isActive: boolean) => {
    if (isActive) {
      // When activating a game, deactivate all others first
      await featuredGamesManager.deactivateAllFeaturedGames()
      const success = await featuredGamesManager.activateFeaturedGame(gameId)
      if (success) {
        showAlert('success', 'Featured game activated successfully!')
        loadFeaturedGames()
      } else {
        showAlert('error', 'Failed to activate featured game')
      }
    } else {
      const success = await featuredGamesManager.updateFeaturedGame(gameId, { isActive: false })
      if (success) {
        showAlert('success', 'Featured game deactivated successfully!')
        loadFeaturedGames()
      } else {
        showAlert('error', 'Failed to deactivate featured game')
      }
    }
  }

  const handleMoveUp = async (gameId: string) => {
    const success = await featuredGamesManager.reorderFeaturedGame(gameId, 'up')
    if (success) {
      loadFeaturedGames()
    }
  }

  const handleMoveDown = async (gameId: string) => {
    const success = await featuredGamesManager.reorderFeaturedGame(gameId, 'down')
    if (success) {
      loadFeaturedGames()
    }
  }

  const handleFeaturedGameDialogClose = () => {
    setIsFeaturedGameDialogOpen(false)
    setFeaturedGameFormData(initialFeaturedGameFormData)
    setEditingFeaturedGame(null)
  }

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({type, message})
    setTimeout(() => setAlert(null), 3000)
  }

  const activeFeaturedGames = featuredGames.filter(game => game.isActive)
  const inactiveFeaturedGames = featuredGames.filter(game => !game.isActive)

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
            <CardTitle>Featured Games Management</CardTitle>
            <Dialog open={isFeaturedGameDialogOpen} onOpenChange={setIsFeaturedGameDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setFeaturedGameFormData(initialFeaturedGameFormData)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Featured Game
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingFeaturedGame ? 'Edit Featured Game' : 'Add New Featured Game'}</DialogTitle>
                  <DialogDescription>
                    {editingFeaturedGame ? 'Edit the featured game details and settings.' : 'Create a new featured game to highlight on the homepage.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="featuredName">Game Name *</Label>
                      <Input
                        id="featuredName"
                        value={featuredGameFormData.name}
                        onChange={(e) => setFeaturedGameFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter game name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="featuredEmoji">Emoji</Label>
                      <Input
                        id="featuredEmoji"
                        value={featuredGameFormData.emoji}
                        onChange={(e) => setFeaturedGameFormData(prev => ({ ...prev, emoji: e.target.value }))}
                        placeholder="🎮"
                        maxLength={2}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="featuredDescription">Description *</Label>
                    <Textarea
                      id="featuredDescription"
                      value={featuredGameFormData.description}
                      onChange={(e) => setFeaturedGameFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Game description"
                    />
                  </div>
                  
                  <ImageUploader
                    label="Thumbnail"
                    value={featuredGameFormData.thumbnailUrl}
                    onChange={(url) => setFeaturedGameFormData(prev => ({ ...prev, thumbnailUrl: url }))}
                    placeholder="Enter thumbnail URL or upload an image"
                  />
                  
                  <div>
                    <Label htmlFor="featuredGameUrl">Game URL *</Label>
                    <Input
                      id="featuredGameUrl"
                      value={featuredGameFormData.gameUrl}
                      onChange={(e) => setFeaturedGameFormData(prev => ({ ...prev, gameUrl: e.target.value }))}
                      placeholder="https://example.com/game or /game/slug"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="featuredGradient">Background Gradient</Label>
                    <Select 
                      value={featuredGameFormData.gradient} 
                      onValueChange={(value) => setFeaturedGameFormData(prev => ({ ...prev, gradient: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gradient" />
                      </SelectTrigger>
                      <SelectContent>
                        {gradientOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded ${option.preview}`}></div>
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featuredActive"
                      checked={featuredGameFormData.isActive}
                      onCheckedChange={(checked) => setFeaturedGameFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="featuredActive">Active (Note: Only one featured game can be active at a time)</Label>
                  </div>
                  
                  {/* Preview */}
                  <div>
                    <Label>Preview</Label>
                    <div className={`p-6 rounded-lg bg-gradient-to-r ${featuredGameFormData.gradient} text-white`}>
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl">{featuredGameFormData.emoji}</span>
                        <div>
                          <h3 className="text-xl font-bold">{featuredGameFormData.name || 'Game Name'}</h3>
                          <p className="text-sm opacity-90">{featuredGameFormData.description || 'Game description'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleFeaturedGameDialogClose}>Cancel</Button>
                  <Button onClick={handleFeaturedGameSubmit}>{editingFeaturedGame ? 'Update' : 'Add'} Featured Game</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Active Featured Game */}
            {activeFeaturedGames.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-700">Active Featured Game</h3>
                <div className="space-y-4">
                  {activeFeaturedGames.map((game, index) => (
                    <div key={game.id} className="border-2 border-green-200 rounded-lg p-4">
                      <div className={`p-4 rounded-lg bg-gradient-to-r ${game.gradient} text-white mb-4`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="text-2xl">{game.emoji}</span>
                            <div>
                              <h3 className="text-xl font-bold">{game.name}</h3>
                              <p className="text-sm opacity-90">{game.description}</p>
                            </div>
                          </div>
                          {game.thumbnailUrl && (
                            <img
                              src={game.thumbnailUrl}
                              alt={game.name}
                              className="w-16 h-16 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <div>Created: {new Date(game.createdAt).toLocaleDateString()}</div>
                          <div>Updated: {new Date(game.updatedAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" asChild>
                            <a href={game.gameUrl} target="_blank" rel="noopener noreferrer">
                              <Play className="w-4 h-4 mr-1" />
                              Play
                            </a>
                          </Button>
                          <Switch
                            checked={game.isActive}
                            onCheckedChange={(checked) => handleFeaturedGameToggle(game.id, checked)}
                          />
                          <Button size="sm" variant="outline" onClick={() => handleFeaturedGameEdit(game)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleFeaturedGameDelete(game.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Inactive Featured Games */}
            {inactiveFeaturedGames.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Inactive Featured Games</h3>
                <div className="space-y-4">
                  {inactiveFeaturedGames.map((game, index) => (
                    <div key={game.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl opacity-50">{game.emoji}</span>
                          <div>
                            <h3 className="font-semibold text-gray-800">{game.name}</h3>
                            <p className="text-sm text-gray-600">{game.description}</p>
                            <div className={`inline-block mt-1 px-2 py-1 rounded text-xs text-white bg-gradient-to-r ${game.gradient}`}>
                              {gradientOptions.find(opt => opt.value === game.gradient)?.label || 'Custom Gradient'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex flex-col space-y-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMoveUp(game.id)}
                              disabled={index === 0}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMoveDown(game.id)}
                              disabled={index === inactiveFeaturedGames.length - 1}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={game.gameUrl} target="_blank" rel="noopener noreferrer">
                              <Play className="w-4 h-4 mr-1" />
                              Play
                            </a>
                          </Button>
                          <Switch
                            checked={game.isActive}
                            onCheckedChange={(checked) => handleFeaturedGameToggle(game.id, checked)}
                          />
                          <Button size="sm" variant="outline" onClick={() => handleFeaturedGameEdit(game)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleFeaturedGameDelete(game.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {featuredGames.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No featured games created yet. Click "Add Featured Game" to create your first featured game.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}