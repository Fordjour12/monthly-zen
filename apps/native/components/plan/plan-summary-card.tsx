import React from 'react';
import { View, Text } from 'react-native';
import { Card } from 'heroui-native';

interface PlanSummaryCardProps {
    monthlySummary: string;
    successMetrics?: string[];
    potentialConflicts?: string[];
    currentMonth?: string;
}

/**
 * Summary & Metrics Card (Section 2A from creation.md)
 * Displays high-level insights before diving into details:
 * - Plan Title (current month/year)
 * - Summary (monthly_summary)
 * - Success Metrics
 * - Conflicts Warning
 */
export const PlanSummaryCard: React.FC<PlanSummaryCardProps> = ({
    monthlySummary,
    successMetrics = [],
    potentialConflicts = [],
    currentMonth,
}) => {
    const hasMetrics = successMetrics.length > 0;
    const hasConflicts = potentialConflicts.length > 0;

    return (
        <Card variant="secondary" className="mb-6 p-4 overflow-hidden">
            {/* Gradient header accent */}
            <View className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400" />

            {/* Plan Title */}
            <View className="flex-row items-center mb-4">
                <Text className="text-2xl mr-2">📅</Text>
                <View>
                    <Text className="text-xl font-bold text-foreground">
                        {currentMonth || 'Monthly'} Plan
                    </Text>
                    <Text className="text-sm text-muted">AI-Generated Action Plan</Text>
                </View>
            </View>

            {/* Summary Section */}
            <View className="mb-4 p-4 bg-surface/30 rounded-xl border border-divider/50">
                <View className="flex-row items-center mb-2">
                    <Text className="text-lg mr-2">📝</Text>
                    <Text className="text-base font-semibold text-orange-400">Summary</Text>
                </View>
                <Text className="text-foreground text-sm leading-6">
                    {monthlySummary}
                </Text>
            </View>

            {/* Success Metrics Section */}
            {hasMetrics && (
                <View className="mb-4 p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                    <View className="flex-row items-center mb-3">
                        <Text className="text-lg mr-2">📊</Text>
                        <Text className="text-base font-semibold text-green-400">Success Metrics</Text>
                    </View>
                    {successMetrics.map((metric, index) => (
                        <View key={index} className="flex-row items-start mb-2">
                            <View className="w-6 h-6 rounded-full bg-green-500/20 items-center justify-center mr-3 mt-0.5">
                                <Text className="text-green-400 text-xs font-bold">{index + 1}</Text>
                            </View>
                            <Text className="text-foreground text-sm flex-1 leading-5">{metric}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Potential Conflicts Warning */}
            {hasConflicts && (
                <View className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
                    <View className="flex-row items-center mb-3">
                        <Text className="text-lg mr-2">⚠️</Text>
                        <Text className="text-base font-semibold text-amber-400">Potential Conflicts</Text>
                    </View>
                    {potentialConflicts.map((conflict, index) => (
                        <View key={index} className="flex-row items-start mb-2">
                            <Text className="text-amber-400 mr-2 mt-0.5">•</Text>
                            <Text className="text-foreground/80 text-sm flex-1 leading-5">{conflict}</Text>
                        </View>
                    ))}
                </View>
            )}
        </Card>
    );
};

export default PlanSummaryCard;
