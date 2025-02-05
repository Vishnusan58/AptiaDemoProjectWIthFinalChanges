import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const KNOWLEDGE = `Horizon blue covers various medical services with different cost-sharing structures. Physician visits for injury/illness require a $20 copayment in-network and 30% coinsurance out-of-network. Diagnostic tests like X-rays and blood work are free in-network but have 30% coinsurance out-of-network. Imaging (CT/PET/MRIs) is also free in-network with the same out-of-network coinsurance. Generic drugs have a $10 copay for a 30-day supply and $20 for a 90-day supply, requiring prior authorization. Outpatient surgery has a $150 copay in-network and 30% coinsurance out-of-network, with prior review for spine-related procedures. Emergency room care has a $100 copay per visit, regardless of network status, with no deductible. Pregnancy and childbirth professional services have a $20 copay in-network and 30% coinsurance out-of-network, with no cost-sharing for preventive services. Durable medical equipment requires 50% coinsurance both in and out of network, with a 50% penalty for non-compliance. For full details, visit Horizon Blue Member Services.
`;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your_openai_key';
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        if (!message?.trim()) {
            return NextResponse.json(
                { type: 'error', message: 'Please enter a question' },
                { status: 400 }
            );
        }

        const prompt = `
You are a Horizon BCBSNJ expert. Use ONLY this context:
${KNOWLEDGE}

Question: ${message}

Provide a clear, concise response (max 70 words) relevant to the question.
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Using GPT-4o-mini for optimized performance
            messages: [{ role: "system", content: "You are an expert insurance assistant." }, { role: "user", content: prompt }],
            max_tokens: 100,
            temperature: 0.3 // Lower temperature for consistency
        });

        const reply = response.choices[0]?.message?.content || "I'm unable to generate a response at this time.";

        return NextResponse.json({
            type: 'ai_response',
            message: reply,
            metadata: {
                confidence: 1,
                planName: 'Horizon BCBSNJ Direct Access Platinum'
            }
        });

    } catch (error) {
        console.error('Error processing OpenAI request:', error);
        return NextResponse.json(
            { type: 'error', message: 'Error processing request' },
            { status: 500 }
        );
    }
}
