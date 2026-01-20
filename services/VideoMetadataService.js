const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

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
          // Return basic info if probe fails
          resolve({
            duration: 0,
            format: 'unknown'
          });
          return;
        }

        const format = metadata.format || {};
        resolve({
            duration: format.duration || 0,
            format: format.format_name || 'unknown',
            size: format.size || 0
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
