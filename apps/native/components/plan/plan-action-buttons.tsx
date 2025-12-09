import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, Modal } from 'react-native';
import { useThemeColor } from 'heroui-native';

interface PlanActionButtonsProps {
    onApplyPlan: () => Promise<void>;
    onRegeneratePlan: (feedback: string) => Promise<void>;
    onViewAllPlans: () => void;
    onGenerateNewPlan: () => void;
    isApplying: boolean;
    isRegenerating?: boolean;
    planApplied?: boolean;
}

/**
 * Action Buttons (Section 2C from creation.md)
 * - Apply Plan Button: Saves finalPlan to DB, transitions to Dashboard
 * - Regenerate Plan Button: Triggers regeneratePlan with user feedback
 * - Edit/Modify Plan: Navigates to Plan Details/Edit Screen
 */
export const PlanActionButtons: React.FC<PlanActionButtonsProps> = ({
    onApplyPlan,
    onRegeneratePlan,
    onViewAllPlans,
    onGenerateNewPlan,
    isApplying,
    isRegenerating = false,
    planApplied = false,
}) => {
    const [showRegenerateModal, setShowRegenerateModal] = useState(false);
    const [regenerateFeedback, setRegenerateFeedback] = useState('');
    const mutedColor = useThemeColor('muted');

    const handleRegenerateSubmit = async () => {
        if (regenerateFeedback.trim().length < 10) {
            return; // Feedback too short
        }
        await onRegeneratePlan(regenerateFeedback);
        setShowRegenerateModal(false);
        setRegenerateFeedback('');
    };

    return (
        <View className="mt-6 space-y-3">
            {/* Apply Plan Button - Primary CTA */}
            {!planApplied && (
                <Pressable
                    onPress={onApplyPlan}
                    disabled={isApplying || planApplied}
                    className={`p-4 rounded-xl flex-row justify-center items-center active:opacity-70 disabled:opacity-50
                  ${planApplied ? 'bg-green-600/50' : 'bg-gradient-to-r from-green-600 to-emerald-500'}
                  shadow-lg shadow-green-500/20`}
                >
                    {isApplying ? (
                        <>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text className="text-white font-semibold ml-2">Applying Plan...</Text>
                        </>
                    ) : planApplied ? (
                        <Text className="text-white font-semibold">✓ Plan Applied</Text>
                    ) : (
                        <>
                            <Text className="text-xl mr-2">✓</Text>
                            <Text className="text-white font-semibold text-base">Apply This Plan</Text>
                        </>
                    )}
                </Pressable>
            )}

            {/* Applied Success State */}
            {planApplied && (
                <View className="p-4 bg-green-500/20 rounded-xl border border-green-500/30">
                    <View className="flex-row items-center justify-center">
                        <Text className="text-2xl mr-2">🎉</Text>
                        <Text className="text-green-400 font-semibold">Plan Successfully Applied!</Text>
                    </View>
                </View>
            )}

            {/* Regenerate Plan Button */}
            <Pressable
                onPress={() => setShowRegenerateModal(true)}
                disabled={isRegenerating || isApplying}
                className="bg-orange-500/20 p-4 rounded-xl flex-row justify-center items-center active:opacity-70 disabled:opacity-50 border border-orange-500/30"
            >
                {isRegenerating ? (
                    <>
                        <ActivityIndicator size="small" color="#f97316" />
                        <Text className="text-orange-400 font-semibold ml-2">Regenerating...</Text>
                    </>
                ) : (
                    <>
                        <Text className="text-xl mr-2">🔄</Text>
                        <Text className="text-orange-400 font-semibold">Regenerate Plan</Text>
                    </>
                )}
            </Pressable>

            {/* View All Plans Button */}
            <Pressable
                onPress={onViewAllPlans}
                className="bg-surface p-4 rounded-xl flex-row justify-center items-center active:opacity-70 border border-divider"
            >
                <Text className="text-xl mr-2">📋</Text>
                <Text className="text-foreground font-medium">View All My Plans</Text>
            </Pressable>

            {/* Generate New Plan Button */}
            <Pressable
                onPress={onGenerateNewPlan}
                className="bg-surface/50 p-3 rounded-xl flex-row justify-center items-center active:opacity-70"
            >
                <Text className="text-foreground/70 font-medium">← Generate Another Plan</Text>
            </Pressable>

            {/* Regenerate Plan Modal */}
            <Modal
                visible={showRegenerateModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowRegenerateModal(false)}
            >
                <View className="flex-1 bg-black/60 justify-center items-center p-4">
                    <View className="bg-background w-full max-w-md rounded-2xl p-6 shadow-xl">
                        {/* Modal Header */}
                        <View className="flex-row items-center mb-4">
                            <Text className="text-2xl mr-2">🔄</Text>
                            <Text className="text-xl font-bold text-foreground">Regenerate Plan</Text>
                        </View>

                        {/* Description */}
                        <Text className="text-muted text-sm mb-4 leading-5">
                            Tell us what you'd like to change. For example: "I don't want to exercise on
                            Wednesdays" or "Focus more on coding projects"
                        </Text>

                        {/* Feedback Input */}
                        <TextInput
                            className="bg-surface p-4 rounded-xl text-foreground border border-divider mb-2"
                            placeholder="What would you like to change?"
                            value={regenerateFeedback}
                            onChangeText={setRegenerateFeedback}
                            placeholderTextColor={mutedColor}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            style={{ minHeight: 100 }}
                        />

                        {/* Character count */}
                        <Text className={`text-xs mb-4 ${regenerateFeedback.length < 10 ? 'text-red-400' : 'text-muted'}`}>
                            {regenerateFeedback.length}/10 minimum characters
                        </Text>

                        {/* Modal Actions */}
                        <View className="flex-row space-x-3">
                            <Pressable
                                onPress={() => {
                                    setShowRegenerateModal(false);
                                    setRegenerateFeedback('');
                                }}
                                className="flex-1 bg-surface p-3 rounded-xl items-center active:opacity-70"
                            >
                                <Text className="text-foreground font-medium">Cancel</Text>
                            </Pressable>
                            <Pressable
                                onPress={handleRegenerateSubmit}
                                disabled={regenerateFeedback.trim().length < 10 || isRegenerating}
                                className={`flex-1 p-3 rounded-xl items-center active:opacity-70 disabled:opacity-50
                           ${regenerateFeedback.trim().length >= 10 ? 'bg-orange-500' : 'bg-orange-500/30'}`}
                            >
                                {isRegenerating ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text className="text-white font-semibold">Regenerate</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default PlanActionButtons;
