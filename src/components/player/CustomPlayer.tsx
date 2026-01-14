import React, { useEffect, useRef } from 'react';
import HLS from 'hls.js';

interface PlayerProps {
    sourceUrl: string;
    subtitles: Array<{ lang: string; url: string }>;
    autoplay?: boolean;
    onTimeUpdate?: (time: number) => void;
}

export const CustomPlayer: React.FC<PlayerProps> = ({
    sourceUrl,
    subtitles,
    autoplay = false,
    onTimeUpdate
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<HLS | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Clear existing tracks
        while (video.firstChild) {
            video.removeChild(video.firstChild);
        }

        // Initialize HLS
        if (HLS.isSupported()) {
            const hls = new HLS({
                debug: false,
                enableWorker: true,
                lowLatencyMode: true
            });
            hlsRef.current = hls;

            hls.loadSource(sourceUrl);
            hls.attachMedia(video);

            hls.on(HLS.Events.MANIFEST_PARSED, () => {
                if (autoplay) video.play().catch(() => { });
            });

            hls.on(HLS.Events.ERROR, (event, data) => {
                console.error('HLS Error:', data);
                if (data.fatal) {
                    switch (data.type) {
                        case HLS.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case HLS.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.destroy();
                            break;
                    }
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = sourceUrl;
        }

        // Add subtitles
        subtitles.forEach((subtitle) => {
            const track = document.createElement('track');
            track.kind = 'subtitles';
            track.src = subtitle.url;
            track.srclang = subtitle.lang;
            track.label = subtitle.lang.toUpperCase();
            video.appendChild(track);
        });

        const handleTimeUpdate = () => {
            onTimeUpdate?.(video.currentTime);
        };

        video.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [sourceUrl, subtitles, autoplay, onTimeUpdate]);

    return (
        <video
            ref={videoRef}
            className="w-full h-full bg-black"
            controls
        />
    );
};

export default CustomPlayer;
