import { render, screen, fireEvent } from '@testing-library/react'
import { ContentCard } from '@/components/content/ContentCard'
import { renderWithProviders, createMockContent } from '../../utils/testUtils'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      prefetch: jest.fn(),
    }
  },
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      prefetch: jest.fn(),
    }
  },
}))

describe('ContentCard Component', () => {
  const mockContent = createMockContent()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders content card with correct information', () => {
    renderWithProviders(<ContentCard item={mockContent} />)

    expect(screen.getByText(mockContent.title)).toBeInTheDocument()
    expect(screen.getByAltText(mockContent.title)).toBeInTheDocument()
  })

  it('displays rating match percentage', () => {
    const contentWithRating = { ...mockContent, rating: 8.5 }
    
    renderWithProviders(<ContentCard item={contentWithRating} />)

    expect(screen.getByText('85% Match')).toBeInTheDocument()
  })

  it('shows release year when available', () => {
    const contentWithDate = { ...mockContent, releaseDate: '2024-01-01' }
    
    renderWithProviders(<ContentCard item={contentWithDate} />)

    expect(screen.getByText('2024')).toBeInTheDocument()
  })

  it('shows "New" badge for recent content', () => {
    const recentContent = { 
      ...mockContent, 
      releaseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
    }
    
    renderWithProviders(<ContentCard item={recentContent} />)

    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('shows "Coming Soon" badge for future content', () => {
    const futureContent = { 
      ...mockContent, 
      releaseDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days in future
    }
    
    renderWithProviders(<ContentCard item={futureContent} />)

    expect(screen.getByText('Coming Soon')).toBeInTheDocument()
  })

  it('shows "New Episode" badge for content with recent episodes', () => {
    const contentWithNewEpisode = { 
      ...mockContent, 
      lastAirDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    }
    
    renderWithProviders(<ContentCard item={contentWithNewEpisode} />)

    expect(screen.getByText('New Episode')).toBeInTheDocument()
  })

  it('applies correct aspect ratio classes', () => {
    const { rerender } = renderWithProviders(
      <ContentCard item={mockContent} />
    )

    let card = screen.getByRole('button')
    expect(card).toHaveClass('aspect-[2/3]')

    rerender(
      <ContentCard item={mockContent} aspectRatio="landscape" />
    )

    card = screen.getByRole('button')
    expect(card).toHaveClass('aspect-video')

    rerender(
      <ContentCard item={mockContent} aspectRatio="square" />
    )

    card = screen.getByRole('button')
    expect(card).toHaveClass('aspect-video')

    rerender(
      <ContentCard item={mockContent} aspectRatio="square" />
    )

    card = screen.getByRole('button')
    expect(card).toHaveClass('aspect-square')
  })

  it('handles keyboard navigation', () => {
    renderWithProviders(<ContentCard item={mockContent} />)

    const card = screen.getByRole('button')
    fireEvent.keyDown(card, { key: 'Enter' })

    // Should open modal (handled by useModalStore mock)
    expect(card).toHaveFocus()
  })

  it('shows watchlist button', () => {
    renderWithProviders(<ContentCard item={mockContent} />)

    const watchlistButton = screen.getByRole('button', { 
      name: /Add to Watchlist|Remove from Watchlist/ 
    })
    expect(watchlistButton).toBeInTheDocument()
  })

  it('shows progress bar when content has progress', () => {
    const contentWithProgress = { 
      ...mockContent, 
      progress: 1800, // 30 minutes
      duration: 3600  // 1 hour total
    }
    
    renderWithProviders(<ContentCard item={contentWithProgress} />)

    const progressBar = document.querySelector('.bg-red-600')
    expect(progressBar).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const customClass = 'custom-test-class'
    renderWithProviders(<ContentCard item={mockContent} className={customClass} />)

    const card = screen.getByRole('button')
    expect(card).toHaveClass(customClass)
  })

  it('handles hover state to show overlay', () => {
    renderWithProviders(<ContentCard item={mockContent} />)

    const card = screen.getByRole('button')
    fireEvent.mouseEnter(card)

    // Overlay should become visible
    expect(screen.getByText('Play Now')).toBeInTheDocument()
  })
})