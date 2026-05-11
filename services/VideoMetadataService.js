const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
ffmpeg.setFfprobePath(ffprobePath);

class VideoMetadataService {
  constructor() {
    // Optionally configure ffmpeg path here if needed
  }

  /**
   * Extract metadata from a video file
   * @param {string} filePath 
   * @returns {Promise<Object>}
   */
  async getMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          console.warn(`[VideoMetadata] Error reading metadata for ${filePath}:`, err.message);
          resolve({
            duration: 0,
            format: 'unknown',
            codec: 'unknown',
            width: 0,
            height: 0,
            audioTracks: []
          });
          return;
        }

        const format = metadata.format || {};
        const videoStream = metadata.streams.find(s => s.codec_type === 'video') || {};
        const audioStreams = metadata.streams.filter(s => s.codec_type === 'audio');
        
        resolve({
            duration: format.duration || 0,
            format: format.format_name || 'unknown',
            size: format.size || 0,
            codec: videoStream.codec_name || 'unknown',
            width: videoStream.width || 0,
            height: videoStream.height || 0,
            audioTracks: audioStreams.map((s, i) => ({
                index: i,
                language: s.tags?.language || 'und',
                codec: s.codec_name,
                channels: s.channels
            }))
        });
      });
    });
  }
  /**
   * Extract audio/subs metadata from filename (Sync)
   * @param {string} filename 
   */
  extractFromFilename(filename) {
    // Simple heuristic for demo purposes
    const audioTracks = [];
    if (filename.match(/5\.1/)) audioTracks.push('5.1 Surround');
    if (filename.match(/aac/i)) audioTracks.push('AAC');
    if (filename.match(/ac3/i)) audioTracks.push('AC3');
    return { audioTracks };
  }
}

module.exports = new VideoMetadataService();
