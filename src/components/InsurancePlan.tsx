// src/components/InsurancePlan.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CoverageCost {
    label: string;
    value: string;
}

interface InsurancePlanProps {
    planName: string;
    premium?: string;
    coverageDetails?: CoverageCost[];
}

const InsurancePlan: React.FC<InsurancePlanProps> = ({
                                                         planName = "Horizon Blue",
                                                         premium = "$50/month",
                                                         coverageDetails = [
                                                             { label: "Individual Deductible", value: "$1500" },
                                                             { label: "Family Deductible", value: "$3000" },
                                                             { label: "Physician Visit Copay", value: "$20" },
                                                             { label: "Diagnostic Test Copay", value: "$0" },
                                                             { label: "Generic Drugs Copay", value: "$10" },
                                                             { label: "Emergency Room Care", value: "$100" },
                                                             { label: "Maternity Coverage", value: "$0" },
                                                             { label: "Vaccination Coverage", value: "No charges" },
                                                         ],
                                                     }) => {
    return (
        <Card className="">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">{planName}</CardTitle>
                <CardDescription>
                    Premium: <span className="font-medium">{premium}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {coverageDetails.map((detail, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0"
                        >
                            <span className="text-sm text-muted-foreground">{detail.label}</span>
                            <span className="font-medium">{detail.value}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default InsurancePlan;