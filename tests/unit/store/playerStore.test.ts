import { usePlayerStore } from '@/store/playerStore'
import { act, renderHook } from '@testing-library/react'

describe('Player Store', () => {
  beforeEach(() => {
    // Reset store before each test
    usePlayerStore.getState().resetPlayer()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePlayerStore())
    
    expect(result.current.currentContentId).toBeNull()
    expect(result.current.currentTime).toBe(0)
    expect(result.current.duration).toBe(0)
    expect(result.current.isBuffering).toBe(false)
    expect(result.current.volume).toBe(1)
  })

  it('should set current content ID', () => {
    const { result } = renderHook(() => usePlayerStore())
    const contentId = 'test-content-id'

    act(() => {
      result.current.setPlayerState({ currentContentId: contentId })
    })

    expect(result.current.currentContentId).toBe(contentId)
  })

  it('should update current time', () => {
    const { result } = renderHook(() => usePlayerStore())
    const newTime = 45.5

    act(() => {
      result.current.setPlayerState({ currentTime: newTime })
    })

    expect(result.current.currentTime).toBe(newTime)
  })

  it('should set duration', () => {
    const { result } = renderHook(() => usePlayerStore())
    const duration = 7200 // 2 hours in seconds

    act(() => {
      result.current.setPlayerState({ duration })
    })

    expect(result.current.duration).toBe(duration)
  })

  it('should set buffering state', () => {
    const { result } = renderHook(() => usePlayerStore())

    act(() => {
      result.current.setPlayerState({ isBuffering: true })
    })

    expect(result.current.isBuffering).toBe(true)

    act(() => {
      result.current.setPlayerState({ isBuffering: false })
    })

    expect(result.current.isBuffering).toBe(false)
  })

  it('should adjust volume', () => {
    const { result } = renderHook(() => usePlayerStore())
    const newVolume = 0.5

    act(() => {
      result.current.setPlayerState({ volume: newVolume })
    })

    expect(result.current.volume).toBe(newVolume)
  })

  it('should update multiple states at once', () => {
    const { result } = renderHook(() => usePlayerStore())

    act(() => {
      result.current.setPlayerState({
        currentContentId: 'test-id',
        currentTime: 100,
        duration: 3600,
        isBuffering: true,
        volume: 0.8,
      })
    })

    expect(result.current.currentContentId).toBe('test-id')
    expect(result.current.currentTime).toBe(100)
    expect(result.current.duration).toBe(3600)
    expect(result.current.isBuffering).toBe(true)
    expect(result.current.volume).toBe(0.8)
  })

  it('should reset player state', () => {
    const { result } = renderHook(() => usePlayerStore())

    act(() => {
      result.current.setPlayerState({
        currentContentId: 'test-id',
        currentTime: 100,
        duration: 3600,
        isBuffering: true,
        volume: 0.5,
      })
    })

    act(() => {
      result.current.resetPlayer()
    })

    expect(result.current.currentContentId).toBeNull()
    expect(result.current.currentTime).toBe(0)
    expect(result.current.duration).toBe(0)
    expect(result.current.isBuffering).toBe(false)
    expect(result.current.volume).toBe(1)
  })
})