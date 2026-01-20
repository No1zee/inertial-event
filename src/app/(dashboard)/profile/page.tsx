"use client";

import { useAuthStore } from "@/lib/store/authStore";
import { useHistoryStore } from "@/lib/store/historyStore";
import { useWatchlistStore } from "@/lib/store/watchlistStore";
import { User, Mail, Shield, Clock, Bookmark, Camera, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/UI/button";

import { LoginForm } from "@/components/auth/LoginForm";

export default function ProfilePage() {
    const { user, logout } = useAuthStore();
    const historyCount = useHistoryStore(state => state.history.length);
    const watchlistCount = useWatchlistStore(state => state.watchlist.length);

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4">
                <LoginForm />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 pt-24 px-4 md:px-12 pb-20">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-8"
            >
                {/* Profile Header */}
                <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden bg-gradient-to-br from-red-600 to-red-900 shadow-2xl">
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-8 left-8 flex items-end gap-6">
                        <div className="relative group">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-zinc-900 border-4 border-zinc-950 overflow-hidden shadow-2xl">
                                <img 
                                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                                    alt={user.username}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button className="absolute -bottom-2 -right-2 p-2 bg-zinc-900 rounded-xl border border-white/10 text-white hover:bg-zinc-800 transition-colors shadow-xl">
                                <Camera size={16} />
                            </button>
                        </div>
                        <div className="pb-2">
                            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg">
                                {user.username}
                            </h1>
                            <p className="text-red-100/80 font-medium">NovaStream Member</p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                            <Clock size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{historyCount}</div>
                            <div className="text-xs text-zinc-500 uppercase font-semibold">Titles Watched</div>
                        </div>
                    </div>
                    <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                            <Bookmark size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{watchlistCount}</div>
                            <div className="text-xs text-zinc-500 uppercase font-semibold">In Watchlist</div>
                        </div>
                    </div>
                    <div className="hidden md:flex bg-zinc-900/50 border border-white/5 p-6 rounded-2xl items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                            <Shield size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{user.role.toUpperCase()}</div>
                            <div className="text-xs text-zinc-500 uppercase font-semibold">Account Status</div>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
                        <h2 className="text-xl font-bold text-white">Account Details</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                <User className="text-zinc-500" size={20} />
                                <div>
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Username</div>
                                    <div className="text-white font-medium">{user.username}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                <Mail className="text-zinc-500" size={20} />
                                <div>
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Email Address</div>
                                    <div className="text-white font-medium">{user.email}</div>
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full">Edit Profile</Button>
                    </div>

                    <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl flex flex-col justify-between">
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-white">Subscription</h2>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                You are currently on the <span className="text-white font-bold">Nova Premium</span> plan. 
                                Enjoy 4K streaming, offline downloads, and multi-device support.
                            </p>
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                <span className="text-red-500 font-bold">Next billing: Feb 15, 2026</span>
                            </div>
                        </div>
                        <Button variant="danger" className="mt-8" onClick={logout}>
                            <LogOut size={18} className="mr-2" />
                            Log Out
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
