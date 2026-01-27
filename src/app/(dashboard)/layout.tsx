"use client";

import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useUIStore } from "@/lib/store/uiStore";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { sidebarOpen } = useUIStore();

    return (
        <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden selection:bg-primary/30">
            <Sidebar />
            <div className={cn(
                "flex flex-col min-h-screen transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-x-hidden",
                sidebarOpen ? "lg:pl-72" : "lg:pl-0"
            )}>
                <Navbar />
                <main className="flex-1 w-full transition-all duration-500 pb-20">
                    <Suspense fallback={
                        <div className="min-h-screen flex items-center justify-center bg-black/50 backdrop-blur-3xl">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                                <div className="text-zinc-400 font-bold tracking-widest text-sm uppercase animate-pulse">Initializing NovaStream...</div>
                            </div>
                        </div>
                    }>
                        {children}
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
