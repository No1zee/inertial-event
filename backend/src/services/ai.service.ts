import { pipeline, env } from '@xenova/transformers';

// Disable remote models for privacy and speed - force local execution
env.allowRemoteModels = true;
env.useBrowserCache = false;

class AIService {
    private extractor: any = null;

    async init() {
        if (!this.extractor) {
            console.log('Initializing AIService: Loading all-MiniLM-L6-v2 model...');
            this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
            console.log('AIService: Model loaded successfully.');
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        await this.init();
        const output = await this.extractor(text, {
            pooling: 'mean',
            normalize: true,
        });
        return Array.from(output.data);
    }

    /**
     * Prepare text for embedding by combining relevant fields
     */
    prepareText(title: string, description: string, genres: string[]): string {
        return `Title: ${title}. Description: ${description}. Genres: ${genres.join(', ')}.`;
    }
}

export const aiService = new AIService();
