
// Removed static import to fix [ERR_REQUIRE_ESM] in CommonJS build
// import { pipeline, env } from '@xenova/transformers';

class AIService {
    private extractor: any = null;
    private transformerModule: any = null;

    async init() {
        if (!this.extractor) {
            console.log('Initializing AIService: Loading Transformers.js dynamically...');
            
            // Dynamic import to support ESM package in CommonJS runtime
            try {
                this.transformerModule = await import('@xenova/transformers');
                
                // Configure Env
                const { env, pipeline } = this.transformerModule;
                env.allowRemoteModels = true;
                env.useBrowserCache = false;

                console.log('Initializing AIService: Loading all-MiniLM-L6-v2 model...');
                this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
                console.log('AIService: Model loaded successfully.');
            } catch (err) {
                 console.error('AIService Critical Error: Failed to load transformers.', err);
            }
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        await this.init();
        if (!this.extractor) return []; // Fail gracefully if model fetch failed

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
