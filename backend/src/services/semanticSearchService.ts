import { Content, IContent } from '../models/Content.js';
import { aiService } from './ai.service.js';

class SemanticSearchService {
    /**
     * Compute cosine similarity between two vectors
     */
    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Perform semantic search across content
     */
    async search(query: string, limit: number = 10): Promise<any[]> {
        // 1. Generate embedding for the query
        const queryEmbedding = await aiService.generateEmbedding(query);

        // 2. Fetch all content with embeddings
        // In a production app, we would use a vector database like Pinecone or Weaviate,
        // or MongoDB Atlas Vector Search. For this local project, we perform in-memory ranking.
        const allContent = await (Content as any).find({ 
            embedding: { $exists: true, $not: { $size: 0 } } 
        }).lean();

        if (allContent.length === 0) {
            return [];
        }

        // 3. Rank by similarity
        const ranked = allContent.map((item: any) => ({
            ...item,
            score: this.cosineSimilarity(queryEmbedding, item.embedding)
        }));

        // 4. Sort and return top results
        return (ranked as any[])
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => {
                const { embedding, ...rest } = item; // Don't send large embedding to client
                return rest;
            });
    }

    /**
     * Background task to populate missing embeddings
     */
    async syncEmbeddings() {
        console.log('SemanticSearchService: Starting embedding sync...');
        const missing = await (Content as any).find({
            $or: [
                { embedding: { $exists: false } },
                { embedding: { $size: 0 } }
            ]
        });

        console.log(`SemanticSearchService: Found ${missing.length} items missing embeddings.`);

        for (const item of missing) {
            try {
                const text = aiService.prepareText(item.title, item.description, item.genres);
                const embedding = await aiService.generateEmbedding(text);
                await (Content as any).updateOne({ _id: item._id }, { $set: { embedding } });
                console.log(`SemanticSearchService: Synced "${item.title}"`);
            } catch (err) {
                console.error(`SemanticSearchService: Failed to sync "${item.title}":`, err);
            }
        }
        console.log('SemanticSearchService: Embedding sync complete.');
    }
}

export const semanticSearchService = new SemanticSearchService();
