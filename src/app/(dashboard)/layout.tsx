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
            {/* lg:pl-20 matches the collapsed sidebar width */}
            <div className="lg:pl-20 transition-[padding] duration-300 ease-in-out">
                <Navbar />
                <main className="p-4 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                    {children}
                </main>
            </div>
        </div>
    );
}
