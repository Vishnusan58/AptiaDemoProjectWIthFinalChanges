"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CoverageDetail {
    label: string;
    inNetwork: string;
    outOfNetwork: string;
}

interface InsurancePlan {
    planName: string;
    summary?: string;
    coverageDetails?: CoverageDetail[];
}

interface Message {
    type: 'user' | 'bot';
    content: string;
    recommendations?: InsurancePlan[];
    confidence?: number;
    options?: string[];
}

const CURRENT_PLAN: InsurancePlan = {
    planName: "Horizon Platinum",
    coverageDetails: [
        {
            label: "Maternity",
            inNetwork: "No Charge",
            outOfNetwork: "30% Coinsurance"
        },
        {
            label: "Children Eye Exam",
            inNetwork: "No Charge",
            outOfNetwork: "Not Covered"
        },
        {
            label: "Children Glasses",
            inNetwork: "Amount > $150",
            outOfNetwork: "Not Covered"
        },
        {
            label: "Children Dental",
            inNetwork: "Not Covered",
            outOfNetwork: "Not Covered"
        },
        {
            label: "Vaccination",
            inNetwork: "No Charge",
            outOfNetwork: "No Charge (Deductible Doesn't Apply)"
        }
    ]
};

const AVAILABLE_PLANS: InsurancePlan[] = [
    {
        planName: "Horizon Platinum",
        summary: "Horizon BCBSNJ Direct Access Platinum BlueCard has a $1,500 individual/$3,000 family deductible for out-of-network providers, while preventive care is covered without cost-sharing. Maternity services include $20 copay for office visits, $40 for specialists, no charge for in-network childbirth professional services, and a $250 per day copay for facility services (max $1,250 per admission). Children's eye exams are covered in-network, with a $150 frame allowance for glasses, but dental check-ups are not covered. This plan is suitable for a pregnant person and families with children due to comprehensive maternity coverage, no-cost preventive care, and vision benefits for kids while ensuring lower costs through in-network providers."
    },
    {
        planName: "United Healthcare",
        summary: "UnitedHealthcare EPO plan has no overall deductible and an out-of-pocket limit of $3,500 (individual) and $7,000 (family). Maternity services include no charge for office visits and professional services, with a $200 per day copay for facility services (max $400 per admission). Children's eye exams cost $10, glasses have 50% coinsurance, and dental check-ups are fully covered twice per year (up to age 19). This plan is suitable for a pregnant person and families with children due to comprehensive maternity coverage, no-cost preventive care, and essential vision and dental benefits for kids while ensuring lower costs through network providers."
    },
    {
        planName: "AmeriHealth Platinum",
        summary: "AmeriHealth Platinum EPO National Access with NY has no overall deductible and an out-of-pocket limit of $3,000 (individual) and $6,000 (family). Maternity services include no charge for preventive visits and professional services, with a $400 per day copay for facility services (max 5 copayments per admission). Children's eye exams and glasses are covered in-network, but dental check-ups are not included. This plan is suitable for a pregnant person and families with children due to comprehensive maternity coverage, no-cost preventive care, and essential vision benefits for kids while ensuring lower costs through in-network providers."
    }
];

