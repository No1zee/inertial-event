import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Search, User, Bell } from 'lucide-react';

export const Header: React.FC = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <header className="fixed top-4 left-6 right-6 h-16 glass-nav z-40 flex items-center justify-between px-6 rounded-2xl shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-8">
                <Link href="/">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent cursor-pointer">
                        NOVASTREAM
                    </h1>
                </Link>
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
                    <Link href="/" className="hover:text-white transition-colors focus:text-white outline-none">Home</Link>
                    <Link href="/browse/movies" className="hover:text-white transition-colors focus:text-white outline-none">Movies</Link>
                    <Link href="/browse/tv-shows" className="hover:text-white transition-colors focus:text-white outline-none">TV Shows</Link>
                    <Link href="/browse/anime" className="hover:text-white transition-colors focus:text-white outline-none">Anime</Link>
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <form onSubmit={handleSearch} className="relative hidden sm:block">
                    <label htmlFor="search-input" className="sr-only">Search titles</label>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                    <input
                        id="search-input"
                        type="text"
                        placeholder="Search titles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 w-64 transition-all"
                    />
                </form>
                <button 
                    className="text-neutral-400 hover:text-white p-2 focus:text-white outline-none"
                    aria-label="Notifications"
                >
                    <Bell size={20} />
                </button>
                <button 
                    className="flex items-center gap-2 rounded-full border border-neutral-800 p-1 pr-3 hover:bg-neutral-900 transition-colors focus:ring-2 focus:ring-red-500/50 outline-none"
                    aria-label="User profile"
                >
                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                        <User size={16} />
                    </div>
                    <span className="text-sm font-medium hidden lg:inline">Guest</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
