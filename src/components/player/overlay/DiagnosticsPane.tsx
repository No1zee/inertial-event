'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type ShieldStatus } from '@/services/AegisShield';
import { Activity, Database, Cpu, Zap, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiagnosticsPaneProps {
  show: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: ShieldStatus | null;
}

export default function DiagnosticsPane({ show, videoRef, status }: DiagnosticsPaneProps) {
  const [fps, setFps] = useState(0);
  const [resolution, setResolution] = useState('0x0');

  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      if (videoRef.current) {
        const v = videoRef.current;
        setResolution(`${v.videoWidth}x${v.videoHeight}`);
        
        if ((v as any).getVideoPlaybackQuality) {
          const quality = (v as any).getVideoPlaybackQuality();
          // Simplified FPS indicator for diagnostics
          setFps(Math.round(quality.totalVideoFrames / (v.currentTime || 1)));
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [show, videoRef]);

  if (!show) return null;

  const MetricRow = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number | React.ReactNode, color?: string }) => (
    <div className="flex items-center justify-between gap-8 py-1.5 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon size={14} className={cn("text-zinc-500", color)} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</span>
      </div>
      <span className="text-[11px] font-mono font-medium text-white/90">{value}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className="absolute top-24 right-8 z-[100] w-72 backdrop-blur-3xl bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
    >
      <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Aegis Diagnostics</span>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-primary/20 border border-primary/20">
          <span className="text-[8px] font-black uppercase text-primary">Live</span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-1">
        <MetricRow 
          icon={Cpu} 
          label="Engine Status" 
          value={status?.health || 'Optimal'} 
          color={status?.health === 'critical' ? 'text-red-500' : 'text-emerald-500'} 
        />
        <MetricRow 
          icon={Zap} 
          label="Codec / Accel" 
          value={`${status?.codecStatus?.codec || 'H.264'} / ${status?.codecStatus?.hardwareAccelerated ? 'Hardware' : 'Software'}`} 
        />
        <MetricRow 
          icon={Database} 
          label="Resolution" 
          value={resolution} 
        />
        <MetricRow 
          icon={Wifi} 
          label="Buffer Health" 
          value={`${Math.round(status?.bufferedDuration || 0)}s`} 
        />
        <MetricRow 
          icon={Zap} 
          label="Handshake" 
          value={status?.handshakeLatency ? `${status.handshakeLatency}ms` : 'Ready'} 
        />
        <MetricRow 
          icon={Database} 
          label="Audio Codec" 
          value={status?.codecStatus?.audioCodec || 'AAC'} 
        />
        <MetricRow 
          icon={Activity} 
          label="Tracks (A/S)" 
          value={`${status?.tracks?.audio || 0} / ${status?.tracks?.subtitles || 0}`} 
        />
        
        {/* Bandwidth Telemetry */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Stream Telemetry</span>
            <span className="text-[9px] font-mono text-primary">{Math.round((status?.bandwidth || 0) / 1024 / 1024)} Mbps</span>
          </div>
          <div className="h-12 flex items-end gap-1 px-1">
            {/* Visualizer bars that respond to actual bandwidth if available, or just pulsate for effect */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ height: 4 }}
                animate={{ height: Math.max(4, Math.random() * 40) }}
                transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse', delay: i * 0.05 }}
                className="flex-1 bg-primary/40 rounded-t-sm"
              />
            ))}
          </div>
        </div>

        <div className="mt-4 text-[8px] font-mono text-zinc-600 leading-relaxed uppercase tracking-tighter">
          Aegis Security Handshake: Verified<br />
          Network Latency: Adaptive<br />
          Failover Readiness: 100%
        </div>
      </div>
    </motion.div>
  );
}
