"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Brand Data
const BRANDS = [
    {
        id: 'disney',
        name: 'Disney',
        video: 'https://vod-bgc-na-east-1.media.dssott.com/bgui/ps01/disney/bgui/2019/08/01/1564674844-disney.mp4',
        image: '/providers/disney.svg', 
        gradient: 'bg-gradient-to-b from-[#113CCF] to-[#0f1014]'
    },
    {
        id: 'pixar',
        name: 'Pixar',
        video: 'https://vod-bgc-na-east-1.media.dssott.com/bgui/ps01/disney/bgui/2019/08/01/1564676714-pixar.mp4',
        image: 'https://images.ctfassets.net/usf1vwtuqyxm/1d4x91D0F8d9d8x1d8d/5d1d8d1d8d1d8d1d8d1d8d1d8d1d8d1d/pixar.svg',
        gradient: 'bg-gradient-to-b from-[#113CCF] to-[#0f1014]'
    },
    {
        id: 'marvel',
        name: 'Marvel',
        video: 'https://vod-bgc-na-east-1.media.dssott.com/bgui/ps01/disney/bgui/2019/08/01/1564676115-marvel.mp4',
        image: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Marvel_Logo.svg',
        gradient: 'bg-gradient-to-b from-[#ED1D24] to-[#0f1014]'
    },
    {
        id: 'starwars',
        name: 'Star Wars',
        video: 'https://vod-bgc-na-east-1.media.dssott.com/bgui/ps01/disney/bgui/2020/12/17/1608229455-star-wars.mp4',
        image: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Star_Wars_Logo.svg',
        gradient: 'bg-gradient-to-b from-[#FFE81F] to-[#0f1014]'
    },
    {
        id: 'natgeo',
        name: 'National Geographic',
        video: 'https://vod-bgc-na-east-1.media.dssott.com/bgui/ps01/disney/bgui/2019/08/01/1564676296-national-geographic.mp4',
        image: 'https://upload.wikimedia.org/wikipedia/commons/6/67/National_Geographic_Logo.svg',
        gradient: 'bg-gradient-to-b from-[#FFCC00] to-[#0f1014]'
    }
];

export function DisneyBrandRail() {
    const router = useRouter();

    return (
        <div className="px-4 md:px-12 mb-12">
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {BRANDS.map((brand) => (
                    <div 
                        key={brand.id}
                        className={cn(
                            "relative aspect-video rounded-xl overflow-hidden cursor-pointer group",
                            "border border-white/10 shadow-lg bg-gradient-to-br from-[#30323e] to-[#1e1f2a]",
                            "hover:scale-105 hover:border-white transition-all duration-300 hover:shadow-2xl"
                        )}
                        onClick={() => {
                            // Navigate to browse page with company filter
                            // Using TMDB company IDs: Disney=2, Pixar=3, Marvel=420, Lucasfilm=1, National Geographic=7521
                            const companyIds: Record<string, number> = {
                                'disney': 2,
                                'pixar': 3,
                                'marvel': 420,
                                'starwars': 1,
                                'natgeo': 7521
                            };
                            const companyId = companyIds[brand.id];
                            if (companyId) {
                                router.push(`/browse?company=${companyId}&name=${encodeURIComponent(brand.name)}`);
                            }
                        }}
                    >
                        <video 
                            src={brand.video}
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        />
                        <div className="absolute inset-0 flex items-center justify-center p-4 z-10 pointer-events-none">
                            <img 
                                src={brand.image} 
                                alt={brand.name}
                                className="w-full h-full object-contain drop-shadow-lg"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                         <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
                    </div>
                ))}
             </div>
        </div>
    );
}
