import { Container } from "@/components/ui/container";
import {
  HomeHeader,
  MetricsRow,
  QuickActions,
  CoachingBanner,
  MorningIntentions,
  PlanProgressCard,
  TodaysTasksCard,
  HeatmapCard,
} from "@/components/home";
import { useEffect } from "react";
import { useCoaching } from "@/hooks/useCoaching";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();
  const { loadCoachingData } = useCoaching();

  useEffect(() => {
    loadCoachingData();
  }, [loadCoachingData]);

  const handleViewAllCoaching = () => {
    router.push("/coaching");
  };

  return (
    <Container>
      <HomeHeader />
      <CoachingBanner onViewAll={handleViewAllCoaching} />
      <MorningIntentions />
      <MetricsRow />
      <QuickActions />
      <PlanProgressCard />
      <TodaysTasksCard />
      <HeatmapCard />
    </Container>
  );
}
