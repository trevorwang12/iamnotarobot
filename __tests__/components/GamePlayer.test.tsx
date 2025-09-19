import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GamePlayer from '../../components/GamePlayer'

// Mock dataManager
jest.mock('../../lib/data-manager', () => ({
  dataManager: {
    updateGameViews: jest.fn(),
    updateGamePlayCount: jest.fn(),
  },
}))

describe('GamePlayer Component', () => {
  const defaultProps = {
    gameUrl: 'https://example.com/test-game',
    gameName: 'Test Game',
    gameId: 'test-game-1'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should render game player with iframe', () => {
    render(<GamePlayer {...defaultProps} />)
    
    const iframe = screen.getByTitle('Test Game')
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute('src', 'https://example.com/test-game')
  })

  test('should render with custom width and height', () => {
    render(<GamePlayer {...defaultProps} width="800" height="600" />)
    
    const gameContainer = screen.getByTestId('game-container')
    expect(gameContainer).toHaveStyle({
      width: '800px',
      height: '600px'
    })
  })

  test('should show controls when showControls is true', () => {
    render(<GamePlayer {...defaultProps} showControls={true} />)
    
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument()
  })

  test('should hide controls when showControls is false', () => {
    render(<GamePlayer {...defaultProps} showControls={false} />)
    
    expect(screen.queryByRole('button', { name: /play/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /pause/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /mute/i })).not.toBeInTheDocument()
  })

  test('should show fullscreen button when allowFullscreen is true', () => {
    render(<GamePlayer {...defaultProps} allowFullscreen={true} showControls={true} />)
    
    expect(screen.getByRole('button', { name: /fullscreen/i })).toBeInTheDocument()
  })

  test('should hide fullscreen button when allowFullscreen is false', () => {
    render(<GamePlayer {...defaultProps} allowFullscreen={false} showControls={true} />)
    
    expect(screen.queryByRole('button', { name: /fullscreen/i })).not.toBeInTheDocument()
  })

  test('should handle play/pause functionality', async () => {
    const user = userEvent.setup()
    render(<GamePlayer {...defaultProps} showControls={true} />)
    
    const playButton = screen.getByRole('button', { name: /play/i })
    const pauseButton = screen.getByRole('button', { name: /pause/i })
    
    // Initially should show play button
    expect(playButton).toBeVisible()
    
    await user.click(playButton)
    
    // After clicking play, should show pause button
    expect(pauseButton).toBeVisible()
    
    await user.click(pauseButton)
    
    // After clicking pause, should show play button again
    expect(playButton).toBeVisible()
  })

  test('should handle mute/unmute functionality', async () => {
    const user = userEvent.setup()
    render(<GamePlayer {...defaultProps} showControls={true} />)
    
    const muteButton = screen.getByRole('button', { name: /mute/i })
    
    await user.click(muteButton)
    
    // Should toggle mute state
    expect(muteButton).toHaveAttribute('aria-pressed', 'true')
  })

  test('should enter fullscreen mode', async () => {
    const user = userEvent.setup()
    
    // Mock fullscreen API
    const mockRequestFullscreen = jest.fn()
    const mockExitFullscreen = jest.fn()
    
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: null
    })
    
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      writable: true,
      value: mockRequestFullscreen
    })
    
    Object.defineProperty(document, 'exitFullscreen', {
      writable: true,
      value: mockExitFullscreen
    })
    
    render(<GamePlayer {...defaultProps} allowFullscreen={true} showControls={true} />)
    
    const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i })
    await user.click(fullscreenButton)
    
    expect(mockRequestFullscreen).toHaveBeenCalled()
  })

  test('should display loading state initially', () => {
    render(<GamePlayer {...defaultProps} />)
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  test('should hide loading state after iframe loads', async () => {
    render(<GamePlayer {...defaultProps} />)
    
    const iframe = screen.getByTitle('Test Game')
    fireEvent.load(iframe)
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })

  test('should handle iframe load error', async () => {
    render(<GamePlayer {...defaultProps} />)
    
    const iframe = screen.getByTitle('Test Game')
    fireEvent.error(iframe)
    
    await waitFor(() => {
      expect(screen.getByText(/error loading game/i)).toBeInTheDocument()
    })
  })

  test('should update game views and play count on load', async () => {
    const { dataManager } = require('@/lib/data-manager')
    
    render(<GamePlayer {...defaultProps} />)
    
    const iframe = screen.getByTitle('Test Game')
    fireEvent.load(iframe)
    
    await waitFor(() => {
      expect(dataManager.updateGameViews).toHaveBeenCalledWith('test-game-1')
      expect(dataManager.updateGamePlayCount).toHaveBeenCalledWith('test-game-1')
    })
  })

  test('should handle keyboard shortcuts', async () => {
    const user = userEvent.setup()
    render(<GamePlayer {...defaultProps} showControls={true} />)
    
    const gameContainer = screen.getByTestId('game-container')
    
    // Focus the container
    gameContainer.focus()
    
    // Test spacebar for play/pause
    await user.keyboard(' ')
    
    // Should toggle play/pause state
    const pauseButton = screen.getByRole('button', { name: /pause/i })
    expect(pauseButton).toBeVisible()
  })

  test('should handle resize functionality', () => {
    render(<GamePlayer {...defaultProps} allowResize={true} showControls={true} />)
    
    expect(screen.getByRole('button', { name: /resize/i })).toBeInTheDocument()
  })

  test('should display game title in iframe title attribute', () => {
    render(<GamePlayer {...defaultProps} />)
    
    const iframe = screen.getByTitle('Test Game')
    expect(iframe).toBeInTheDocument()
  })

  test('should handle custom className', () => {
    render(<GamePlayer {...defaultProps} className="custom-player" />)
    
    const gameContainer = screen.getByTestId('game-container')
    expect(gameContainer).toHaveClass('custom-player')
  })

  test('should handle iframe security attributes', () => {
    render(<GamePlayer {...defaultProps} />)
    
    const iframe = screen.getByTitle('Test Game')
    expect(iframe).toHaveAttribute('sandbox')
    expect(iframe).toHaveAttribute('allow')
  })

  test('should handle autoplay setting', () => {
    render(<GamePlayer {...defaultProps} autoPlay={true} />)
    
    // Should not show initial play button if autoplay is enabled
    expect(screen.queryByRole('button', { name: /play/i })).not.toBeInTheDocument()
  })

  test('should handle volume control', async () => {
    const user = userEvent.setup()
    render(<GamePlayer {...defaultProps} showControls={true} />)
    
    const volumeSlider = screen.getByRole('slider', { name: /volume/i })
    expect(volumeSlider).toBeInTheDocument()
    
    await user.click(volumeSlider)
    
    // Should be able to adjust volume
    expect(volumeSlider).toHaveAttribute('aria-valuenow')
  })

  test('should handle quality selection', () => {
    render(<GamePlayer {...defaultProps} showControls={true} allowQualitySelection={true} />)
    
    expect(screen.getByRole('button', { name: /quality/i })).toBeInTheDocument()
  })

  test('should display game information panel when enabled', () => {
    render(<GamePlayer {...defaultProps} showGameInfo={true} />)
    
    expect(screen.getByText('Test Game')).toBeInTheDocument()
  })

  test('should handle pause on visibility change', () => {
    render(<GamePlayer {...defaultProps} pauseOnBlur={true} showControls={true} />)
    
    // Simulate page visibility change
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: true
    })
    
    fireEvent(document, new Event('visibilitychange'))
    
    // Should show play button (indicating game was paused)
    expect(screen.getByRole('button', { name: /play/i })).toBeVisible()
  })

  test('should handle invalid game URL gracefully', () => {
    render(<GamePlayer {...defaultProps} gameUrl="invalid-url" />)
    
    expect(screen.getByText(/invalid game url/i)).toBeInTheDocument()
  })

  test('should respect aspect ratio when set', () => {
    render(<GamePlayer {...defaultProps} aspectRatio="16:9" />)
    
    const gameContainer = screen.getByTestId('game-container')
    expect(gameContainer).toHaveStyle({
      aspectRatio: '16/9'
    })
  })

  test('should handle mobile-specific controls', () => {
    // Mock mobile detection
    Object.defineProperty(window.navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'
    })
    
    render(<GamePlayer {...defaultProps} showControls={true} />)
    
    // Should show mobile-optimized controls
    expect(screen.getByTestId('mobile-controls')).toBeInTheDocument()
  })
})