type ExperimentGroup = 'A' | 'B';

interface ExperimentConfig {
    id: string;
    variants: ExperimentGroup[];
}

const EXPERIMENTS: Record<string, ExperimentConfig> = {
    'hero_layout': {
        id: 'hero_layout',
        variants: ['A', 'B']
    }
};

export const getExperimentVariant = (experimentId: string): ExperimentGroup => {
    if (typeof window === 'undefined') return 'A';

    const storageKey = `exp_${experimentId}`;
    const cached = localStorage.getItem(storageKey) as ExperimentGroup;

    if (cached && EXPERIMENTS[experimentId].variants.includes(cached)) {
        return cached;
    }

    // Assign new variant
    const variants = EXPERIMENTS[experimentId].variants;
    const assigned = variants[Math.floor(Math.random() * variants.length)];
    localStorage.setItem(storageKey, assigned);
    
    console.log(`[Experiment] Assigned ${assigned} to ${experimentId}`);
    return assigned;
};

export const logExperimentEvent = (experimentId: string, variant: ExperimentGroup, eventName: string) => {
    console.log(`[Experiment Event] ${experimentId} (${variant}): ${eventName}`);
    // In a real app, send to analytics here
};
