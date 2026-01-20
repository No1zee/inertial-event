"use client";

import { useUIStore } from "@/lib/store/uiStore";
import { useAuthStore } from "@/lib/store/authStore";
import { Bell, Search, Menu, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";

export function Navbar() {
    const router = useRouter();
    const { toggleSidebar } = useUIStore();
    const { user } = useAuthStore();

    return (
        <header className="sticky top-0 z-30 w-full h-16 bg-zinc-950/80 backdrop-blur-md border-b border-white/5 px-4 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 text-zinc-400 hover:text-white"
                    aria-label="Toggle Sidebar"
                >
                    <Menu size={24} />
                </button>

                {/* Mobile Logo */}
                <span className="font-bold text-xl lg:hidden">NovaStream</span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 md:flex items-center max-w-md w-full mx-4 relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors" size={18} />
                <input
                    type="text"
                    placeholder="Search movies, shows..."
                    aria-label="Search content"
                    className="w-full bg-zinc-900/80 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all shadow-inner"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            const query = e.currentTarget.value;
                            if (query.trim()) {
                                router.push(`/search?q=${encodeURIComponent(query)}`);
                            }
                        }
                    }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:block">
                    <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-zinc-800 text-[10px] text-zinc-500 font-mono">
                        /
                    </kbd>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <NotificationDropdown />

                <Link href="/profile" className="flex items-center gap-2 pl-2 border-l border-white/10 group">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border border-white/10 group-hover:border-red-500/50 transition-colors">
                        <img 
                            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'user'}`} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="hidden sm:block text-xs font-semibold text-zinc-400 group-hover:text-white transition-colors">
                        {user?.username || 'Guest'}
                    </span>
                </Link>
            </div>
        </header>
    );
}
