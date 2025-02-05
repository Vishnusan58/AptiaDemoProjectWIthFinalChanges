import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

// Configuration constants
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || 'your_pinecone_key';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your_openai_key';
const DIMENSION = 1024; // Using 1024 dimensions for embeddings
const DEFAULT_INDEX = 'formatedhorizon'; // Default Pinecone index

// Interface definitions
interface RAGResponse {
    type: 'ai_response' | 'error';
    message: string;
    metadata?: {
        context?: string;
        confidence: number;
        planName?: string;
    };
}

// Plan configuration
interface PlanConfig {
    indexName: string;
    displayName: string;
    description: string;
}

const PLAN_CONFIGS: { [key: string]: PlanConfig } = {
    'formatedhorizon': {
        indexName: 'formatedhorizon',
        displayName: 'Horizon Blue Cross Blue Shield',
        description: 'Comprehensive healthcare coverage by Horizon Blue Cross Blue Shield'
    }
};

// Initialize Pinecone client
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });

// Initialize OpenAI
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Get plan configuration by name, defaults to Horizon Blue
 */
function getPlanConfig(planName?: string): PlanConfig {
    if (!planName) return PLAN_CONFIGS[DEFAULT_INDEX];
    const normalizedPlanName = planName.toLowerCase().replace(/\s+/g, '');
    return PLAN_CONFIGS[normalizedPlanName] || PLAN_CONFIGS[DEFAULT_INDEX];
}

/**
 * Generates embeddings for the input text using OpenAI's text-embedding-3-large
 * and truncates the vector to 1024 dimensions.
 */
async function generateEmbeddings(text: string): Promise<number[]> {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-large",
            input: text
        });

        return response.data[0].embedding.slice(0, 1024); // Truncate to 1024 dimensions
    } catch (error) {
        console.error('Error generating embeddings:', error);
        return Array(DIMENSION).fill(0);
    }
}

/**
 * Retrieves the best-matching context for a query
 */
async function retrieveSingleBestContext(queryEmbedding: number[], index: any): Promise<string> {
    try {
        const results = await index.query({
            vector: queryEmbedding,
            topK: 7, // Increased topK for better retrieval
            includeMetadata: true
        });

        if (results.matches.length === 0) return "";

        // Selecting the best match based on confidence score
        results.matches.sort((a: any, b: any) => b.score - a.score);
        return results.matches[0].metadata.text;
    } catch (error) {
        console.error('Error retrieving context:', error);
        return "";
    }
}

/**
 * Generates a response using OpenAI GPT-4o-mini
 */
async function generateResponse(query: string, context: string, planConfig: PlanConfig): Promise<string> {
    try {
        const prompt = `
You are an expert assistant answering questions about ${planConfig.displayName}. 
Use ONLY the given context to answer the question concisely.

Context:
${context}

Question: ${query}

Answer:
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: "You are an expert insurance assistant." }, { role: "user", content: prompt }],
            max_tokens: 150,
            temperature: 0.3
        });

        return response.choices[0]?.message?.content || "I'm unable to generate a response at this time.";
    } catch (error) {
        console.error('Error generating response:', error);
        return "An error occurred while generating the response.";
    }
}

/**
 * Main RAG system query function
 */
export async function queryRAGSystem(query: string, planName?: string): Promise<RAGResponse> {
    try {
        if (!query.trim()) {
            throw new Error("Query cannot be empty");
        }

        const planConfig = getPlanConfig(planName);
        const queryEmbedding = await generateEmbeddings(query);
        const index = pinecone.index(planConfig.indexName);
        const context = await retrieveSingleBestContext(queryEmbedding, index);

        if (!context) {
            return {
                type: 'ai_response',
                message: `I don't have specific information about that aspect of ${planConfig.displayName}.`,
                metadata: { confidence: 0, planName: planConfig.displayName }
            };
        }

        const response = await generateResponse(query, context, planConfig);
        return {
            type: 'ai_response',
            message: response,
            metadata: { context, confidence: 1, planName: planConfig.displayName }
        };
    } catch (error) {
        console.error('RAG System Error:', error);
        return {
            type: 'error',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
            metadata: { confidence: 0 }
        };
    }
}

// Export helper functions for testing
export const _test = {
    generateEmbeddings,
    retrieveSingleBestContext,
    generateResponse,
    getPlanConfig
};
