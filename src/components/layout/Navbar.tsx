"use client";

import { useUIStore } from "@/lib/store/uiStore";
import { Bell, Search, Menu, User } from "lucide-react";
import Link from "next/link";

export function Navbar() {
    const { toggleSidebar } = useUIStore();

    return (
        <header className="sticky top-0 z-30 w-full h-16 bg-zinc-950/80 backdrop-blur-md border-b border-white/5 px-4 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 text-zinc-400 hover:text-white"
                >
                    <Menu size={24} />
                </button>

                {/* Mobile Logo */}
                <span className="font-bold text-xl lg:hidden">NovaStream</span>
            </div>

            {/* Search Bar (Desktop) */}
            <div className="hidden md:flex items-center max-w-md w-full mx-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                    type="text"
                    placeholder="Search titles, genres, people..."
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                />
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 text-zinc-400 hover:text-white transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                <Link href="/profile" className="flex items-center gap-3 pl-2 border-l border-white/10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                        <User size={16} className="text-white" />
                    </div>
                </Link>
            </div>
        </header>
    );
}
