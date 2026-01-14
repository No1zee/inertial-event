import React, { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ContentCardProps {
    item: any;
    isFocused?: boolean;
    onFocus?: () => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({ item, isFocused, onFocus }) => {
    const router = useRouter();
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isFocused && cardRef.current) {
            cardRef.current.focus();
            cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [isFocused]);

    const handleClick = () => {
        router.push(`/watch/${item.id || item._id}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleClick();
        }
    };

    return (
        <div
            ref={cardRef}
            tabIndex={0}
            className={`flex-none w-64 aspect-[2/3] group cursor-pointer snap-start relative outline-none transition-transform duration-300 ${isFocused ? 'scale-110 z-10 ring-4 ring-red-500 shadow-2xl' : 'scale-100 hover:scale-105'
                }`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
        >
            <div className={`absolute inset-0 rounded-xl overflow-hidden shadow-lg border bg-neutral-900 ${isFocused ? 'border-red-500/50' : 'border-white/5'
                }`}>
                <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                />

                {/* Overlay Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent transition-opacity duration-300 ${isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`} />

                {/* Content Info */}
                <div className={`absolute bottom-4 left-4 right-4 transition-all duration-300 ${isFocused ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
                    }`}>
                    <p className="text-white font-bold truncate drop-shadow-2xl">{item.title}</p>
                    <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-300">
                        <span>{item.year}</span>
                        <span>•</span>
                        <span>{item.type}</span>
                    </div>
                </div>
            </div>

            {/* Rating Badge */}
            <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur rounded-md text-[10px] font-black text-yellow-500 border border-white/10">
                {item.rating || 'N/A'}
            </div>
        </div>
    );
};

export default ContentCard;
