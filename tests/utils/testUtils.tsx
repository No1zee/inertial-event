import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { expect } from '@jest/globals'
import '@testing-library/jest-dom'
import type { Content } from '@/lib/types/content'

// Test utilities for React components
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
})

export const renderWithProviders = (
  ui: React.ReactElement,
  { queryClient = createTestQueryClient(), ...renderOptions } = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock data generators
export const createMockContent = (overrides: Partial<Content> = {}) => ({
  id: 'test-content-id',
  title: 'Test Movie',
  type: 'movie' as const,
  overview: 'A test movie for testing purposes',
  poster: '/test-poster.jpg',
  backdrop: '/test-backdrop.jpg',
  releaseDate: '2024-01-01',
  rating: 8.5,
  genres: ['Action', 'Adventure'],
  providers: ['netflix', 'prime'],
  status: 'completed' as const,
  isAdult: false,
  ...overrides,
})

export const createMockEpisode = (overrides = {}) => ({
  id: 'test-episode-id',
  title: 'Test Episode',
  season: 1,
  episode: 1,
  overview: 'A test episode',
  still: '/test-still.jpg',
  duration: 45,
  airDate: '2024-01-01',
  ...overrides,
})

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  preferences: {
    theme: 'dark',
    language: 'en',
    autoplay: true,
  },
  watchlist: [],
  history: [],
  ...overrides,
})

// Event simulation helpers
export const simulateClick = (element: HTMLElement) => {
  fireEvent.click(element)
}

export const simulateInputChange = (element: HTMLElement, value: string) => {
  fireEvent.change(element, { target: { value } })
}

export const simulateKeydown = (element: HTMLElement, key: string) => {
  fireEvent.keyDown(element, { key })
}

// Async test helpers - toBeVisible matcher may have type issues in some setups
// Use standard waitFor approach in tests instead

export const waitForAPICall = async (mockFn: any) => {
  await waitFor(() => {
    expect(mockFn).toHaveBeenCalled()
  })
}

// Mock response helpers
export const createMockResponse = (data: any, status = 200) => {
  return Promise.resolve({
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: {},
  })
}

export const createMockErrorResponse = (message: string, status = 400) => {
  return Promise.reject({
    response: {
      data: { message },
      status,
      statusText: 'Error',
    },
  })
}