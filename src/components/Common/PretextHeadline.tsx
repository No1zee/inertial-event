'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as Pretext from '@chenglou/pretext';

interface PretextModule {
  prepareWithSegments: (text: string, font: string) => unknown;
  layoutWithLines: (prepared: unknown, maxWidth: number, lineHeight: number) => { height: number; lines: { text: string; width: number }[] };
}

// Robust module resolution for @chenglou/pretext (Handles ESM, CJS, and various bundler artifacts)
const getPretextModule = () => {
  try {
    const mod = Pretext as any;
    if (mod.default && typeof mod.default.prepareWithSegments === 'function') return mod.default;
    if (typeof mod.prepareWithSegments === 'function') return mod;
    // Fallback for some specific CJS bundling patterns
    return mod;
  } catch {
    return null;
  }
};

const pretextModule = getPretextModule();
const prepareWithSegments = pretextModule?.prepareWithSegments;
const layoutWithLines = pretextModule?.layoutWithLines;

interface PretextLine {
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface LayoutResult {
  width: number;
  height: number;
  lines: PretextLine[];
}

interface PretextHeadlineProps {
  text: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  color?: string;
  lineHeight?: number;
  maxWidth?: number;
  className?: string;
  stagger?: number;
  letterSpacing?: string;
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

/**
 * PretextHeadline
 * A high-performance text rendering component using @chenglou/pretext.
 * Eliminates layout thrashing and ensures 120fps smoothness for cinematic headlines.
 */
export const PretextHeadline: React.FC<PretextHeadlineProps> = ({
  text: rawText,
  fontSize = 32,
  fontWeight = 700,
  fontFamily = 'Outfit, sans-serif',
  color = '#FFFFFF',
  lineHeight = 1.2,
  maxWidth = 800,
  className = '',
  stagger: _stagger = 0,
  letterSpacing,
  shadow,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const text = useMemo(() => {
    if (rawText === null || rawText === undefined) return '';
    const str = String(rawText);
    // Strip non-printable characters and control codes that might confuse the layout engine
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  }, [rawText]);

  const layoutResult = useMemo<LayoutResult>(() => {
    // Absolute safety check: if non-string or empty, return early
    if (typeof text !== 'string' || !text.trim()) {
      return { width: 0, height: 0, lines: [] };
    }

    try {
      const resolvedFont = fontFamily.includes('var(--') ? 'Outfit, Inter, sans-serif' : fontFamily;

      const safeMaxWidth = Math.max(1, isFinite(maxWidth) ? maxWidth : 800);
      const safeFontSize = Math.max(1, isFinite(fontSize) ? fontSize : 32);
      const safeLineHeight = Math.max(0.1, isFinite(lineHeight) ? lineHeight : 1.2);

      if (!prepareWithSegments || !layoutWithLines) {
        throw new Error('Pretext library not initialized');
      }

      const fontString = `${fontWeight} ${safeFontSize}px ${resolvedFont}`;
      const prepared = prepareWithSegments(text, fontString);
      const pxLineHeight = safeFontSize * safeLineHeight;

      const result = layoutWithLines(prepared, safeMaxWidth, pxLineHeight) as { height: number; lines: { text: string; width: number }[] };

      const mappedLines: PretextLine[] = result.lines.map((line: { text: string; width: number }, i: number) => ({
        text: line.text,
        x: 0,
        y: i * pxLineHeight,
        width: line.width,
        height: pxLineHeight,
      }));

      return {
        width: safeMaxWidth,
        height: result.height,
        lines: mappedLines,
      };
    } catch {
      // Silently fallback without polluting the console
      return {
        width: maxWidth || 800,
        height: (fontSize || 32) * (lineHeight || 1.2),
        lines: [{ text, x: 0, y: 0 }],
      };
    }
  }, [text, fontSize, lineHeight, fontFamily, fontWeight, maxWidth]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const width = layoutResult?.width || 0;
    const height = layoutResult?.height || 0;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width > 0 ? `${width}px` : 'auto';
    canvas.style.height = height > 0 ? `${height}px` : 'auto';
    ctx.scale(dpr, dpr);

    // Clear and draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (shadow) {
      ctx.shadowColor = shadow.color;
      ctx.shadowBlur = shadow.blur;
      ctx.shadowOffsetX = shadow.offsetX;
      ctx.shadowOffsetY = shadow.offsetY;
    }

    if (letterSpacing) {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = letterSpacing;
    }

    ctx.fillStyle = color;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'top';

    // Render glyphs based on pretext layout
    if (layoutResult && layoutResult.lines) {
      layoutResult.lines.forEach((line: PretextLine) => {
        if (line && typeof line.text === 'string') {
          ctx.fillText(line.text, line.x || 0, line.y || 0);
        }
      });
    }
  }, [layoutResult, color, fontSize, fontFamily, fontWeight, shadow, letterSpacing]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && layoutResult) {
      containerRef.current.style.width = layoutResult.width > 0 ? `${layoutResult.width}px` : 'auto';
      containerRef.current.style.height = layoutResult.height > 0 ? `${layoutResult.height}px` : 'auto';
    }
  }, [layoutResult]);

  return (
    <div ref={containerRef} className={`pretext-container relative overflow-hidden ${className}`}>
      {/* Screen Reader Mirror */}
      <span className="sr-only" aria-hidden="false">{text}</span>
      
      <canvas ref={canvasRef} className="block pointer-events-none" aria-hidden="true" />
    </div>
  );
};
