import React from 'react';

interface ContentItem {
    id: string;
    title: string;
    poster: string;
    type: string;
}

interface ContentListProps {
    title: string;
    items: ContentItem[];
    onItemClick: (item: ContentItem) => void;
}

export const ContentList: React.FC<ContentListProps> = ({ title, items, onItemClick }) => {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold px-4">{title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 px-4 pb-10">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="group relative cursor-pointer transition-transform duration-200 hover:scale-105"
                        onClick={() => onItemClick(item)}
                    >
                        <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-neutral-800">
                            <img
                                src={item.poster}
                                alt={item.title}
                                className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-75"
                            />
                        </div>
                        <div className="mt-2">
                            <h3 className="text-sm font-medium line-clamp-1">{item.title}</h3>
                            <p className="text-xs text-neutral-400 uppercase">{item.type}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ContentList;
