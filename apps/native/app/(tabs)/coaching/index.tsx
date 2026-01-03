import { CoachingDashboard } from "@/components/coaching/coaching-dashboard";
import { useEffect } from "react";
import { useCoaching } from "@/hooks/useCoaching";

export default function CoachingIndex() {
  const { loadCoachingData } = useCoaching();

  useEffect(() => {
    loadCoachingData();
  }, [loadCoachingData]);

  return <CoachingDashboard />;
}