const ChatInterface = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            type: 'bot',
            content: "Here is the summary of benefits and coverage under your current health plan.",
            recommendations: [CURRENT_PLAN]
        },
        {
            type: 'bot',
            content: "Would you like to update your current plan?",
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string>('');
    const [userId] = useState(() => Math.random().toString(36).substring(7));
    const [isCurrentPlanMode, setIsCurrentPlanMode] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleRagApiCall = async (userMessage: string) => {
        try {
            const response = await fetch('/api/rag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    userId: userId
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('RAG API Error:', error);
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMessage = inputValue;
        setInputValue('');
        setLoading(true);

        setMessages(prev => [...prev, { type: 'user', content: userMessage }]);

        try {
            if (userMessage.toLowerCase() === 'no' && !isCurrentPlanMode) {
                setIsCurrentPlanMode(true);
                try {
                    const data = await handleRagApiCall(userMessage);
                    setMessages(prev => [...prev, {
                        type: 'bot',
                        content: data.message,
                        confidence: data.metadata?.confidence
                    }]);
                } catch (error) {
                    setMessages(prev => [...prev, {
                        type: 'bot',
                        content: "I'm having trouble getting that information. Please try asking your question again."
                    }]);
                }
            }
            else if (isCurrentPlanMode) {
                try {
                    const data = await handleRagApiCall(userMessage);
                    setMessages(prev => [...prev, {
                        type: 'bot',
                        content: data.message,
                        confidence: data.metadata?.confidence
                    }]);
                } catch (error) {
                    setMessages(prev => [...prev, {
                        type: 'bot',
                        content: "I'm having trouble getting that information. Please try asking your question again."
                    }]);
                }
            }
            else if (userMessage.toLowerCase() === 'yes' || userMessage.toLowerCase() === "modify" && !selectedPlan) {
                setMessages(prev => [...prev, {
                    type: 'bot',
                    content: `What changes would you like to make to your plan? Do you want to adjust the coverage, update your hospital network, add family members, anticipate any extra expenses this year, or include services like maternity?`,
                }]);
            }
            else if ( userMessage.toLowerCase().includes('wife')) {
                setMessages(prev => [...prev, {
                    type: 'bot',
                    content: "Here are our recommended plans with maternity coverage:",
                    recommendations: AVAILABLE_PLANS.sort((a, b) => {
                        const aMaternity = a.summary.includes("maternity") ? 1 : 0;
                        const bMaternity = b.summary.includes("maternity") ? 1 : 0;
                        return bMaternity - aMaternity;
                    })
                }]);
            }
            else if (!selectedPlan && AVAILABLE_PLANS.some(plan => userMessage.includes(plan.planName))) {
                const plan = AVAILABLE_PLANS.find(p => userMessage.includes(p.planName));
                if (plan) {
                    setSelectedPlan(plan.planName);
                    setMessages(prev => [...prev, {
                        type: 'bot',
                        content: `You've selected ${plan.planName}. What questions do you have about this plan?`,
                        selectedPlan: plan.planName
                    }]);
                }
            }
            else if (selectedPlan) {
                try {
                    const data = await handleRagApiCall(userMessage);
                    setMessages(prev => [...prev, {
                        type: 'bot',
                        content: data.message,
                    }]);
                } catch (error) {
                    setMessages(prev => [...prev, {
                        type: 'bot',
                        content: "I'm having trouble getting that information. Please try asking your question again."
                    }]);
                }
            }
            else {
                setMessages(prev => [...prev, {
                    type: 'bot',
                    content: "I can help you better if you select a specific plan first. Would you like to see our available plans?",
                    options: ['Yes', 'No']
                }]);
            }
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                type: 'bot',
                content: "I apologize, but I'm having trouble processing your request. Please try again."
            }]);
        }

        setLoading(false);
    };

    const handlePlanSelection = async (planName: string) => {
        setSelectedPlan(planName);
        setMessages(prev => [...prev,
            { type: 'user', content: `I want to know more about ${planName}` },
            {
                type: 'bot',
                content: `You've selected ${planName}. How can I help you with this plan? Feel free to ask any questions about coverage, benefits, or specific services.`
            }
        ]);
    };

    const renderMessage = (message: Message, index: number) => {
        if (message.type === 'user') {
            return (
                <div key={index} className="flex justify-end mb-4 text-right">
                    <div className="bg-blue-500 text-white rounded-lg py-2 px-4 max-w-[70%]">
                        {message.content}
                    </div>
                </div>
            );
        }

        return (
            <div key={index} className="flex flex-col mb-4 items-start text-left">
                <div className="bg-gray-100 rounded-lg py-2 px-4 max-w-[70%]">
                    <div className="mb-2">
                        {message.content}
                    </div>

                    {message.options && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {message.options.map((option, i) => (
                                <Button
                                    key={i}
                                    variant="outline"
                                    className="text-sm"
                                    onClick={() => {
                                        setInputValue(option);
                                        handleSubmit(new Event('submit') as any);
                                    }}
                                >
                                    {option}
                                </Button>
                            ))}
                        </div>
                    )}

                    {message.recommendations && (
                        <div className="mt-4 space-y-4">
                            {message.recommendations.map((plan, i) => (
                                <Card
                                    key={i}
                                    className={`p-4 hover:shadow-lg transition-shadow cursor-pointer ${
                                        selectedPlan === plan.planName ? 'border-2 border-blue-500' : ''
                                    }`}
                                    onClick={() => handlePlanSelection(plan.planName)}
                                >
                                    <h3 className="font-bold mb-2">{plan.planName}</h3>
                                    <div className="text-sm space-y-1">
                                        {plan.coverageDetails ? (
                                            <>
                                                <div className="grid grid-cols-3 gap-2 font-medium mb-2">
                                                    <span>Service</span>
                                                    <div className='flex flex-col'>
                                                        <span>In Network</span>
                                                        <span>What you need to pay?</span>
                                                    </div>
                                                    <div className='flex flex-col'>
                                                        <span>Out of Network</span>
                                                        <span>What you need to pay?</span>
                                                    </div>
                                                </div>
                                                {plan.coverageDetails.map((detail, j) => (
                                                    <div key={j} className="grid grid-cols-3 gap-2">
                                                        <span className="text-gray-600">{detail.label}</span>
                                                        <span>{detail.inNetwork}</span>
                                                        <span>{detail.outOfNetwork}</span>
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <p>{plan.summary}</p>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen">
            <div className="p-4 bg-blue-500 text-white">
                <h1 className="text-xl font-bold">Insurance Assistant</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => renderMessage(message, index))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                    />
                    <Button type="submit" disabled={loading}>
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ChatInterface;
