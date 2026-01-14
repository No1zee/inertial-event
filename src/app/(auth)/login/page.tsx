"use client";

import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            login({
                id: "1",
                username: "Demo User",
                email: data.email,
                role: "user",
                avatar: "https://github.com/shadcn.png"
            }, "fake-jwt-token");

            setIsLoading(false);
            router.push("/");
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <span className="font-bold text-white text-xl">N</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back</h1>
                    <p className="text-zinc-400">Enter your credentials to access your library</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Email</label>
                        <input
                            {...register("email", { required: true })}
                            type="email"
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all"
                            placeholder="name@example.com"
                        />
                        {errors.email && <span className="text-red-500 text-xs">Email is required</span>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Password</label>
                        <div className="relative">
                            <input
                                {...register("password", { required: true })}
                                type={showPassword ? "text" : "password"}
                                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all pr-10"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && <span className="text-red-500 text-xs">Password is required</span>}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" className="rounded border-zinc-700 bg-zinc-900 text-red-600 focus:ring-red-600" />
                            <span className="text-zinc-400">Remember me</span>
                        </div>
                        <Link href="/forgot-password" className="text-red-500 hover:text-red-400 font-medium">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        disabled={isLoading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading && <Loader2 size={18} className="animate-spin" />}
                        {isLoading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="text-center text-sm text-zinc-500">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-white hover:underline underline-offset-4">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
