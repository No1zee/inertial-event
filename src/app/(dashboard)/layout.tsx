"use client";

import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { ErrorBoundary } from "@/components/UI/ErrorBoundary";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <Sidebar />
            <div className="">
                <Navbar />
                <main className="w-full">
                    <Suspense fallback={
                        <div className="min-h-screen flex items-center justify-center">
                            <div className="text-white text-xl">Loading...</div>
                        </div>
                    }>
                        {children}
                    </Suspense>
                </main>
                {/* <ContentModal /> */}
            </div>
        </div>
    );
}
