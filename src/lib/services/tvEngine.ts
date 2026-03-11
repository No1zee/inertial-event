import { Content } from "@/lib/types/content";
import { contentApi } from "@/lib/api/content";

export interface Channel {
    id: string;
    name: string;
    genre: string;
    logo?: string;
    fetcher: () => Promise<Content[]>;
    description?: string;
    branding?: {
        color: string; // Theme color (e.g. #FF0000)
        icon?: string; // Icon identifier or name
        theme: 'dark' | 'light' | 'vibrant';
    };
}

export interface Program {
    content: Content;
    startTime: number; // UNIX timestamp
    endTime: number;
    durationMs: number;
}

export interface CurrentProgramStatus {
    channelId: string;
    currentProgram: Program;
    nextProgram: Program;
    elapsedMs: number; // How far into the current program we are
}

const CHANNELS: Channel[] = [
    {
        id: "ch_adult_swim",
        name: "Adult Swim",
        genre: "Animation",
        fetcher: contentApi.getAdultAnimation,
        description: "The home for late-night animation and off-beat comedy.",
        branding: { color: "#000000", theme: "dark" }
    },
    {
        id: "ch_action",
        name: "Adrenaline",
        genre: "Action",
        fetcher: () => contentApi.getByGenre(10759, 'tv'), // Action TV
        description: "Non-stop explosions and chase scenes.",
        branding: { color: "#ef4444", theme: "vibrant" }
    },
    {
        id: "ch_comedy",
        name: "Giggles",
        genre: "Comedy",
        fetcher: () => contentApi.getByGenre(35, 'tv'), // Comedy TV
        description: "Laugh until it hurts.",
        branding: { color: "#facc15", theme: "light" }
    },
    {
        id: "ch_scifi",
        name: "Warp Speed",
        genre: "Sci-Fi",
        fetcher: () => contentApi.getByGenre(10765, 'tv'), // Sci-Fi TV
        description: "The future is now.",
        branding: { color: "#3b82f6", theme: "vibrant" }
    },
    {
        id: "ch_horror",
        name: "Scream Stream",
        genre: "Horror",
        fetcher: () => contentApi.getByGenre(27, 'movie'),
        description: "Keep the lights on.",
        branding: { color: "#7c3aed", theme: "dark" }
    },
    {
        id: "ch_anime",
        name: "Otaku TV",
        genre: "Anime",
        fetcher: contentApi.getAnime,
        description: "The best from Japan.",
        branding: { color: "#db2777", theme: "vibrant" }
    }
];

// Cache for generated schedules
let scheduleCache: Record<string, Program[]> = {};
const CACHE_DURATION = 1000 * 60 * 60 * 6; // 6 hours

export const tvEngine = {
    getChannels: () => CHANNELS,

    getChannelSchedule: async (channelId: string): Promise<Program[]> => {
        // Return cached if available
        if (scheduleCache[channelId]) return scheduleCache[channelId];

        const channel = CHANNELS.find(c => c.id === channelId);
        if (!channel) return [];

        const content = await channel.fetcher();
        if (!content.length) return [];

        // Generate a pseudo-schedule starting from TODAY 00:00
        // We loop the content to fill 24 hours
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let startTime = today.getTime();

        const schedule: Program[] = [];
        let contentIndex = 0;

        // Generate 48 hours of programming to be safe
        const END_TIME = startTime + (1000 * 60 * 60 * 48);

        while (startTime < END_TIME) {
            const item = content[contentIndex % content.length];
            // If duration missing, assume 2 hours for movies, 30m for TV as failsafe
            const durationMins = item.duration || (item.type === 'movie' ? 120 : 30);
            const durationMs = durationMins * 60 * 1000;

            schedule.push({
                content: item,
                startTime: startTime,
                endTime: startTime + durationMs,
                durationMs
            });

            startTime += durationMs;
            contentIndex++;
        }

        scheduleCache[channelId] = schedule;
        return schedule;
    },

    getCurrentProgram: async (channelId: string): Promise<CurrentProgramStatus | null> => {
        const schedule = await tvEngine.getChannelSchedule(channelId);
        const now = Date.now();

        const current = schedule.find(p => p.startTime <= now && p.endTime > now);
        if (!current) return null;

        const next = schedule.find(p => p.startTime === current.endTime);

        return {
            channelId,
            currentProgram: current,
            nextProgram: next || current, // Fallback to loop
            elapsedMs: now - current.startTime
        };
    }
};
