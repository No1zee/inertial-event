'use client';

import React, { useEffect, useRef } from 'react';

interface AmbientSyncProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  active: boolean;
}

/**
 * AmbientSync
 * 
 * Synchronizes the UI ambiance with the video content.
 * Extracts dominant colors from the video frame and updates CSS variables.
 */
export function AmbientSync({ videoRef, active }: AmbientSyncProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || !videoRef.current) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 64; // Small for performance
      canvasRef.current.height = 36;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const video = videoRef.current;

    const updateAmbiance = () => {
      if (video.paused || video.ended || !ctx) {
        animationFrameRef.current = requestAnimationFrame(updateAmbiance);
        return;
      }

      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        let r = 0, g = 0, b = 0;
        const totalPixels = canvas.width * canvas.height;

        // Sample every 4th pixel for speed
        for (let i = 0; i < imageData.length; i += 16) {
          r += imageData[i];
          g += imageData[i + 1];
          b += imageData[i + 2];
        }

        const count = totalPixels / 4;
        const avgR = Math.round(r / count);
        const avgG = Math.round(g / count);
        const avgB = Math.round(b / count);

        // Update CSS variables on document root or a specific container
        document.documentElement.style.setProperty('--ambient-rgb', `${avgR}, ${avgG}, ${avgB}`);
        document.documentElement.style.setProperty('--ambient-color', `rgb(${avgR}, ${avgG}, ${avgB})`);
      } catch {
        // Handle cross-origin errors if any (though we set crossOrigin="anonymous")
        // console.warn('[AmbientSync] Failed to sample frame:');
      }

      // Throttle to ~10fps for performance
      setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(updateAmbiance);
      }, 100);
    };

    animationFrameRef.current = requestAnimationFrame(updateAmbiance);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [active, videoRef]);

  return null;
}
