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

export default function Home() {
  return (
    <Container>
      <HomeHeader />
      <CoachingBanner />
      <MorningIntentions />
      <MetricsRow />
      <QuickActions />
      <PlanProgressCard />
      <TodaysTasksCard />
      <HeatmapCard />
    </Container>
  );
}
