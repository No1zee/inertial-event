export interface HLSManifest {
    duration: number;
    targetDuration: number;
    mediaSequence: number;
    segments: HLSSegment[];
    playlists?: HLSPlaylist[];
}

export interface HLSSegment {
    duration: number;
    uri: string;
}

export interface HLSPlaylist {
    bandwidth: number;
    resolution?: string;
    uri: string;
}

export const parseHLSManifest = (manifest: string): HLSManifest => {
    const lines = manifest.split('\n');
    const result: HLSManifest = {
        duration: 0,
        targetDuration: 0,
        mediaSequence: 0,
        segments: [],
        playlists: []
    };

    const parseStreamInfo = (
        line: string
    ): { bandwidth: number; resolution?: string } => {
        const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);
        const resolutionMatch = line.match(/RESOLUTION=([\d+x\d+])/);

        return {
            bandwidth: bandwidthMatch ? parseInt(bandwidthMatch[1]) : 0,
            resolution: resolutionMatch ? resolutionMatch[1] : undefined
        };
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('#EXT-X-TARGETDURATION:')) {
            result.targetDuration = parseInt(
                line.replace('#EXT-X-TARGETDURATION:', '')
            );
        }

        if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
            result.mediaSequence = parseInt(
                line.replace('#EXT-X-MEDIA-SEQUENCE:', '')
            );
        }

        if (line.startsWith('#EXTINF:')) {
            const duration = parseFloat(line.split(':')[1]);
            const nextLine = lines[i + 1]?.trim();
            if (nextLine && !nextLine.startsWith('#')) {
                result.segments.push({
                    duration,
                    uri: nextLine
                });
                result.duration += duration;
            }
        }

        if (line.startsWith('#EXT-X-STREAM-INF:')) {
            const attrs = parseStreamInfo(line);
            const playlistUri = lines[i + 1]?.trim();
            if (playlistUri && !playlistUri.startsWith('#')) {
                result.playlists?.push({
                    bandwidth: attrs.bandwidth,
                    resolution: attrs.resolution,
                    uri: playlistUri
                });
            }
        }
    }

    return result;
};
