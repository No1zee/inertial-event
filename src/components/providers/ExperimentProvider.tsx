"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getExperimentVariant } from '@/lib/experiment';

interface ExperimentContextType {
    getVariant: (id: string) => string;
}

const ExperimentContext = createContext<ExperimentContextType | undefined>(undefined);

export const ExperimentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [variants, setVariants] = useState<Record<string, string>>({});

    useEffect(() => {
        // Initialize basic experiments
        const heroVariant = getExperimentVariant('hero_layout');
        setVariants({
            'hero_layout': heroVariant
        });
    }, []);

    const getVariant = (id: string) => variants[id] || 'A';

    return (
        <ExperimentContext.Provider value={{ getVariant }}>
            {children}
        </ExperimentContext.Provider>
    );
};

export const useExperiment = () => {
    const context = useContext(ExperimentContext);
    if (!context) {
        throw new Error('useExperiment must be used within an ExperimentProvider');
    }
    return context;
};
