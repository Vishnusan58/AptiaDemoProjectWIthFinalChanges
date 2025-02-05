// src/app/api/rag/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const KNOWLEDGE = `
Horizon blue covers various medical services with different cost-sharing structures. Physician visits for injury/illness require a $20 copayment in-network and 30% coinsurance out-of-network. Diagnostic tests like X-rays and blood work are free in-network but have 30% coinsurance out-of-network. Imaging (CT/PET/MRIs) is also free in-network with the same out-of-network coinsurance. Generic drugs have a $10 copay for a 30-day supply and $20 for a 90-day supply, requiring prior authorization. Outpatient surgery has a $150 copay in-network and 30% coinsurance out-of-network, with prior review for spine-related procedures. Emergency room care has a $100 copay per visit, regardless of network status, with no deductible. Pregnancy and childbirth professional services have a $20 copay in-network and 30% coinsurance out-of-network, with no cost-sharing for preventive services. Durable medical equipment requires 50% coinsurance both in and out of network, with a 50% penalty for non-compliance. For full details, visit Horizon Blue Member Services.
`;

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'your_google_key';
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        if (!message?.trim()) {
            return NextResponse.json(
                { type: 'error', message: 'Please enter a question' },
                { status: 400 }
            );
        }

        // In your POST handler:
        const prompt = `
You are a Horizon BCBSNJ expert. Use ONLY this context:
${KNOWLEDGE}

Question: ${message}

Answer in exactly in 50 words and form it relevant to the question
`;

        const result = await model.generateContent(prompt);
        const response = await result.response.text();

        return NextResponse.json({
            type: 'ai_response',
            message: response,
            metadata: {
                confidence: 1,
                planName: 'Horizon Blue'
            }
        });

    } catch (error) {
        return NextResponse.json(
            { type: 'error', message: 'Error processing request' },
            { status: 500 }
        );
    }
}