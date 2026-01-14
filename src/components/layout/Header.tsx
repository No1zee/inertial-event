import React from 'react';
import { Search, User, Bell } from 'lucide-react';

export const Header: React.FC = () => {
    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 z-40 flex items-center justify-between px-6">
            <div className="flex items-center gap-8">
                <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                    NOVASTREAM
                </h1>
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
                    <a href="#" className="hover:text-white transition-colors">Home</a>
                    <a href="#" className="hover:text-white transition-colors">Movies</a>
                    <a href="#" className="hover:text-white transition-colors">TV Shows</a>
                    <a href="#" className="hover:text-white transition-colors">Anime</a>
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search titles..."
                        className="bg-neutral-900 border border-neutral-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 w-64"
                    />
                </div>
                <button className="text-neutral-400 hover:text-white p-2">
                    <Bell size={20} />
                </button>
                <button className="flex items-center gap-2 rounded-full border border-neutral-800 p-1 pr-3 hover:bg-neutral-900 transition-colors">
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
