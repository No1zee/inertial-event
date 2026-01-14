import ContentCard from './ContentCard';
import { ChevronRight } from 'lucide-react';


interface ContentRailProps {
    title: string;
    items: any[];
    railIndex: number;
    focusedIndex?: { rail: number; item: number };
    setFocusedIndex?: (index: { rail: number; item: number }) => void;
}

export const ContentRail: React.FC<ContentRailProps> = ({
    title,
    items,
    railIndex,
    focusedIndex,
    setFocusedIndex
}) => {
    if (!items || items.length === 0) return null;

    return (
        <div className="w-full space-y-4 py-8 px-4 lg:px-10">
            <div className="flex items-center justify-between group cursor-pointer">
                <h2 className="text-2xl font-bold text-white tracking-tight group-hover:text-red-500 transition-colors capitalize">
                    {title}
                </h2>
                <div className="flex items-center text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm font-bold">See All</span>
                    <ChevronRight size={20} />
                </div>
            </div>

            <div className="flex space-x-6 overflow-x-auto pb-8 scrollbar-hide snap-x px-2 -mx-2">
                {items.map((item, itemIndex) => (
                    <ContentCard
                        key={item.id || item._id}
                        item={item}
                        isFocused={focusedIndex?.rail === railIndex && focusedIndex?.item === itemIndex}
                        onFocus={() => setFocusedIndex?.({ rail: railIndex, item: itemIndex })}
                    />
                ))}
            </div>
        </div>
    );
};

export default ContentRail;
