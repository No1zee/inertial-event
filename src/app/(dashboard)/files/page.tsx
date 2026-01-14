import { FileExplorer } from "@/components/files/FileExplorer";

export default function FilesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">LAN File Tunnel</h1>
                <p className="text-zinc-400 mt-2">
                    Browse and access files on your local machine securely.
                </p>
            </div>

            <FileExplorer />
        </div>
    );
}
