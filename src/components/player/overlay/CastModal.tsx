import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cast, Tv, Monitor } from 'lucide-react';
import { cn } from "@/lib/utils";

interface CastDevice {
    id: string;
    name: string;
    type: 'chromecast' | 'dlna';
    host: string;
}

interface CastModalProps {
    isOpen: boolean;
    onClose: () => void;
    devices: CastDevice[];
    onSelect: (device: CastDevice) => void;
    isScanning: boolean;
}

export default function CastModal({ isOpen, onClose, devices, onSelect, isScanning }: CastModalProps) {
    // Close on escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <Cast className="text-red-500" />
                                Cast to Device
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} className="text-zinc-400" />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {devices.length === 0 ? (
                                <div className="py-8 text-center text-zinc-500">
                                    {isScanning ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                            <span>Searching for devices...</span>
                                        </div>
                                    ) : (
                                        <span>No devices found.</span>
                                    )}
                                </div>
                            ) : (
                                devices.map((device) => (
                                    <button
                                        key={device.id}
                                        onClick={() => onSelect(device)}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-red-500/20 group-hover:text-red-500 transition-colors">
                                            {device.type === 'chromecast' ? <Tv size={20} /> : <Monitor size={20} />}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-white font-medium">{device.name}</div>
                                            <div className="text-xs text-zinc-500 capitalize">{device.type} ({device.host})</div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Scanning Indicator Footer */}
                        {isScanning && devices.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-zinc-500">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Scanning for more devices...
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
