import { usePlayerStore } from '@/lib/stores/playerStore'
import { act, renderHook } from '@testing-library/react'

describe('Player Store', () => {
  beforeEach(() => {
    // Reset store before each test
    usePlayerStore.getState().resetPlayer()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePlayerStore())
    
    expect(result.current.currentMedia).toBeNull()
    expect(result.current.currentTime).toBe(0)
    expect(result.current.duration).toBe(0)
    expect(result.current.loading).toBe(false)
    expect(result.current.volume).toBe(1)
  })

  it('should update current time', () => {
    const { result } = renderHook(() => usePlayerStore())
    const newTime = 45.5

    act(() => {
      result.current.setCurrentTime(newTime)
    })

    expect(result.current.currentTime).toBe(newTime)
  })

  it('should set duration', () => {
    const { result } = renderHook(() => usePlayerStore())
    const duration = 7200 // 2 hours in seconds

    act(() => {
      result.current.setDuration(duration)
    })

    expect(result.current.duration).toBe(duration)
  })

  it('should set loading state', () => {
    const { result } = renderHook(() => usePlayerStore())

    act(() => {
      result.current.setLoading(true)
    })

    expect(result.current.loading).toBe(true)

    act(() => {
      result.current.setLoading(false)
    })

    expect(result.current.loading).toBe(false)
  })

  it('should adjust volume', () => {
    const { result } = renderHook(() => usePlayerStore())
    const newVolume = 0.5

    act(() => {
      result.current.setVolume(newVolume)
    })

    expect(result.current.volume).toBe(newVolume)
  })

  it('should reset player state', () => {
    const { result } = renderHook(() => usePlayerStore())

    act(() => {
      result.current.setCurrentTime(100)
      result.current.setDuration(3600)
      result.current.setLoading(true)
      result.current.setVolume(0.5)
    })

    act(() => {
      result.current.resetPlayer()
    })

    expect(result.current.currentMedia).toBeNull()
    expect(result.current.currentTime).toBe(0)
    expect(result.current.duration).toBe(0)
    expect(result.current.loading).toBe(false)
    expect(result.current.volume).toBe(1)
  })
})