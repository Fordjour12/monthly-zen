import { Container } from "@/components/ui/container";
import {
  HomeHeader,
  QuickActions,
  MorningIntentions,
  PlanProgressCard,
  TodaysTasksCard,
  HeatmapCard,
  CoachingBanner,
} from "@/components/home";
import { useRouter } from "expo-router";
import { View, ScrollView } from "react-native";

/**
 * Clean & Minimalist Home Screen for Monthly Zen.
 * Reorganized for better flow and visual clarity.
 */
export default function Home() {
  const router = useRouter();

  const handleViewAllCoaching = () => {
    router.push("/coaching");
  };

  return (
    <Container className="bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* 1. Header Section */}
        <HomeHeader />

        {/* 2. Hero Section - Current Plan Progress */}
        <PlanProgressCard />

        {/* 3. AI Insights / Intentions */}
        <MorningIntentions />

        {/* 4. Quick Actions Row */}
        <QuickActions />

        {/* 5. Main Task List */}
        <TodaysTasksCard />

        {/* 6. Insights & Analytics (Heatmap) */}
        <HeatmapCard />

        {/* 7. Coaching Integration */}
        <CoachingBanner onViewAll={handleViewAllCoaching} />
      </ScrollView>
    </Container>
  );
}
