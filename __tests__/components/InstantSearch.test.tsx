import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InstantSearch from '../../components/InstantSearch'
import { dataManager } from '../../lib/data-manager'

// Mock the data manager
jest.mock('../../lib/data-manager', () => ({
  dataManager: {
    searchGames: jest.fn(),
  },
}))

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('InstantSearch Component', () => {
  const mockSearchGames = dataManager.searchGames as jest.MockedFunction<typeof dataManager.searchGames>

  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchGames.mockReturnValue([
      {
        id: 'test-game-1',
        name: 'Test Game 1',
        description: 'A test game for testing',
        category: 'puzzle',
        rating: 4.5,
        thumbnailUrl: '/test1.png',
        developer: 'Test Dev',
        tags: ['test', 'puzzle'],
        releaseDate: '2025',
        addedDate: '2025-01-01',
        viewCount: 1000,
        playCount: 500,
        gameType: 'iframe',
        gameUrl: 'https://example.com/game1',
        controls: ['mouse'],
        platforms: ['web'],
        languages: ['en'],
        features: ['single-player'],
        isActive: true,
        isFeatured: false
      },
      {
        id: 'test-game-2',
        name: 'Test Game 2',
        description: 'Another test game',
        category: 'action',
        rating: 4.0,
        thumbnailUrl: '/test2.png',
        developer: 'Test Dev 2',
        tags: ['test', 'action'],
        releaseDate: '2025',
        addedDate: '2025-01-01',
        viewCount: 800,
        playCount: 400,
        gameType: 'iframe',
        gameUrl: 'https://example.com/game2',
        controls: ['keyboard'],
        platforms: ['web'],
        languages: ['en'],
        features: ['multiplayer'],
        isActive: true,
        isFeatured: true
      }
    ])
  })

  test('should render search input with default placeholder', () => {
    render(<InstantSearch />)
    
    const searchInput = screen.getByPlaceholderText('Search games...')
    expect(searchInput).toBeInTheDocument()
  })

  test('should render search input with custom placeholder', () => {
    const customPlaceholder = 'Find your game...'
    render(<InstantSearch placeholder={customPlaceholder} />)
    
    const searchInput = screen.getByPlaceholderText(customPlaceholder)
    expect(searchInput).toBeInTheDocument()
  })

  test('should show search results when typing', async () => {
    const user = userEvent.setup()
    render(<InstantSearch />)
    
    const searchInput = screen.getByPlaceholderText('Search games...')
    
    await user.type(searchInput, 'test')
    
    expect(mockSearchGames).toHaveBeenCalledWith('test', 8)
    
    await waitFor(() => {
      expect(screen.getByText('Test Game 1')).toBeInTheDocument()
      expect(screen.getByText('Test Game 2')).toBeInTheDocument()
    })
  })

  test('should limit search results based on maxResults prop', async () => {
    const user = userEvent.setup()
    render(<InstantSearch maxResults={1} />)
    
    const searchInput = screen.getByPlaceholderText('Search games...')
    
    await user.type(searchInput, 'test')
    
    expect(mockSearchGames).toHaveBeenCalledWith('test', 1)
  })

  test('should not show results for empty search', async () => {
    const user = userEvent.setup()
    render(<InstantSearch />)
    
    const searchInput = screen.getByPlaceholderText('Search games...')
    
    // Type and then clear
    await user.type(searchInput, 'test')
    await user.clear(searchInput)
    
    expect(mockSearchGames).toHaveBeenCalledWith('test', 8)
    
    // Should not show dropdown for empty search
    expect(screen.queryByText('Test Game 1')).not.toBeInTheDocument()
  })

  test('should show "no results" message when no games found', async () => {
    const user = userEvent.setup()
    mockSearchGames.mockReturnValue([])
    
    render(<InstantSearch />)
    
    const searchInput = screen.getByPlaceholderText('Search games...')
    
    await user.type(searchInput, 'nonexistent')
    
    await waitFor(() => {
      expect(screen.getByText(/No games found for "nonexistent"/)).toBeInTheDocument()
    })
  })

  test('should navigate to game page when clicking on a result', async () => {
    const user = userEvent.setup()
    render(<InstantSearch />)
    
    const searchInput = screen.getByPlaceholderText('Search games...')
    
    await user.type(searchInput, 'test')
    
    await waitFor(() => {
      expect(screen.getByText('Test Game 1')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('Test Game 1'))
    
    expect(mockPush).toHaveBeenCalledWith('/game/test-game-1')
  })

  test('should clear search when clicking clear button', async () => {
    const user = userEvent.setup()
    render(<InstantSearch />)
    
    const searchInput = screen.getByPlaceholderText('Search games...')
    
    await user.type(searchInput, 'test')
    
    // Wait for clear button to appear
    await waitFor(() => {
      const clearButton = screen.getByLabelText('Clear search')
      expect(clearButton).toBeInTheDocument()
    })
    
    const clearButton = screen.getByLabelText('Clear search')
    await user.click(clearButton)
    
    expect(searchInput).toHaveValue('')
  })

  test('should handle keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<InstantSearch />)
    
    const searchInput = screen.getByPlaceholderText('Search games...')
    
    await user.type(searchInput, 'test')
    
    await waitFor(() => {
      expect(screen.getByText('Test Game 1')).toBeInTheDocument()
    })
    
    // Press down arrow to select first item
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' })
    
    // Press enter to navigate to selected game
    fireEvent.keyDown(searchInput, { key: 'Enter' })
    
    expect(mockPush).toHaveBeenCalledWith('/game/test-game-1')
  })

  test('should navigate to search page when pressing enter without selection', async () => {
    const user = userEvent.setup()
    render(<InstantSearch />)
    
    const searchInput = screen.getByPlaceholderText('Search games...')
    
    await user.type(searchInput, 'test')
    
    await waitFor(() => {
      expect(screen.getByText('Test Game 1')).toBeInTheDocument()
    })
    
    // Press enter without selecting any item
    fireEvent.keyDown(searchInput, { key: 'Enter' })
    
    expect(mockPush).toHaveBeenCalledWith('/search?q=test')
  })

  test('should close dropdown when pressing escape', async () => {
    const user = userEvent.setup()
    render(<InstantSearch />)
    
    const searchInput = screen.getByPlaceholderText('Search games...')
    
    await user.type(searchInput, 'test')
    
    await waitFor(() => {
      expect(screen.getByText('Test Game 1')).toBeInTheDocument()
    })
    
    // Press escape
    fireEvent.keyDown(searchInput, { key: 'Escape' })
    
    // Results should be hidden
    expect(screen.queryByText('Test Game 1')).not.toBeInTheDocument()
  })

  test('should show "View all results" link when reaching maxResults', async () => {
    const user = userEvent.setup()
    
    // Mock more results than maxResults
    const manyResults = Array.from({ length: 10 }, (_, i) => ({
      id: `test-game-${i}`,
      name: `Test Game ${i}`,
      description: 'A test game',
      category: 'puzzle',
      rating: 4.0,
      thumbnailUrl: '/test.png',
      developer: 'Test Dev',
      tags: ['test'],
      releaseDate: '2025',
      addedDate: '2025-01-01',
      viewCount: 100,
      playCount: 50,
      gameType: 'iframe' as const,
      gameUrl: 'https://example.com/game',
      controls: ['mouse'],
      platforms: ['web'],
      languages: ['en'],
      features: ['single-player'],
      isActive: true,
      isFeatured: false
    }))
    
    mockSearchGames.mockReturnValue(manyResults.slice(0, 8)) // maxResults = 8
    
    render(<InstantSearch maxResults={8} />)
    
    const searchInput = screen.getByPlaceholderText('Search games...')
    
    await user.type(searchInput, 'test')
    
    await waitFor(() => {
      expect(screen.getByText(/View all results for "test"/)).toBeInTheDocument()
    })
    
    await user.click(screen.getByText(/View all results for "test"/))
    
    expect(mockPush).toHaveBeenCalledWith('/search?q=test')
  })

  test('should apply custom className', () => {
    const customClass = 'custom-search-class'
    render(<InstantSearch className={customClass} />)
    
    const searchContainer = screen.getByPlaceholderText('Search games...').closest('div')
    expect(searchContainer).toHaveClass(customClass)
  })

  test('should display game metadata in results', async () => {
    const user = userEvent.setup()
    render(<InstantSearch />)
    
    const searchInput = screen.getByPlaceholderText('Search games...')
    
    await user.type(searchInput, 'test')
    
    await waitFor(() => {
      expect(screen.getByText('Test Game 1')).toBeInTheDocument()
      expect(screen.getByText('puzzle')).toBeInTheDocument()
      expect(screen.getByText('⭐ 4.5')).toBeInTheDocument()
    })
  })
})