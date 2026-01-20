
import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
    aspectRatio?: "portrait" | "landscape";
}

export function ContentCardSkeleton({ className, aspectRatio = "portrait" }: SkeletonProps) {
    const isPortrait = aspectRatio === "portrait";

    return (
        <div 
            className={cn(
                "relative rounded-md overflow-hidden bg-zinc-900 shrink-0 animate-pulse",
                isPortrait ? "w-[160px] md:w-[200px] aspect-[2/3]" : "w-[260px] aspect-video",
                className
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-800 to-zinc-900" />
            
            {/* Shimmer effect overlay */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent shadow-xl" />
        </div>
    );
}
