"use client";

import { useState, useEffect } from "react";
import { Folder, FileVideo, File as FileIcon, ChevronRight, Home, ArrowLeft, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface FileItem {
    name: string;
    isDirectory: boolean;
    path: string;
    size: number;
}

export function FileExplorer() {
    const router = useRouter();
    const [currentPath, setCurrentPath] = useState<string>("/"); // Default to root or a safe start
    const [items, setItems] = useState<FileItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial load
    useEffect(() => {
        loadDirectory(currentPath);
    }, []);

    const loadDirectory = async (path: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // Using the full URL to ensure we hit the backend port 5000 if not proxying
            // Assuming Next.js rewrites or direct call. Using default localhost:5000 for now based on context.
            // In layout we have NEXT_PUBLIC_API_URL but let's be robust.
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

            const encodedPath = encodeURIComponent(path);
            const res = await fetch(`${apiUrl}/tunnel/list?path=${encodedPath}`);

            if (!res.ok) throw new Error("Failed to load directory");

            const data = await res.json();

            // Sort: Folders first, then files
            const sorted = (data.files || []).sort((a: FileItem, b: FileItem) => {
                if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
                return a.isDirectory ? -1 : 1;
            });

            setItems(sorted);
            setCurrentPath(data.path);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavigate = (path: string) => {
        loadDirectory(path);
    };

    const handleUp = () => {
        // Simple parent resolution
        // Windows path handling might be tricky with simple string manipulation but trying standard separators
        const separator = currentPath.includes("\\") ? "\\" : "/";
        const parts = currentPath.split(separator);
        parts.pop(); // Remove current
        const parent = parts.join(separator) || separator; // Fallback to root if empty
        loadDirectory(parent);
    };

    const handlePlay = (item: FileItem) => {
        // Navigate to watch page with special local file ID
        // We'll need to handle this in /watch/[id] page to recognize "local:" prefix or query param
        const encodedPath = encodeURIComponent(item.path);
        router.push(`/watch/local?path=${encodedPath}&name=${encodeURIComponent(item.name)}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded-xl border border-white/5">
                <button
                    onClick={handleUp}
                    disabled={isLoading}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 font-mono text-sm text-zinc-400">
                    <Home size={16} className="shrink-0" />
                    <span className="text-zinc-600">/</span>
                    <span className="text-white whitespace-nowrap">{currentPath}</span>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
                    Error: {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {items.map((item) => (
                    <div
                        key={item.path}
                        onClick={() => item.isDirectory ? handleNavigate(item.path) : handlePlay(item)}
                        className={cn(
                            "group flex items-center gap-3 p-3 rounded-lg border border-white/5 transition-all cursor-pointer",
                            item.isDirectory
                                ? "bg-zinc-900/50 hover:bg-zinc-800 hover:border-white/10"
                                : "bg-zinc-950 hover:bg-zinc-900 hover:border-red-500/20"
                        )}
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            item.isDirectory ? "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20" : "bg-red-500/10 text-red-500 group-hover:bg-red-500/20"
                        )}>
                            {item.isDirectory ? <Folder size={20} /> : <FileVideo size={20} />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-white truncate group-hover:text-red-500 transition-colors">
                                {item.name}
                            </h3>
                            <p className="text-xs text-zinc-500 truncate">
                                {item.isDirectory ? "Folder" : "Media File"}
                            </p>
                        </div>

                        {!item.isDirectory && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play size={16} className="text-white fill-current" />
                            </div>
                        )}
                    </div>
                ))}

                {items.length === 0 && !isLoading && !error && (
                    <div className="col-span-full py-12 text-center text-zinc-500">
                        This folder is empty.
                    </div>
                )}
            </div>
        </div>
    );
}
