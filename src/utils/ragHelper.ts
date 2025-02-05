// src/utils/ragHelper.ts
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { pipeline } from '@xenova/transformers';

const embedder = await pipeline('feature-extraction', 'WhereIsAI/UAE-Large-V1');

// Configuration constants
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || 'pinecone_key';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY 
const DIMENSION = 1024;
const DEFAULT_INDEX = 'formatedhorizon'; // Updated comment to match the default index

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

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Get plan configuration by name, defaults to Horizon Blue
 */
function getPlanConfig(planName?: string): PlanConfig {
    if (!planName) return PLAN_CONFIGS[DEFAULT_INDEX];
    const normalizedPlanName = planName.toLowerCase().replace(/\s+/g, '');
    return PLAN_CONFIGS[normalizedPlanName] || PLAN_CONFIGS[DEFAULT_INDEX];
}

/**
 * Generates embeddings for the input text
 */
async function generateEmbeddings(text: string): Promise<number[]> {
    try {
        const embeddings = await embedder(text, { pooling: 'mean', normalize: true }); // Optimized pooling method
        return embeddings.data.slice(0, 1024); // Ensure it matches the expected dimension
    } catch (error) {
        console.error('Error generating embeddings:', error);
        return Array(1024).fill(0);
    }
}

/**
 * Retrieves the best-matching context for a query
 */
async function retrieveSingleBestContext(queryEmbedding: number[], index: any): Promise<string> {
    try {
        const results = await index.query({
            namespace:"all-plans",
            vector: queryEmbedding,
            topK: 3, // Increased topK for better retrieval
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
 * Generates a response using Gemini
 */
async function generateResponse(query: string, context: string, planConfig: PlanConfig): Promise<string> {
    try {
        const prompt = `
You are a helpful assistant answering questions about ${planConfig.displayName}. 
try to answer from the context and assistant answer. Dont hallucinate

 

Context:
${context}

Question: ${query}

Answer:
`;

        const result = await model.generateContent(prompt);
        return result.response?.text() || "I couldn't generate a response at this time.";
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
