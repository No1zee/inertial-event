import { Navbar } from "@/components/layout/Navbar"; // New Navbar was likely created in lowercase 'layout' or 'Layout' depending on order. Check later.
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-red-500/30">
            <Sidebar />

            {/* Main Content Area */}
            {/* Main Content Area */}
            <div className="transition-[padding] duration-300 ease-in-out lg:pl-20">
                <Navbar />
                <main className="w-full animate-in fade-in duration-500">
                    {children}
                </main>
            </div>
        </div>
    );
}
