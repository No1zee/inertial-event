import React from 'react';
import { OptimizedImage } from '../ui/OptimizedImage';

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
        {items.map(item => (
          <div
            key={item.id}
            className="group relative cursor-pointer transition-transform duration-200 hover:scale-105"
            onClick={() => onItemClick(item)}
          >
            <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-neutral-800">
              <div className="relative w-full h-full">
                <OptimizedImage
                  src={item.poster}
                  alt={item.title}
                  fill
                  className="object-cover transition-opacity duration-200 group-hover:opacity-75"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, 15vw"
                />
              </div>
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
