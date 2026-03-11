import { createMockContent } from '../../utils/testUtils'

// Mock the streaming service for now
const streamingService = {
  getStreamUrl: jest.fn(),
  getMultipleSources: jest.fn(),
  validateStreamUrl: jest.fn(),
  getStreamMetadata: jest.fn(),
  selectOptimalSource: jest.fn(),
}

// Mock fetch
global.fetch = jest.fn()

describe('Streaming Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getStreamUrl', () => {
    it('should return stream URL for valid content', async () => {
      const mockContent = createMockContent()
      const mockStreamResponse = {
        sources: [
          {
            url: 'https://example.com/stream.m3u8',
            quality: '1080p',
            format: 'hls'
          }
        ]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStreamResponse
      })

      const result = await streamingService.getStreamUrl(mockContent.id, mockContent.type)

      expect(result).toBe('https://example.com/stream.m3u8')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/sources/${mockContent.id}`),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('should handle streaming service errors', async () => {
      const mockContent = createMockContent()

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Content not found' })
      })

      await expect(streamingService.getStreamUrl(mockContent.id, mockContent.type))
        .rejects.toThrow('Content not found')
    })

    it('should handle network errors', async () => {
      const mockContent = createMockContent()

      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(streamingService.getStreamUrl(mockContent.id, mockContent.type))
        .rejects.toThrow('Network error')
    })
  })

  describe('getMultipleSources', () => {
    it('should return multiple streaming sources', async () => {
      const mockContent = createMockContent()
      const mockSourcesResponse = {
        sources: [
          { url: 'https://source1.com/stream.m3u8', quality: '1080p', provider: 'vidlink' },
          { url: 'https://source2.com/stream.m3u8', quality: '720p', provider: 'consumet' },
          { url: 'https://source3.com/stream.m3u8', quality: '480p', provider: 'fallback' }
        ]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSourcesResponse
      })

      const result = await streamingService.getMultipleSources(mockContent.id, mockContent.type)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        url: 'https://source1.com/stream.m3u8',
        quality: '1080p',
        provider: 'vidlink'
      })
    })

    it('should prioritize sources by quality', async () => {
      const mockContent = createMockContent()
      const mockSourcesResponse = {
        sources: [
          { url: 'https://source1.com/stream.m3u8', quality: '480p', provider: 'vidlink' },
          { url: 'https://source2.com/stream.m3u8', quality: '1080p', provider: 'consumet' },
          { url: 'https://source3.com/stream.m3u8', quality: '720p', provider: 'fallback' }
        ]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSourcesResponse
      })

      const result = await streamingService.getMultipleSources(mockContent.id, mockContent.type)

      expect(result[0].quality).toBe('1080p')
      expect(result[1].quality).toBe('720p')
      expect(result[2].quality).toBe('480p')
    })
  })

  describe('validateStreamUrl', () => {
    it('should validate HLS URLs', () => {
      const validHlsUrl = 'https://example.com/stream.m3u8'
      expect(streamingService.validateStreamUrl(validHlsUrl)).toBe(true)
    })

    it('should validate MP4 URLs', () => {
      const validMp4Url = 'https://example.com/video.mp4'
      expect(streamingService.validateStreamUrl(validMp4Url)).toBe(true)
    })

    it('should reject invalid URLs', () => {
      const invalidUrl = 'not-a-valid-url'
      expect(streamingService.validateStreamUrl(invalidUrl)).toBe(false)
    })

    it('should reject empty URLs', () => {
      expect(streamingService.validateStreamUrl('')).toBe(false)
      expect(streamingService.validateStreamUrl(null as any)).toBe(false)
    })
  })

  describe('getStreamMetadata', () => {
    it('should fetch stream metadata', async () => {
      const mockContent = createMockContent()
      const mockMetadata = {
        duration: 7200,
        bitrate: 5000,
        resolution: '1920x1080',
        fps: 30,
        format: 'hls'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata
      })

      const result = await streamingService.getStreamMetadata(
        'https://example.com/stream.m3u8'
      )

      expect(result).toEqual(mockMetadata)
    })

    it('should handle metadata fetch errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      await expect(streamingService.getStreamMetadata('invalid-url'))
        .rejects.toThrow()
    })
  })

  describe('adaptive bitrate streaming', () => {
    it('should select appropriate quality based on bandwidth', async () => {
      const sources = [
        { url: 'https://example.com/480p.m3u8', quality: '480p', bitrate: 2000 },
        { url: 'https://example.com/720p.m3u8', quality: '720p', bitrate: 4000 },
        { url: 'https://example.com/1080p.m3u8', quality: '1080p', bitrate: 8000 }
      ]

      // Test with low bandwidth
      const lowBandwidthSource = streamingService.selectOptimalSource(sources, 1500)
      expect(lowBandwidthSource.quality).toBe('480p')

      // Test with medium bandwidth
      const mediumBandwidthSource = streamingService.selectOptimalSource(sources, 5000)
      expect(mediumBandwidthSource.quality).toBe('720p')

      // Test with high bandwidth
      const highBandwidthSource = streamingService.selectOptimalSource(sources, 10000)
      expect(highBandwidthSource.quality).toBe('1080p')
    })

    it('should fallback to lowest quality when bandwidth is insufficient', () => {
      const sources = [
        { url: 'https://example.com/720p.m3u8', quality: '720p', bitrate: 4000 },
        { url: 'https://example.com/1080p.m3u8', quality: '1080p', bitrate: 8000 }
      ]

      const fallbackSource = streamingService.selectOptimalSource(sources, 1000)
      expect(fallbackSource.quality).toBe('720p')
    })

    it('should handle empty sources array', () => {
      const result = streamingService.selectOptimalSource([], 5000)
      expect(result).toBeNull()
    })
  })
})