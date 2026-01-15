"use client";

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
    Folder
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; // We need to create this util if not exists, standard shadcn/tailwind merge

const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Browse", icon: Compass, href: "/browse" },
    { label: "Movies", icon: Film, href: "/browse/movies" },
    { label: "TV Shows", icon: Tv, href: "/browse/tv-shows" },
    { label: "Anime", icon: Zap, href: "/browse/anime" },
    { label: "Files", icon: Folder, href: "/files" },
    { label: "History", icon: Clock, href: "/history" },
    { label: "Watchlist", icon: Bookmark, href: "/watchlist" },
];

export function Sidebar() {
    const { sidebarOpen, setSidebarOpen } = useUIStore();
    const pathname = usePathname();

    return (
        <>
            {/* Overlay for all screens when open */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar Container - Off-canvas by default on all screens */}
            {/* Sidebar Container */}
            <aside className={cn(
                "fixed top-0 left-0 z-50 h-screen bg-zinc-950 border-r border-white/10 transition-all duration-300 ease-in-out shadow-2xl",
                sidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"
            )}>
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Logo Area */}
                    <div className="h-16 flex items-center px-6 border-b border-white/5 mx-2 justify-between shrink-0">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shrink-0">
                                <span className="font-bold text-white">N</span>
                            </div>
                            <span className={cn("ml-3 font-bold text-xl tracking-tight transition-opacity duration-200", !sidebarOpen && "lg:opacity-0 lg:hidden")}>
                                NovaStream
                            </span>
                        </div>
                        {sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="text-zinc-400 hover:text-white transition-colors lg:hidden"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={cn(
                                        "flex items-center px-3 py-3 rounded-xl transition-all duration-200 group/item whitespace-nowrap",
                                        isActive
                                            ? "bg-red-600/10 text-red-500"
                                            : "text-zinc-400 hover:text-white hover:bg-white/5",
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
                    </nav>

                    {/* Bottom Actions */}
                    <div className="p-4 border-t border-white/5 mx-2 shrink-0">
                        {/* Toggle Button for Desktop */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="hidden lg:flex w-full items-center justify-center px-3 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all mb-1"
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
