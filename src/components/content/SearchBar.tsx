import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = "Search for movies, TV shows, anime..." }) => {
    const [query, setQuery] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <form onSubmit={handleSubmit} className="relative w-full max-w-2xl px-4">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-4 pl-12 pr-12 text-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all shadow-lg"
            />
            {query && (
                <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-7 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                    <X size={20} />
                </button>
            )}
        </form>
    );
};

export default SearchBar;
