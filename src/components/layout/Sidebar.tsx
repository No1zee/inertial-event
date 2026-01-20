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

    return (
        <>
            {/* Overlay for all screens when open */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed top-0 left-0 z-50 h-screen bg-zinc-950 border-r border-white/10 shadow-2xl transition-all duration-300",
                sidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full"
            )}>
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Logo Area */}
                    <div className="h-16 flex items-center px-6 border-b border-white/5 mx-2 justify-between shrink-0">
                        <Link href="/" onClick={() => setSidebarOpen(false)}>
                            <Logo 
                                size="md" 
                                showText={sidebarOpen} 
                                className={cn(!sidebarOpen && "lg:ml-1")}
                                aria-label="NovaStream Logo"
                            />
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
                                    onClick={() => setSidebarOpen(false)}
                                    className={cn(
                                        "flex items-center px-3 py-3 rounded-xl transition-all duration-200 group/item whitespace-nowrap outline-none",
                                        isActive
                                            ? "bg-red-600/10 text-red-500"
                                            : "text-zinc-400 hover:text-white hover:bg-white/5",
                                        "focus:bg-white/10 focus:text-white focus:ring-2 focus:ring-red-600/50",
                                        !sidebarOpen && "justify-center px-0"
                                    )}
                                    title={!sidebarOpen ? item.label : undefined}
                                >
                                    <item.icon size={22} className={cn(
                                        "shrink-0",
                                        isActive && "fill-current"
                                    )} />
                                    <span className={cn("ml-4 font-medium text-base transition-opacity duration-200", !sidebarOpen && "lg:opacity-0 lg:hidden")}>
                                        {item.label}
                                    </span>
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
                                    onClick={() => setSidebarOpen(false)}
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
                                        ['disney', 'max', 'peacock', 'adult-swim'].includes(provider.slug) ? "h-16 w-44" : "h-7 w-28"
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
                            className="hidden lg:flex w-full items-center justify-center px-3 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all mb-1"
                            aria-label={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                        >
                            {sidebarOpen ? <X size={22} /> : <div className="w-1 h-8 bg-zinc-800 rounded-full group-hover:bg-zinc-600" />}
                        </button>

                        <Link
                            href="/settings"
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                                "flex items-center px-3 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all mb-1 whitespace-nowrap",
                                !sidebarOpen && "justify-center px-0"
                            )}
                            title={!sidebarOpen ? "Settings" : undefined}
                        >
                            <Settings size={22} className="shrink-0" />
                            <span className={cn("ml-4 font-medium transition-opacity duration-200", !sidebarOpen && "lg:opacity-0 lg:hidden")}>
                                Settings
                            </span>
                        </Link>
                    </div>
                </div>
            </aside>
        </>
    );
}
