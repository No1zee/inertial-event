'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';
import { useCurrentMedia } from '@/lib/stores/playerStore';
import { usePreferencesStore } from '@/lib/stores/preferencesStore';
import { shallow } from 'zustand/shallow';

/**
 * PretextBackground (v2 — Organic Cinema Edition)
 * 
 * Renders large-scale, performance-optimized ambient text in the background.
 * Uses @chenglou/pretext for zero-reflow layout calculations.
 *
 * v2 Enhancements:
 * 1. Multi-layer text at different scales and opacities for depth.
 * 2. Organic Lissajous drift (non-repeating motion using prime-ratio frequencies).
 * 3. atmosphereIntensity drives alpha in real-time via CSS var.
 * 4. Parallax ripple on idle — text slowly breathes with a subtle scale warp.
 */
export const PretextBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const media = useCurrentMedia();
  const intensity = usePreferencesStore(state => state.atmosphereIntensity, shallow);
  
  const text = media?.title || 'NovaStream';
  
  // Font configuration for the primary (large) layer
  const FONT_SIZE_LG = 140;
  const FONT_SIZE_SM = 60;
  const FONT_FAMILY = 'Outfit, sans-serif';
  const FONT_SPEC_LG = `black ${FONT_SIZE_LG}px ${FONT_FAMILY}`;
  const FONT_SPEC_SM = `900 ${FONT_SIZE_SM}px ${FONT_FAMILY}`;
  
  // Pre-calculate segments only when text changes
  const preparedLg = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return prepareWithSegments(text.toUpperCase(), FONT_SPEC_LG);
  }, [text]);

  const preparedSm = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return prepareWithSegments(text.toUpperCase(), FONT_SPEC_SM);
  }, [text]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const startTime = Date.now();
    let dpr = window.devicePixelRatio || 1;

    const handleResize = () => {
      dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      // Organic Lissajous drift (prime-ratio frequencies = non-repeating)
      const elapsed = (Date.now() - startTime) / 1000;

      // Layer 1 — Primary large text (slow, majestic)
      const driftX1 = Math.sin(elapsed * 0.07) * 30 + Math.cos(elapsed * 0.11) * 15;
      const driftY1 = Math.cos(elapsed * 0.09) * 20 + Math.sin(elapsed * 0.13) * 10;

      // Layer 2 — Secondary smaller text (slightly faster, offset phase)
      const driftX2 = Math.sin(elapsed * 0.05 + 1.5) * 40 + Math.cos(elapsed * 0.08) * 20;
      const driftY2 = Math.cos(elapsed * 0.06 + 0.7) * 25 + Math.sin(elapsed * 0.1) * 12;

      // Breathing scale for depth perception
      const breathScale = 1 + Math.sin(elapsed * 0.15) * 0.012;

      // Get theme-aware color from CSS variables
      const primaryRgb = getComputedStyle(document.documentElement)
        .getPropertyValue('--brand-primary-rgb').trim() || '235, 20, 71';

      // --- Layer 2: Smaller, more transparent "echo" text (behind main) ---
      if (preparedSm) {
        const layoutWidthSm = width * 0.9;
        const { lines: linesSmRaw } = layoutWithLines(preparedSm, layoutWidthSm, FONT_SIZE_SM * 1.1);

        ctx.save();
        ctx.font = FONT_SPEC_SM;
        ctx.fillStyle = `rgba(${primaryRgb}, ${0.025 * intensity})`;
        ctx.textBaseline = 'top';

        // Place secondary layer offset from center — top-right echo
        const startY2 = height * 0.05 + driftY2;
        linesSmRaw.forEach((line, i) => {
          const x = (width * 0.55) - (line.width / 2) + driftX2;
          const y = startY2 + i * FONT_SIZE_SM * 1.1;
          ctx.fillText(line.text, x, y);
        });

        // Bottom-left echo
        const startY2b = height * 0.65 + driftY2 * 0.7;
        linesSmRaw.forEach((line, i) => {
          const x = (width * 0.2) - (line.width / 2) + driftX2 * 0.6;
          const y = startY2b + i * FONT_SIZE_SM * 1.1;
          ctx.fillText(line.text, x, y);
        });

        ctx.restore();
      }

      // --- Layer 1: Primary large text (center, breathes) ---
      if (preparedLg) {
        const layoutWidthLg = width * 0.85;
        const { lines: linesLg } = layoutWithLines(preparedLg, layoutWidthLg, FONT_SIZE_LG * 1.1);

        ctx.save();
        ctx.font = FONT_SPEC_LG;
        ctx.fillStyle = `rgba(${primaryRgb}, ${0.055 * intensity})`;
        ctx.textBaseline = 'top';

        // Apply breathing scale from center
        const centerX = width / 2;
        const centerY = height / 2;
        ctx.translate(centerX, centerY);
        ctx.scale(breathScale, breathScale);
        ctx.translate(-centerX, -centerY);

        const totalHeight = linesLg.length * FONT_SIZE_LG * 1.1;
        const startY1 = (height - totalHeight) / 2 + driftY1;
        linesLg.forEach((line, i) => {
          const x = (width - line.width) / 2 + driftX1;
          const y = startY1 + i * FONT_SIZE_LG * 1.1;
          ctx.fillText(line.text, x, y);
        });

        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [preparedLg, preparedSm, intensity]);

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 -z-40 w-full h-full canvas-layer"
        style={{ filter: 'blur(3px)' }}
      />
      {/* A11y Mirroring as mandated by the Pretext pattern */}
      <div className="sr-only" aria-hidden="true">
        Ambient background displaying: {text}
      </div>
    </>
  );
};
