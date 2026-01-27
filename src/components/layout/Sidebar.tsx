"use client";

import * as React from "react";
import { useUIStore } from "@/lib/store/uiStore";
import {
    Home,
    Compass,
    Clock,
    Bookmark,
    Settings,
    LogOut,
    X,
    Tv,
    Film,
    Zap,
    Folder,
    User,
    Library,
    MonitorPlay
} from "lucide-react";
import { Logo } from "@/components/UI/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; 
import { PROVIDERS } from "@/lib/constants/providers";

const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Browse", icon: Compass, href: "/browse" },
    { label: "Live TV", icon: Tv, href: "/tv" },
    { label: "Movies", icon: Film, href: "/browse/movies" },
    { label: "TV Shows", icon: Tv, href: "/browse/tv-shows" },
    { label: "Anime", icon: Zap, href: "/browse/anime" },
    { label: "Files", icon: Folder, href: "/files" },
    { label: "History", icon: Clock, href: "/history" },
    { label: "Watchlist", icon: Bookmark, href: "/watchlist" },
    { label: "Collections", icon: Library, href: "/collections" },
    { label: "Profile", icon: User, href: "/profile" },
];

export function Sidebar() {
    const { sidebarOpen, setSidebarOpen } = useUIStore();
    const pathname = usePathname();

    // Auto-hide logic
    const hideTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const resetHideTimer = React.useCallback(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
        
        // Only auto-hide on desktop/large screens where sidebar is a meaningful overlay
        if (sidebarOpen && window.innerWidth >= 1024) {
            hideTimeoutRef.current = setTimeout(() => {
                setSidebarOpen(false);
            }, 2500); // 2.5 seconds of inactivity
        }
    }, [sidebarOpen, setSidebarOpen]);

    // Handle initial open and mouse moves
    React.useEffect(() => {
        if (sidebarOpen) {
            resetHideTimer();
        }
        return () => {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        };
    }, [sidebarOpen, resetHideTimer]);

    // Close sidebar with right arrow key
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' && sidebarOpen) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [sidebarOpen, setSidebarOpen]);

    // Handle scroll to hide
    React.useEffect(() => {
        const handleScroll = () => {
             if (sidebarOpen && window.scrollY > 150) {
                 setSidebarOpen(false);
             }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [sidebarOpen, setSidebarOpen]);

    return (
        <>
            {/* Overlay for all screens when open */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sensor Zone for Peek/Reveal */}
            {!sidebarOpen && (
                <div 
                    className="fixed top-0 left-0 w-4 h-screen z-[45] cursor-pointer"
                    onMouseEnter={() => setSidebarOpen(true)}
                />
            )}

            {/* Sidebar Container */}
            <aside 
                onMouseMove={resetHideTimer}
                onMouseEnter={resetHideTimer}
                onMouseLeave={() => {
                    // Start a faster hide when leaving the sidebar specifically
                    if (sidebarOpen) {
                        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
                        hideTimeoutRef.current = setTimeout(() => setSidebarOpen(false), 800);
                    }
                }}
                className={cn(
                    "fixed top-4 z-50 h-[calc(100vh-2rem)] glass-sidebar rounded-3xl shadow-2xl transition-all duration-700 ease-out border border-white/5 overflow-hidden",
                    sidebarOpen 
                        ? "left-4 w-[280px] translate-x-0 opacity-100 scale-100" 
                        : "left-[-100px] w-[280px] -translate-x-full opacity-0 scale-95 pointer-events-none"
                )}
            >
                <div className="flex flex-col h-full w-full">
                    {/* Logo Area */}
                    <div className="h-16 flex items-center px-6 border-b border-white/5 mx-2 justify-between shrink-0">
                        <Link href="/" onClick={() => setSidebarOpen(false)} className="mx-auto lg:mx-0">
                            <div className={cn(
                                "flex items-center transition-all duration-300",
                                sidebarOpen ? "px-6" : "px-0 justify-center"
                            )}>
                                <Logo 
                                    size="md" 
                                    showText={sidebarOpen} 
                                    aria-label="NovaStream Logo"
                                />
                            </div>
                        </Link>
                        {sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="text-zinc-400 hover:text-white transition-colors lg:hidden"
                                aria-label="Close Sidebar"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-1 scrollbar-hide">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-label={item.label}
                                    onClick={() => {
                                        if (window.innerWidth < 1024) {
                                            setSidebarOpen(false);
                                        }
                                    }}
                                    className={cn(
                                        "flex items-center rounded-xl transition-all duration-300 group/item whitespace-nowrap outline-none relative mx-2",
                                        isActive
                                            ? "bg-primary/20 text-primary"
                                            : "text-zinc-400 hover:text-white hover:bg-white/5",
                                        "focus:bg-white/10 focus:text-white focus:ring-2 focus:ring-primary/50",
                                        sidebarOpen ? "px-4 py-3" : "justify-center p-3"
                                    )}
                                    title={!sidebarOpen ? item.label : undefined}
                                >
                                    <item.icon size={22} className={cn(
                                        "shrink-0 transition-transform duration-300",
                                        isActive && "fill-current",
                                        !sidebarOpen && "group-hover/item:scale-110"
                                    )} />
                                    <div className={cn(
                                        "ml-4 font-bold text-sm tracking-wide transition-all duration-300",
                                        sidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none w-0 overflow-hidden"
                                    )}>
                                        {item.label}
                                    </div>
                                </Link>
                            );
                        })}

                        {/* Channels Section */}
                        {sidebarOpen && (
                            <div className="pt-6 pb-2 px-3">
                                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Channels</h3>
                            </div>
                        )}
                        
                        {PROVIDERS.map((provider) => {
                             const isActive = pathname === `/channel/${provider.id}`;
                             return (
                                <Link
                                    key={provider.id}
                                    href={`/channel/${provider.id}`}
                                    onClick={() => {
                                        if (window.innerWidth < 1024) {
                                            setSidebarOpen(false);
                                        }
                                    }}
                                    className={cn(
                                        "flex items-center px-3 py-3 rounded-xl transition-all duration-200 group/item whitespace-nowrap outline-none",
                                        isActive
                                            ? "bg-white/10 text-white"
                                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                                    )}
                                    style={{
                                        // Dynamic Color Hover Effect could go here, or just stick to simple
                                        borderLeft: isActive ? `3px solid ${provider.color}` : '3px solid transparent'
                                    }}
                                >
                                    <div className={cn(
                                        "relative flex items-center justify-start transition-all duration-200",
                                        ['disney', 'max', 'peacock', 'adult-swim'].includes(provider.slug) ? "h-9 w-32" : "h-7 w-28"
                                    )}>
                                        <img 
                                            src={provider.logo} 
                                            alt={provider.name}
                                            className={cn(
                                                "h-full w-auto max-w-full object-contain transition-all duration-200",
                                                !sidebarOpen && "opacity-0 hidden"
                                            )}
                                            style={{
                                                filter: isActive ? 'brightness(1.2)' : 'brightness(0.8) grayscale(0.2)'
                                            }}
                                        />
                                    </div>
                                </Link>
                             );
                        })}

                    </nav>

                    {/* Bottom Actions */}
                    <div className="p-4 border-t border-white/5 mx-2 shrink-0">
                        {/* Toggle Button for Desktop */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={cn(
                                "hidden lg:flex w-full items-center mb-2 overflow-hidden transition-all duration-300",
                                sidebarOpen ? "justify-center px-3 py-1" : "justify-center px-0 py-2"
                            )}
                            aria-label={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                        >
                            {sidebarOpen ? (
                                <div className="p-2 hover:bg-white/10 rounded-full text-zinc-500 hover:text-white transition-colors">
                                    <X size={18} />
                                </div>
                            ) : (
                                <div className="w-10 h-1 bg-zinc-800 rounded-full hover:bg-primary transition-colors cursor-pointer" />
                            )}
                        </button>

                        <Link
                            href="/settings"
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                                "flex items-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all mb-1 whitespace-nowrap mx-2",
                                sidebarOpen ? "px-4 py-3" : "justify-center p-3"
                            )}
                            title={!sidebarOpen ? "Settings" : undefined}
                        >
                            <Settings size={22} className="shrink-0" />
                            <div className={cn(
                                "ml-4 font-bold text-sm tracking-wide transition-all duration-300",
                                sidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none w-0 overflow-hidden"
                            )}>
                                Settings
                            </div>
                        </Link>
                    </div>
                </div>
            </aside>
        </>
    );
}
