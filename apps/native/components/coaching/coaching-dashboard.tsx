import React from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Card } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  AiMagicIcon,
  SparklesIcon,
  Flag01Icon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  BulbIcon,
  ActivityIcon,
  Analytics01Icon,
} from "@hugeicons/core-free-icons";
import { InsightCard } from "./insight-card";
import { useCoaching } from "@/hooks/useCoaching";
import type { Insight } from "@/hooks/useCoaching";
import { EmptyState } from "@/components/ui/empty-state";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Container } from "@/components/ui/container";

interface CoachingDashboardProps {
  onNavigateToGoals?: () => void;
}

export function CoachingDashboard({ onNavigateToGoals }: CoachingDashboardProps) {
  const { insights, stats, isLoading, isRefreshing, generateInsights, dismissInsight, refresh } =
    useCoaching();

  const router = useRouter();

  const handleApplyInsight = (insightId: number) => {
    console.log("Applying insight:", insightId);
  };

  const handleDismissInsight = (insightId: number, action?: string) => {
    dismissInsight(insightId, action);
  };

  return (
    <Container className="bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor="var(--accent)" />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(600)} className="px-6 pt-10 pb-6">
          <Text className="text-sm font-sans-bold text-muted-foreground uppercase tracking-[3px] mb-1">
            Mentorship
          </Text>
          <Text className="text-3xl font-sans-bold text-foreground">AI Coach</Text>
        </Animated.View>

        {/* Hero Generate Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} className="px-6 mb-8">
          <TouchableOpacity
            onPress={generateInsights}
            disabled={isLoading}
            activeOpacity={0.9}
            className="bg-accent rounded-[32px] p-8 shadow-xl shadow-accent/20 overflow-hidden relative"
          >
            <View className="relative z-10">
              <View className="flex-row items-center gap-x-2 mb-4">
                <View className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center">
                  <HugeiconsIcon icon={AiMagicIcon} size={22} color="white" />
                </View>
                <Text className="text-[10px] font-sans-bold text-white uppercase tracking-widest bg-white/10 px-2 py-1 rounded-lg">
                  Insight Engine
                </Text>
              </View>
              <Text className="text-2xl font-sans-bold text-white mb-2">Identify Patterns</Text>
              <Text className="text-white/80 font-sans text-sm leading-5 mb-6">
                Let your personal coach analyze your recent habits and optimize your monthly
                trajectory.
              </Text>

              <View className="flex-row items-center gap-x-2">
                <View className="bg-white px-6 py-3 rounded-2xl flex-row items-center gap-x-2">
                  {isLoading ? (
                    <ActivityIndicator color="var(--accent)" size="small" />
                  ) : (
                    <>
                      <Text className="text-accent font-sans-bold">Analyze Now</Text>
                      <HugeiconsIcon icon={SparklesIcon} size={16} color="var(--accent)" />
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* Decorative element */}
            <View className="absolute -right-10 -bottom-10 opacity-20">
              <HugeiconsIcon icon={AiMagicIcon} size={200} color="white" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(600)}
          className="flex-row px-6 gap-x-4 mb-10"
        >
          <StatMiniCard
            icon={BulbIcon}
            label="Insights"
            value={stats?.totalInsights || 0}
            color="text-blue-500"
            bg="bg-blue-500/10"
          />
          <StatMiniCard
            icon={CheckmarkCircle01Icon}
            label="Optimized"
            value={stats?.actionedInsights || 0}
            color="text-success"
            bg="bg-success/10"
          />
        </Animated.View>

        {/* Insights Section */}
        <View className="px-6 pb-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-sans-bold text-foreground">Discovery Flow</Text>
            {insights && insights.length > 0 && (
              <View className="bg-accent/10 px-2 py-1 rounded-lg">
                <Text className="text-[10px] font-sans-bold text-accent uppercase">
                  {insights.length} New
                </Text>
              </View>
            )}
          </View>

          {isLoading && (!insights || insights.length === 0) ? (
            <View className="items-center justify-center py-12 bg-surface/30 rounded-[32px] border border-border/50 border-dashed">
              <ActivityIndicator size="large" color="var(--accent)" />
              <Text className="text-muted-foreground font-sans-medium mt-4 text-center">
                Syncing your behavioral data...
              </Text>
            </View>
          ) : !insights || insights.length === 0 ? (
            <View className="items-center py-12 px-6 bg-surface/30 rounded-[32px] border border-border/50 border-dashed">
              <View className="w-16 h-16 rounded-full bg-muted/5 items-center justify-center mb-4">
                <HugeiconsIcon icon={Analytics01Icon} size={32} color="var(--muted-foreground)" />
              </View>
              <Text className="text-foreground font-sans-bold text-lg mb-1">
                No Active Insights
              </Text>
              <Text className="text-muted-foreground font-sans text-sm text-center">
                Once you start tracking your month, AI Coach will provide optimization strategies
                here.
              </Text>
            </View>
          ) : (
            insights.map((insight: Insight, idx: number) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                index={idx}
                onApply={() => handleApplyInsight(insight.id)}
                onDismiss={(action) => handleDismissInsight(insight.id, action)}
              />
            ))
          )}
        </View>

        {/* Navigation Actions */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} className="px-6 gap-y-4">
          <ActionCard
            icon={Flag01Icon}
            title="Coaching Goals"
            subtitle="Set your long-term success metrics"
            onPress={onNavigateToGoals}
          />
          <ActionCard
            icon={ActivityIcon}
            title="Habit Evolution"
            subtitle="Track personal discipline formation"
            onPress={() => router.push("/(tabs)/task/habit")}
          />
        </Animated.View>
      </ScrollView>
    </Container>
  );
}

function StatMiniCard({ icon, label, value, color, bg }: any) {
  return (
    <View className="flex-1 bg-surface border border-border/50 rounded-[28px] p-5 shadow-sm">
      <View className={`w-10 h-10 rounded-xl ${bg} items-center justify-center mb-3`}>
        <HugeiconsIcon icon={icon} size={18} color="currentColor" className={color} />
      </View>
      <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-1">
        {label}
      </Text>
      <Text className="text-2xl font-sans-bold text-foreground">{value}</Text>
    </View>
  );
}

function ActionCard({ icon, title, subtitle, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card className="p-6 border-none bg-surface/50 rounded-[28px] flex-row items-center justify-between">
        <View className="flex-row items-center gap-x-4">
          <View className="w-12 h-12 rounded-2xl bg-accent/10 items-center justify-center">
            <HugeiconsIcon icon={icon} size={22} color="var(--accent)" />
          </View>
          <View>
            <Text className="font-sans-bold text-foreground text-base">{title}</Text>
            <Text className="text-xs font-sans text-muted-foreground">{subtitle}</Text>
          </View>
        </View>
        <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="var(--muted-foreground)" />
      </Card>
    </TouchableOpacity>
  );
}
