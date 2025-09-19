import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import AdSlot from '../../components/AdSlot'
import { adManager } from '../../lib/ad-manager'

// Mock adManager
jest.mock('../../lib/ad-manager', () => ({
  adManager: {
    getAdSlot: jest.fn(),
    trackImpression: jest.fn(),
    trackClick: jest.fn(),
    isValidPosition: jest.fn(),
  },
}))

const mockAdManager = adManager as jest.Mocked<typeof adManager>

describe('AdSlot Component', () => {
  const mockAdSlot = {
    id: 'test-ad-1',
    position: 'header',
    content: '<div class="test-ad">Test Advertisement</div>',
    enabled: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockAdManager.getAdSlot.mockReturnValue(mockAdSlot)
    mockAdManager.isValidPosition.mockReturnValue(true)
  })

  test('should render ad content when ad slot is enabled', () => {
    render(<AdSlot position="header" />)
    
    expect(screen.getByText('Test Advertisement')).toBeInTheDocument()
    expect(mockAdManager.getAdSlot).toHaveBeenCalledWith('header')
  })

  test('should not render anything when ad slot is disabled', () => {
    mockAdManager.getAdSlot.mockReturnValue({
      ...mockAdSlot,
      enabled: false
    })
    
    const { container } = render(<AdSlot position="header" />)
    expect(container.firstChild).toBeNull()
  })

  test('should not render anything when ad slot does not exist', () => {
    mockAdManager.getAdSlot.mockReturnValue(null)
    
    const { container } = render(<AdSlot position="header" />)
    expect(container.firstChild).toBeNull()
  })

  test('should apply custom className', () => {
    render(<AdSlot position="header" className="custom-ad-class" />)
    
    const adContainer = screen.getByTestId('ad-slot-header')
    expect(adContainer).toHaveClass('custom-ad-class')
  })

  test('should track impression on render', () => {
    render(<AdSlot position="header" />)
    
    expect(mockAdManager.trackImpression).toHaveBeenCalledWith('header')
  })

  test('should track clicks on ad content', () => {
    mockAdManager.getAdSlot.mockReturnValue({
      ...mockAdSlot,
      content: '<div class="test-ad"><a href="https://example.com">Click here</a></div>'
    })
    
    render(<AdSlot position="header" />)
    
    const link = screen.getByRole('link', { name: 'Click here' })
    fireEvent.click(link)
    
    expect(mockAdManager.trackClick).toHaveBeenCalledWith('header')
  })

  test('should handle invalid position gracefully', () => {
    mockAdManager.isValidPosition.mockReturnValue(false)
    
    const { container } = render(<AdSlot position="invalid-position" as any />)
    expect(container.firstChild).toBeNull()
  })

  test('should render with different ad positions', () => {
    const positions = ['header', 'footer', 'sidebar', 'content-top', 'content-bottom']
    
    positions.forEach(position => {
      mockAdManager.getAdSlot.mockReturnValue({
        ...mockAdSlot,
        position: position as any,
        content: `<div>${position} ad content</div>`
      })
      
      render(<AdSlot position={position as any} />)
      expect(screen.getByText(`${position} ad content`)).toBeInTheDocument()
    })
  })

  test('should sanitize ad content for XSS protection', () => {
    mockAdManager.getAdSlot.mockReturnValue({
      ...mockAdSlot,
      content: '<script>alert("xss")</script><div>Safe content</div>'
    })
    
    render(<AdSlot position="header" />)
    
    // Should render safe content but not script tags
    expect(screen.getByText('Safe content')).toBeInTheDocument()
    expect(screen.queryByText('alert("xss")')).not.toBeInTheDocument()
  })

  test('should handle empty ad content', () => {
    mockAdManager.getAdSlot.mockReturnValue({
      ...mockAdSlot,
      content: ''
    })
    
    const { container } = render(<AdSlot position="header" />)
    expect(container.firstChild).toBeNull()
  })

  test('should handle whitespace-only ad content', () => {
    mockAdManager.getAdSlot.mockReturnValue({
      ...mockAdSlot,
      content: '   \n\t   '
    })
    
    const { container } = render(<AdSlot position="header" />)
    expect(container.firstChild).toBeNull()
  })

  test('should apply responsive classes based on position', () => {
    render(<AdSlot position="sidebar" />)
    
    const adContainer = screen.getByTestId('ad-slot-sidebar')
    expect(adContainer).toHaveClass('hidden', 'lg:block') // Sidebar should be hidden on mobile
  })

  test('should handle lazy loading for ads', () => {
    render(<AdSlot position="footer" lazy={true} />)
    
    const adContainer = screen.getByTestId('ad-slot-footer')
    expect(adContainer).toHaveAttribute('data-lazy', 'true')
  })

  test('should render placeholder when ad is loading', () => {
    render(<AdSlot position="header" showPlaceholder={true} />)
    
    expect(screen.getByText(/advertisement/i)).toBeInTheDocument()
  })

  test('should handle ad refresh functionality', () => {
    const onRefresh = jest.fn()
    
    render(<AdSlot position="header" onRefresh={onRefresh} refreshable={true} />)
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    fireEvent.click(refreshButton)
    
    expect(onRefresh).toHaveBeenCalled()
  })

  test('should respect ad preferences and consent', () => {
    // Mock user has disabled ads
    mockAdManager.getAdSlot.mockReturnValue(null)
    
    render(<AdSlot position="header" respectConsent={true} />)
    
    const { container } = render(<AdSlot position="header" />)
    expect(container.firstChild).toBeNull()
  })

  test('should handle different ad formats', () => {
    const adFormats = [
      '<img src="/banner-ad.jpg" alt="Banner Ad">',
      '<video autoplay muted><source src="/video-ad.mp4" type="video/mp4"></video>',
      '<iframe src="https://ads.example.com/ad-frame"></iframe>'
    ]
    
    adFormats.forEach((content, index) => {
      mockAdManager.getAdSlot.mockReturnValue({
        ...mockAdSlot,
        content
      })
      
      const { rerender } = render(<AdSlot position="header" key={index} />)
      
      // Should render without errors
      expect(screen.getByTestId('ad-slot-header')).toBeInTheDocument()
      
      rerender(<AdSlot position="header" key={index + 100} />)
    })
  })

  test('should handle ad block detection', () => {
    // Mock ad blocker detected
    Object.defineProperty(window, 'getComputedStyle', {
      writable: true,
      value: jest.fn().mockReturnValue({
        display: 'none'
      })
    })
    
    render(<AdSlot position="header" showAdBlockMessage={true} />)
    
    expect(screen.getByText(/ad blocker detected/i)).toBeInTheDocument()
  })

  test('should apply size constraints based on position', () => {
    const positions = [
      { position: 'header', expectedClass: 'h-24' },
      { position: 'sidebar', expectedClass: 'w-80' },
      { position: 'footer', expectedClass: 'h-32' }
    ]
    
    positions.forEach(({ position, expectedClass }) => {
      render(<AdSlot position={position as any} />)
      
      const adContainer = screen.getByTestId(`ad-slot-${position}`)
      expect(adContainer).toHaveClass(expectedClass)
    })
  })

  test('should handle ad error states', () => {
    mockAdManager.getAdSlot.mockImplementation(() => {
      throw new Error('Ad loading error')
    })
    
    render(<AdSlot position="header" showErrorMessage={true} />)
    
    expect(screen.getByText(/error loading advertisement/i)).toBeInTheDocument()
  })

  test('should support custom ad templates', () => {
    const customTemplate = (content: string) => `<div class="custom-wrapper">${content}</div>`
    
    render(<AdSlot position="header" template={customTemplate} />)
    
    const wrapper = screen.getByTestId('ad-slot-header')
    expect(wrapper.querySelector('.custom-wrapper')).toBeInTheDocument()
  })

  test('should handle ad targeting parameters', () => {
    const targeting = {
      category: 'gaming',
      audience: 'adult',
      keywords: ['puzzle', 'fun']
    }
    
    render(<AdSlot position="header" targeting={targeting} />)
    
    expect(mockAdManager.getAdSlot).toHaveBeenCalledWith('header', targeting)
  })

  test('should implement viewability tracking', () => {
    const mockIntersectionObserver = jest.fn().mockImplementation((callback) => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }))
    
    global.IntersectionObserver = mockIntersectionObserver
    
    render(<AdSlot position="header" trackViewability={true} />)
    
    expect(mockIntersectionObserver).toHaveBeenCalled()
  })

  test('should handle multiple ads in same position', () => {
    const multipleAds = [
      { ...mockAdSlot, id: 'ad-1', content: '<div>Ad 1</div>' },
      { ...mockAdSlot, id: 'ad-2', content: '<div>Ad 2</div>' }
    ]
    
    mockAdManager.getAdSlot.mockReturnValue({
      ...mockAdSlot,
      content: multipleAds.map(ad => ad.content).join('')
    })
    
    render(<AdSlot position="header" />)
    
    expect(screen.getByText('Ad 1')).toBeInTheDocument()
    expect(screen.getByText('Ad 2')).toBeInTheDocument()
  })
})