import { useState, useCallback } from 'react';

export const usePlayer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    const togglePlay = useCallback(() => setIsPlaying((prev) => !prev), []);
    const seek = useCallback((time: number) => setCurrentTime(time), []);
    const updateVolume = useCallback((v: number) => setVolume(v), []);
    const toggleMute = useCallback(() => setIsMuted((prev) => !prev), []);

    return {
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        togglePlay,
        seek,
        updateVolume,
        toggleMute
    };
};

export default usePlayer;
