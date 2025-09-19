"use client"

import { useAdminAuth } from "@/lib/auth"
import AdminLogin from "./AdminLogin"
import AdminTabsLoader from "./admin/AdminTabsLoader"

interface GameFormData {
  name: string
  description: string
  thumbnailUrl: string
  category: string
  tags: string[]
  rating: number
  developer: string
  releaseDate: string
  gameType: 'iframe' | 'external' | 'embed'
  gameUrl: string
  externalUrl: string
  embedCode: string
  controls: string[]
  platforms: string[]
  languages: string[]
  features: string[]
  isActive: boolean
  isFeatured: boolean
}

interface AdFormData {
  name: string
  htmlContent: string
  position: 'header' | 'footer' | 'sidebar' | 'hero-bottom' | 'content-top' | 'game-details-bottom' | 'content-bottom'
  isActive: boolean
}

interface FeaturedGameFormData {
  name: string
  description: string
  emoji: string
  thumbnailUrl: string
  gameUrl: string
  gradient: string
  isActive: boolean
}

const initialFormData: GameFormData = {
  name: '',
  description: '',
  thumbnailUrl: '',
  category: '',
  tags: [],
  rating: 4.0,
  developer: '',
  releaseDate: new Date().getFullYear().toString(),
  gameType: 'iframe',
  gameUrl: '',
  externalUrl: '',
  embedCode: '',
  controls: [],
  platforms: ['web'],
  languages: ['en'],
  features: [],
  isActive: true,
  isFeatured: false
}

