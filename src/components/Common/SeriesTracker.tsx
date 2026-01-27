"use client";

import React, { useEffect } from 'react';
import { useSeriesTrackingStore } from '@/lib/store/seriesTrackingStore';
import { contentApi } from '@/lib/api/content';
import { toast } from 'sonner';

export const SeriesTracker: React.FC = () => {
    const { trackedSeries, updateStatus } = useSeriesTrackingStore();

    useEffect(() => {
        const checkNewEpisodes = async () => {
            const seriesIds = Object.keys(trackedSeries);
            
            for (const id of seriesIds) {
                const series = trackedSeries[id];
                if (!series) continue;
                
                // Skip if we already flagged it as new or if we checked recently (e.g., last 6 hours)
                const lastChecked = series.lastChecked ? new Date(series.lastChecked).getTime() : 0;
                const now = new Date().getTime();
                if (series.hasNewEpisode && (now - lastChecked < 6 * 60 * 60 * 1000)) continue;

                try {
                    const details = await contentApi.getDetails(Number(id), 'tv');
                    
                    if (details && details.lastAirDate) {
                        const lastAir = new Date(details.lastAirDate);
                        const diffDays = (now - lastAir.getTime()) / (1000 * 3600 * 24);
                        
                        if (diffDays >= 0 && diffDays < 7 && !series.hasNewEpisode) {
                            updateStatus(id, true);
                            toast.info(`New episode of "${series.title}"!`, {
                                description: `Release date: ${details.lastAirDate}`,
                                duration: 3000,
                            });
                        }
                    }
                } catch (err) {
                    console.error(`Failed to check updates for series ${id}:`, err);
                }
            }
        };

        // Check on mount and then every hour
        checkNewEpisodes();
        const interval = setInterval(checkNewEpisodes, 3600 * 1000);
        return () => clearInterval(interval);
    }, [updateStatus]); // Only depend on updateStatus to prevent infinite loops

    return null; // Side-effect only component
};
