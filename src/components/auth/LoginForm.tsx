"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/UI/button";
import { motion } from "framer-motion";

export function LoginForm() {
    const { login } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        setTimeout(() => {
            login({
                id: "user_123",
                username: "NovaExplorer",
                email: email || "demo@novastream.ai",
                role: "user",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=NovaExplorer"
            }, "mock_token_abc");
            setLoading(false);
        }, 1500);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-zinc-900/50 border border-white/5 p-8 md:p-10 rounded-[2.5rem] backdrop-blur-xl shadow-2xl mt-24"
        >
            <div className="space-y-2 mb-8 text-center">
                <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
                <p className="text-zinc-500 text-sm">Log in to sync your watchlist across devices.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase ml-2 tracking-widest">Email</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors" size={20} />
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full bg-zinc-950 border border-white/5 focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none transition-all placeholder:text-zinc-700"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase ml-2 tracking-widest">Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors" size={20} />
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-zinc-950 border border-white/5 focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none transition-all placeholder:text-zinc-700"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between px-2 text-xs">
                    <label className="flex items-center gap-2 text-zinc-500 cursor-pointer">
                        <input type="checkbox" className="rounded-md bg-zinc-950 border-white/10 text-red-600 focus:ring-red-500/20" />
                        Remember me
                    </label>
                    <button type="button" className="text-red-500 hover:text-red-400 font-medium">Forgot password?</button>
                </div>

                <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-lg shadow-lg shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
                >
                    {loading ? (
                        <>
                            <Loader2 size={24} className="animate-spin mr-2" />
                            Signing in...
                        </>
                    ) : (
                        <>
                            Sign In
                            <ArrowRight size={20} className="ml-2" />
                        </>
                    )}
                </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-white/5 text-center">
                <p className="text-zinc-500 text-sm">
                    Don&apos;t have an account?{" "}
                    <button className="text-white font-bold hover:text-red-500 transition-colors">Create one now</button>
                </p>
            </div>
        </motion.div>
    );
}