const initialAdFormData: AdFormData = {
  name: '',
  htmlContent: '',
  position: 'header',
  isActive: true
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

export default function AdminPanel() {
  const { isAuthenticated, isLoading, login, logout } = useAdminAuth()
  const [games, setGames] = useState<GameData[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGame, setEditingGame] = useState<GameData | null>(null)
  const [formData, setFormData] = useState<GameFormData>(initialFormData)
  const [alert, setAlert] = useState<{type: 'success' | 'error', message: string} | null>(null)
  
  // Ad management states
  const [ads, setAds] = useState<AdSlot[]>([])
  const [adFormData, setAdFormData] = useState<AdFormData>(initialAdFormData)
  const [editingAd, setEditingAd] = useState<AdSlot | null>(null)
  const [isAdDialogOpen, setIsAdDialogOpen] = useState(false)
  
  // Featured games management states
  const [featuredGames, setFeaturedGames] = useState<FeaturedGame[]>([])
  const [featuredGameFormData, setFeaturedGameFormData] = useState<FeaturedGameFormData>(initialFeaturedGameFormData)
  const [editingFeaturedGame, setEditingFeaturedGame] = useState<FeaturedGame | null>(null)
  const [isFeaturedGameDialogOpen, setIsFeaturedGameDialogOpen] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // 如果未认证，显示登录界面
  if (!isAuthenticated) {
    return <AdminLogin onLogin={login} />
  }

  const loadData = () => {
    setGames(dataManager.getAllGames())
    setCategories(dataManager.getAllCategories())
    setAds(adManager.getAllAds())
    setFeaturedGames(featuredGamesManager.getAllFeaturedGames())
  }

  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.developer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleInputChange = (field: keyof GameFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayInputChange = (field: keyof GameFormData, value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item !== '')
    setFormData(prev => ({
      ...prev,
      [field]: items
    }))
  }

  const handleSubmit = () => {
    // Rate limiting check
    const clientKey = 'admin-submit'
    if (!rateLimiter.isAllowed(clientKey, 10, 60000)) { // 10 requests per minute
      showAlert('error', 'Too many requests. Please wait before trying again.')
      return
    }

    try {
      // Sanitize input data
      const sanitizedData = {
        ...formData,
        name: sanitizeInput(formData.name),
        description: sanitizeInput(formData.description),
        developer: sanitizeInput(formData.developer),
        gameUrl: formData.gameUrl.trim(),
        externalUrl: formData.externalUrl.trim(),
        embedCode: formData.embedCode.trim()
      }

      // Validate data
      const validation = validateGameData(sanitizedData)
      if (!validation.isValid) {
        showAlert('error', validation.errors.join(', '))
        return
      }

      if (editingGame) {
        // Update existing game
        const success = dataManager.updateGame(editingGame.id, sanitizedData)
        if (success) {
          showAlert('success', 'Game updated successfully!')
          loadData()
        } else {
          showAlert('error', 'Failed to update game')
        }
      } else {
        // Add new game with secure ID generation
        const gameWithId = {
          ...sanitizedData,
          id: generateSecureId(sanitizedData.name)
        }
        const newGame = dataManager.addGame(gameWithId)
        showAlert('success', 'Game added successfully!')
        loadData()
      }
      
      handleDialogClose(false)
    } catch (error) {
      console.error('Error saving game:', error)
      showAlert('error', 'An error occurred while saving the game')
    }
  }

  const handleEdit = (game: GameData) => {
    setEditingGame(game)
    setFormData({
      name: game.name,
      description: game.description,
      thumbnailUrl: game.thumbnailUrl,
      category: game.category,
      tags: game.tags,
      rating: game.rating,
      developer: game.developer,
      releaseDate: game.releaseDate,
      gameType: game.gameType,
      gameUrl: game.gameUrl || '',
      externalUrl: game.externalUrl || '',
      embedCode: game.embedCode || '',
      controls: game.controls,
      platforms: game.platforms,
      languages: game.languages,
      features: game.features,
      isActive: game.isActive,
      isFeatured: game.isFeatured
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (gameId: string) => {
    if (confirm('Are you sure you want to delete this game?')) {
      const success = dataManager.deleteGame(gameId)
      if (success) {
        showAlert('success', 'Game deleted successfully!')
        loadData()
      } else {
        showAlert('error', 'Failed to delete game')
      }
    }
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setEditingGame(null)
  }

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({type, message})
    setTimeout(() => setAlert(null), 3000)
  }

  // Ad Management Functions
  const handleAdSubmit = () => {
    try {
      const sanitizedData = {
        ...adFormData,
        name: sanitizeInput(adFormData.name),
        htmlContent: adFormData.htmlContent.trim()
      }

      // Validate HTML content
      const validation = adManager.validateHtmlContent(sanitizedData.htmlContent)
      if (!validation.isValid) {
        showAlert('error', validation.message || 'Invalid ad content')
        return
      }

      if (editingAd) {
        const updated = adManager.updateAd(editingAd.id, sanitizedData)
        if (updated) {
          showAlert('success', 'Ad updated successfully!')
        } else {
          showAlert('error', 'Failed to update ad')
        }
      } else {
        const created = adManager.createAd(sanitizedData)
        if (created) {
          showAlert('success', 'Ad created successfully!')
        } else {
          showAlert('error', 'Failed to create ad')
        }
      }

      setIsAdDialogOpen(false)
      resetAdForm()
      loadData()
    } catch (error) {
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

  const handleAdDelete = (adId: string) => {
    if (confirm('Are you sure you want to delete this ad?')) {
      const success = adManager.deleteAd(adId)
      if (success) {
        showAlert('success', 'Ad deleted successfully!')
        loadData()
      } else {
        showAlert('error', 'Failed to delete ad')
      }
    }
  }

  const handleAdToggle = (adId: string) => {
    const updated = adManager.toggleAdStatus(adId)
    if (updated) {
      showAlert('success', `Ad ${updated.isActive ? 'enabled' : 'disabled'} successfully!`)
      loadData()
    } else {
      showAlert('error', 'Failed to update ad status')
    }
  }

  const resetAdForm = () => {
    setAdFormData(initialAdFormData)
    setEditingAd(null)
  }

  const handleAdDialogClose = (open: boolean) => {
    setIsAdDialogOpen(open)
    if (!open) {
      resetAdForm()
    }
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }

  // Featured Games Management Functions
  const handleFeaturedGameSubmit = () => {
    try {
      const sanitizedData = {
        ...featuredGameFormData,
        name: sanitizeInput(featuredGameFormData.name),
        description: sanitizeInput(featuredGameFormData.description),
        gameUrl: featuredGameFormData.gameUrl.trim()
      }

      const validation = featuredGamesManager.validateGameData(sanitizedData)
      if (!validation.isValid) {
        showAlert('error', validation.message || 'Invalid featured game data')
        return
      }

      if (editingFeaturedGame) {
        const updated = featuredGamesManager.updateFeaturedGame(editingFeaturedGame.id, sanitizedData)
        if (updated) {
          showAlert('success', 'Featured game updated successfully!')
        } else {
          showAlert('error', 'Failed to update featured game')
        }
      } else {
        const created = featuredGamesManager.createFeaturedGame(sanitizedData)
        if (created) {
          showAlert('success', 'Featured game created successfully!')
        } else {
          showAlert('error', 'Failed to create featured game')
        }
      }

      setIsFeaturedGameDialogOpen(false)
      resetFeaturedGameForm()
      loadData()
    } catch (error) {
      showAlert('error', 'An error occurred while saving the featured game')
    }
  }

  const handleFeaturedGameEdit = (featuredGame: FeaturedGame) => {
    setEditingFeaturedGame(featuredGame)
    setFeaturedGameFormData({
      name: featuredGame.name,
      description: featuredGame.description,
      emoji: featuredGame.emoji,
      thumbnailUrl: featuredGame.thumbnailUrl || '',
      gameUrl: featuredGame.gameUrl,
      gradient: featuredGame.gradient,
      isActive: featuredGame.isActive
    })
    setIsFeaturedGameDialogOpen(true)
  }

  const handleFeaturedGameDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this featured game?')) {
      const success = featuredGamesManager.deleteFeaturedGame(id)
      if (success) {
        showAlert('success', 'Featured game deleted successfully!')
        loadData()
      } else {
        showAlert('error', 'Failed to delete featured game')
      }
    }
  }

  const handleSetActiveFeaturedGame = (id: string) => {
    const success = featuredGamesManager.setActiveFeaturedGame(id)
    if (success) {
      showAlert('success', 'Featured game set as active!')
      loadData()
    } else {
      showAlert('error', 'Failed to set featured game as active')
    }
  }

  const resetFeaturedGameForm = () => {
    setFeaturedGameFormData(initialFeaturedGameFormData)
    setEditingFeaturedGame(null)
  }

  const handleFeaturedGameDialogClose = (open: boolean) => {
    setIsFeaturedGameDialogOpen(open)
    if (!open) {
      resetFeaturedGameForm()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Game Management</h1>
            <p className="text-gray-600">Manage your game collection and settings</p>
          </div>
          <Button variant="outline" onClick={logout} className="text-red-600 border-red-600 hover:bg-red-50">
            Logout
          </Button>
        </div>

        {alert && (
          <Alert className={`mb-4 ${alert.type === 'success' ? 'border-green-500' : 'border-red-500'}`}>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="games" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="featured">Featured Games</TabsTrigger>
            <TabsTrigger value="ads">Ad Management</TabsTrigger>
            <TabsTrigger value="seo">SEO Settings</TabsTrigger>
            <TabsTrigger value="homepage">Homepage Content</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="games">
            <Tabs defaultValue="all-games" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all-games">All Games</TabsTrigger>
                <TabsTrigger value="hot-games">Hot Games</TabsTrigger>
                <TabsTrigger value="new-games">New Games</TabsTrigger>
                <TabsTrigger value="recommended">You Might Also Like</TabsTrigger>
              </TabsList>

              <TabsContent value="all-games">
                <div className="space-y-6">
              {/* Controls */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search games..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Game
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{editingGame ? 'Edit Game' : 'Add New Game'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Game Name *</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              placeholder="Enter game name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="developer">Developer *</Label>
                            <Input
                              id="developer"
                              value={formData.developer}
                              onChange={(e) => handleInputChange('developer', e.target.value)}
                              placeholder="Enter developer name"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                              id="description"
                              value={formData.description}
                              onChange={(e) => handleInputChange('description', e.target.value)}
                              placeholder="Enter game description"
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="category">Category *</Label>
                            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map(category => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="gameType">Game Type *</Label>
                            <Select value={formData.gameType} onValueChange={(value) => handleInputChange('gameType', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select game type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="iframe">Iframe</SelectItem>
                                <SelectItem value="external">External Link</SelectItem>
                                <SelectItem value="embed">Embed Code</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                            <Input
                              id="thumbnailUrl"
                              value={formData.thumbnailUrl}
                              onChange={(e) => handleInputChange('thumbnailUrl', e.target.value)}
                              placeholder="Enter thumbnail URL"
                            />
                          </div>
                          <div>
                            <Label htmlFor="rating">Rating (1-5)</Label>
                            <Input
                              id="rating"
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              value={formData.rating}
                              onChange={(e) => handleInputChange('rating', parseFloat(e.target.value))}
                            />
                          </div>
                          {formData.gameType === 'iframe' && (
                            <div className="md:col-span-2">
                              <Label htmlFor="gameUrl">Game URL (iframe) *</Label>
                              <Input
                                id="gameUrl"
                                value={formData.gameUrl}
                                onChange={(e) => handleInputChange('gameUrl', e.target.value)}
                                placeholder="Enter iframe URL"
                              />
                            </div>
                          )}
                          {formData.gameType === 'external' && (
                            <div className="md:col-span-2">
                              <Label htmlFor="externalUrl">External URL *</Label>
                              <Input
                                id="externalUrl"
                                value={formData.externalUrl}
                                onChange={(e) => handleInputChange('externalUrl', e.target.value)}
                                placeholder="Enter external URL"
                              />
                            </div>
                          )}
                          {formData.gameType === 'embed' && (
                            <div className="md:col-span-2">
                              <Label htmlFor="embedCode">Embed Code *</Label>
                              <Textarea
                                id="embedCode"
                                value={formData.embedCode}
                                onChange={(e) => handleInputChange('embedCode', e.target.value)}
                                placeholder="Enter embed code"
                                rows={3}
                              />
                            </div>
                          )}
                          <div>
                            <Label htmlFor="releaseDate">Release Year</Label>
                            <Input
                              id="releaseDate"
                              value={formData.releaseDate}
                              onChange={(e) => handleInputChange('releaseDate', e.target.value)}
                              placeholder="2025"
                            />
                          </div>
                          <div>
                            <Label htmlFor="tags">Tags (comma separated)</Label>
                            <Input
                              id="tags"
                              value={formData.tags.join(', ')}
                              onChange={(e) => handleArrayInputChange('tags', e.target.value)}
                              placeholder="puzzle, fun, casual"
                            />
                          </div>
                          <div>
                            <Label htmlFor="controls">Controls (comma separated)</Label>
                            <Input
                              id="controls"
                              value={formData.controls.join(', ')}
                              onChange={(e) => handleArrayInputChange('controls', e.target.value)}
                              placeholder="mouse, keyboard, touch"
                            />
                          </div>
                          <div>
                            <Label htmlFor="platforms">Platforms (comma separated)</Label>
                            <Input
                              id="platforms"
                              value={formData.platforms.join(', ')}
                              onChange={(e) => handleArrayInputChange('platforms', e.target.value)}
                              placeholder="web, mobile"
                            />
                          </div>
                          <div>
                            <Label htmlFor="languages">Languages (comma separated)</Label>
                            <Input
                              id="languages"
                              value={formData.languages.join(', ')}
                              onChange={(e) => handleArrayInputChange('languages', e.target.value)}
                              placeholder="en, es, fr"
                            />
                          </div>
                          <div>
                            <Label htmlFor="features">Features (comma separated)</Label>
                            <Input
                              id="features"
                              value={formData.features.join(', ')}
                              onChange={(e) => handleArrayInputChange('features', e.target.value)}
                              placeholder="multiplayer, achievements"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="isActive"
                              checked={formData.isActive}
                              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                            />
                            <Label htmlFor="isActive">Active</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="isFeatured"
                              checked={formData.isFeatured}
                              onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                            />
                            <Label htmlFor="isFeatured">Featured</Label>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => handleDialogClose(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSubmit}>
                            {editingGame ? 'Update' : 'Add'} Game
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Games List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGames.map(game => (
                  <Card key={game.id} className="overflow-hidden">
                    <div className="relative h-32 bg-gradient-to-br from-blue-400 to-purple-600">
                      {game.thumbnailUrl && (
                        <img
                          src={game.thumbnailUrl}
                          alt={game.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {game.isFeatured && (
                          <Badge className="bg-yellow-500 text-white">Featured</Badge>
                        )}
                        {!game.isActive && (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg truncate">{game.name}</h3>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{game.rating}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{game.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {game.developer}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {game.releaseDate}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {dataManager.formatPlayCount(game.viewCount)} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Play className="w-3 h-3" />
                          {dataManager.formatPlayCount(game.playCount)} plays
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        <Badge variant="secondary" className="text-xs">{game.category}</Badge>
                        {game.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" size="sm" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(game)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(game.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredGames.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No games found matching your criteria.</p>
                  </CardContent>
                </Card>
              )}
                </div>
              </TabsContent>

              <TabsContent value="hot-games">
                <Card>
                  <CardHeader>
                    <CardTitle>Hot Games Management</CardTitle>
                    <p className="text-sm text-gray-600">
                      Hot games are automatically sorted by view count. You can manually feature games by adjusting their view counts.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {dataManager.getHotGames(10).map((game: any) => (
                        <div key={game.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <img 
                            src={game.thumbnailUrl || '/placeholder.svg'} 
                            alt={game.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium">{game.name}</h3>
                            <p className="text-sm text-gray-600">Rating: {game.rating}</p>
                          </div>
                          <Badge variant="secondary">
                            Hot Game
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="new-games">
                <Card>
                  <CardHeader>
                    <CardTitle>New Games Management</CardTitle>
                    <p className="text-sm text-gray-600">
                      New games are automatically sorted by addition date. Games added recently appear first.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {dataManager.getNewGames(10).map((game: any) => (
                        <div key={game.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <img 
                            src={game.thumbnailUrl || '/placeholder.svg'} 
                            alt={game.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium">{game.name}</h3>
                            <p className="text-sm text-gray-600">Rating: {game.rating}</p>
                          </div>
                          <Badge variant="outline">
                            New Game
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recommended">
                <RecommendedGamesManager />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="featured">
            <div className="space-y-6">
              {/* Featured Games Management Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Featured Games Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600">Manage the featured game displayed on the homepage hero section</p>
                    <Dialog open={isFeaturedGameDialogOpen} onOpenChange={handleFeaturedGameDialogClose}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Featured Game
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{editingFeaturedGame ? 'Edit Featured Game' : 'Create New Featured Game'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="featured-name">Game Name *</Label>
                            <Input
                              id="featured-name"
                              value={featuredGameFormData.name}
                              onChange={(e) => setFeaturedGameFormData({...featuredGameFormData, name: e.target.value})}
                              placeholder="Enter game name (e.g., CHILL GUY CLICKER)"
                            />
                          </div>
                          <div>
                            <Label htmlFor="featured-description">Description *</Label>
                            <Textarea
                              id="featured-description"
                              value={featuredGameFormData.description}
                              onChange={(e) => setFeaturedGameFormData({...featuredGameFormData, description: e.target.value})}
                              placeholder="Enter game description"
                              rows={3}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="featured-emoji">Emoji</Label>
                              <Input
                                id="featured-emoji"
                                value={featuredGameFormData.emoji}
                                onChange={(e) => setFeaturedGameFormData({...featuredGameFormData, emoji: e.target.value})}
                                placeholder="😎"
                                maxLength={2}
                              />
                            </div>
                            <div>
                              <Label htmlFor="featured-gradient">Gradient Style</Label>
                              <Select 
                                value={featuredGameFormData.gradient} 
                                onValueChange={(value) => setFeaturedGameFormData({...featuredGameFormData, gradient: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {featuredGamesManager.getGradientOptions().map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="featured-thumbnail">Thumbnail URL (Optional)</Label>
                            <Input
                              id="featured-thumbnail"
                              value={featuredGameFormData.thumbnailUrl}
                              onChange={(e) => setFeaturedGameFormData({...featuredGameFormData, thumbnailUrl: e.target.value})}
                              placeholder="Enter thumbnail URL"
                            />
                          </div>
                          <div>
                            <Label htmlFor="featured-url">Game URL (iframe) *</Label>
                            <Input
                              id="featured-url"
                              value={featuredGameFormData.gameUrl}
                              onChange={(e) => setFeaturedGameFormData({...featuredGameFormData, gameUrl: e.target.value})}
                              placeholder="Enter iframe-compatible game URL"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Enter a URL that can be embedded in an iframe (e.g., CrazyGames embed URLs)
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="featured-active"
                              checked={featuredGameFormData.isActive}
                              onCheckedChange={(checked) => setFeaturedGameFormData({...featuredGameFormData, isActive: checked})}
                            />
                            <Label htmlFor="featured-active">Set as Active Featured Game</Label>
                            <p className="text-sm text-gray-500 ml-2">
                              (Only one featured game can be active at a time)
                            </p>
                          </div>
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline" onClick={() => setIsFeaturedGameDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleFeaturedGameSubmit}>
                              {editingFeaturedGame ? 'Update' : 'Create'} Featured Game
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Featured Games List */}
              <Card>
                <CardHeader>
                  <CardTitle>Featured Games</CardTitle>
                </CardHeader>
                <CardContent>
                  {featuredGames.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No featured games created yet</p>
                  ) : (
                    <div className="space-y-4">
                      {featuredGames.map((featuredGame) => (
                        <div key={featuredGame.id} className="border rounded-lg overflow-hidden">
                          <div className={`bg-gradient-to-r ${featuredGame.gradient} p-6 text-white`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                                  {featuredGame.emoji}
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold">{featuredGame.name}</h3>
                                  <p className="opacity-90">{featuredGame.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {featuredGame.isActive && (
                                  <Badge className="bg-white text-green-600">ACTIVE</Badge>
                                )}
                                {!featuredGame.isActive && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSetActiveFeaturedGame(featuredGame.id)}
                                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                                  >
                                    Set Active
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-white">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm text-gray-600">
                                Created: {new Date(featuredGame.createdAt).toLocaleDateString()}
                                {featuredGame.updatedAt !== featuredGame.createdAt && (
                                  <span className="ml-2">| Updated: {new Date(featuredGame.updatedAt).toLocaleDateString()}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleFeaturedGameEdit(featuredGame)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleFeaturedGameDelete(featuredGame.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-sm">
                              <p className="font-medium">Game URL:</p>
                              <p className="text-gray-600 break-all">{featuredGame.gameUrl}</p>
                              {featuredGame.thumbnailUrl && (
                                <div className="mt-2">
                                  <p className="font-medium">Thumbnail:</p>
                                  <img 
                                    src={featuredGame.thumbnailUrl} 
                                    alt={featuredGame.name}
                                    className="w-20 h-15 object-cover rounded mt-1"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ads">
            <div className="space-y-6">
              {/* Ad Management Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Ad Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600">Manage advertisement slots displayed across the website</p>
                    <Dialog open={isAdDialogOpen} onOpenChange={handleAdDialogClose}>
                      <DialogTrigger asChild>
                        <Button onClick={() => setIsAdDialogOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Ad
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{editingAd ? 'Edit Ad' : 'Create New Ad'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="ad-name">Ad Name</Label>
                            <Input
                              id="ad-name"
                              value={adFormData.name}
                              onChange={(e) => setAdFormData({...adFormData, name: e.target.value})}
                              placeholder="Enter ad name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="ad-position">Position</Label>
                            <Select value={adFormData.position} onValueChange={(value: 'header' | 'footer' | 'sidebar' | 'hero-bottom' | 'content-top' | 'game-details-bottom' | 'content-bottom') => setAdFormData({...adFormData, position: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="header">Header (Below Navigation)</SelectItem>
                                <SelectItem value="hero-bottom">Hero Bottom (After Featured Game)</SelectItem>
                                <SelectItem value="content-top">Content Top (Before New Games)</SelectItem>
                                <SelectItem value="content-bottom">Content Bottom (After New Games)</SelectItem>
                                <SelectItem value="game-details-bottom">Game Details Bottom (Game Page Only)</SelectItem>
                                <SelectItem value="sidebar">Sidebar</SelectItem>
                                <SelectItem value="footer">Footer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="ad-active"
                              checked={adFormData.isActive}
                              onCheckedChange={(checked) => setAdFormData({...adFormData, isActive: checked})}
                            />
                            <Label htmlFor="ad-active">Active</Label>
                          </div>
                          <div>
                            <Label htmlFor="ad-content">HTML Content</Label>
                            <Textarea
                              id="ad-content"
                              value={adFormData.htmlContent}
                              onChange={(e) => setAdFormData({...adFormData, htmlContent: e.target.value})}
                              placeholder="Enter HTML ad code"
                              rows={10}
                              className="font-mono text-sm"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Enter your ad HTML code. Scripts and unsafe elements will be filtered out.
                            </p>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsAdDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleAdSubmit}>
                              {editingAd ? 'Update' : 'Create'} Ad
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Ad List */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Ads</CardTitle>
                </CardHeader>
                <CardContent>
                  {ads.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No ads created yet</p>
                  ) : (
                    <div className="space-y-4">
                      {ads.map((ad) => (
                        <div key={ad.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{ad.name}</h3>
                              <Badge variant={
                                ad.position === 'header' ? 'default' : 
                                ad.position === 'hero-bottom' ? 'destructive' : 
                                ad.position === 'content-top' ? 'secondary' : 
                                ad.position === 'content-bottom' ? 'secondary' : 
                                ad.position === 'game-details-bottom' ? 'outline' :
                                ad.position === 'footer' ? 'secondary' : 'outline'
                              }>
                                {ad.position === 'hero-bottom' ? 'Hero Bottom' :
                                 ad.position === 'content-top' ? 'Content Top' :
                                 ad.position === 'content-bottom' ? 'Content Bottom' :
                                 ad.position === 'game-details-bottom' ? 'Game Details Bottom' :
                                 ad.position}
                              </Badge>
                              <Badge variant={ad.isActive ? 'default' : 'secondary'}>
                                {ad.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAdToggle(ad.id)}
                              >
                                {ad.isActive ? 'Disable' : 'Enable'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAdEdit(ad)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAdDelete(ad.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            Created: {new Date(ad.createdAt).toLocaleDateString()}
                          </div>
                          <div className="bg-gray-50 p-3 rounded text-sm">
                            <p className="font-medium mb-1">HTML Content Preview:</p>
                            <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded border max-h-32 overflow-y-auto">
                              {ad.htmlContent}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="seo">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    SEO & Meta Settings
                  </CardTitle>
                  <p className="text-gray-600">
                    Manage search engine optimization settings for your gaming website
                  </p>
                </CardHeader>
              </Card>
              <SEOManager />
            </div>
          </TabsContent>

          <TabsContent value="homepage">
            <HomepageManager />
          </TabsContent>

          <TabsContent value="statistics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Games</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{games.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Featured Games</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{games.filter(g => g.isFeatured).length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dataManager.formatPlayCount(games.reduce((total, game) => total + game.viewCount, 0))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dataManager.formatPlayCount(games.reduce((total, game) => total + game.playCount, 0))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}