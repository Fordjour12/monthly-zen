import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { Calendar, ChevronRight, Brain, FileText, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUser } from "@/functions/get-user";
import { orpc } from "@/utils/orpc";

interface PlanListItem {
  id: number;
  monthYear: string;
  summary: string | null;
  status: "DRAFT" | "CONFIRMED";
  generatedAt: Date;
  confidence: number | null;
}

export const Route = createFileRoute("/plans")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await getUser();
    return { session };
  },
  loader: async ({ context }) => {
    if (!context.session) {
      throw redirect({
        to: "/login",
      });
    }
  },
});

function RouteComponent() {
  const navigate = useNavigate();

  const { data: result, isLoading } = useQuery(orpc.plan.getPlans.queryOptions());

  const plans = (result?.data as PlanListItem[] | undefined) || [];

  const formatMonthYear = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "MMMM yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch {
      return "";
    }
  };

  const getConfidenceBadge = (confidence: number | null) => {
    if (!confidence) return <Badge variant="secondary">Unknown</Badge>;
    if (confidence >= 80) return <Badge className="bg-green-500">High</Badge>;
    if (confidence >= 50) return <Badge className="bg-yellow-500">Medium</Badge>;
    return <Badge variant="destructive">Low</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">My Plans</h1>
                <p className="text-muted-foreground">View all your generated monthly plans</p>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-4 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">My Plans</h1>
                  <p className="text-muted-foreground">View all your generated monthly plans</p>
                </div>
              </div>
              <Button onClick={() => navigate({ to: "/plan" })}>
                <Brain className="mr-2 h-4 w-4" />
                Generate New Plan
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No plans yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                You haven&apos;t generated any plans yet. Create your first AI-powered monthly plan
                to get started.
              </p>
              <Button onClick={() => navigate({ to: "/plan" })}>
                <Brain className="mr-2 h-4 w-4" />
                Generate Your First Plan
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">My Plans</h1>
                <p className="text-muted-foreground">View all your generated monthly plans</p>
              </div>
            </div>
            <Button onClick={() => navigate({ to: "/plan" })}>
              <Brain className="mr-2 h-4 w-4" />
              Generate New Plan
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate({ to: "/plan" })}
            >
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{formatMonthYear(plan.monthYear)}</CardTitle>
                      {getConfidenceBadge(plan.confidence)}
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Generated {formatDate(plan.generatedAt)}
                      </span>
                      {plan.summary && <span className="line-clamp-1">{plan.summary}</span>}
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
