import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { getUser } from "@/functions/get-user";
import { orpc } from "@/utils/orpc";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/settings")({
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
  const { session } = Route.useRouteContext();
  const queryClient = useQueryClient();

  // Queries
  const preferencesQuery = useQuery(orpc.user.getPreferences.queryOptions());

  // Mutations
  const updatePreferencesMutation = useMutation(
    orpc.user.updatePreferences.mutationOptions({
      onSuccess: () => {
        toast.success("Preferences saved successfully");
        queryClient.invalidateQueries(orpc.user.getPreferences.queryKey());
      },
      onError: (error) => {
        toast.error(error.message || "Failed to save preferences");
      },
    }),
  );

  const updateProfileMutation = useMutation(
    orpc.user.updateProfile.mutationOptions({
      onSuccess: () => {
        toast.success("Profile updated successfully");
      },
    }),
  );

  // Local State
  const [goalsText, setGoalsText] = useState("");
  const [taskComplexity, setTaskComplexity] = useState("Balanced");
  const [focusAreas, setFocusAreas] = useState("");
  const [weekendPreference, setWeekendPreference] = useState("Rest");
  const [name, setName] = useState(session?.user.name || "");

  // Populate form
  useEffect(() => {
    if (preferencesQuery.data) {
      setGoalsText(preferencesQuery.data.goalsText);
      setTaskComplexity(preferencesQuery.data.taskComplexity);
      setFocusAreas(preferencesQuery.data.focusAreas);
      setWeekendPreference(preferencesQuery.data.weekendPreference);
    }
  }, [preferencesQuery.data]);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferencesMutation.mutate({
      goalsText,
      taskComplexity: taskComplexity as any,
      focusAreas,
      weekendPreference: weekendPreference as any,
      fixedCommitmentsJson: { commitments: [] },
    });
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-lg">Manage your profile and plan settings.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your public information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={session?.user.email} disabled className="bg-muted" />
              </div>
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Defaults</CardTitle>
            <CardDescription>Configure your default settings for plan generation.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePreferences} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="goals">Default Goals</Label>
                <Textarea
                  id="goals"
                  value={goalsText}
                  onChange={(e) => setGoalsText(e.target.value)}
                  placeholder="e.g. Focus on deep work and fitness..."
                  rows={4}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Default Complexity</Label>
                <RadioGroup
                  value={taskComplexity}
                  onValueChange={setTaskComplexity}
                  className="grid grid-cols-1 gap-2"
                >
                  {["Simple", "Balanced", "Ambitious"].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <RadioGroupItem value={level} id={level} />
                      <Label htmlFor={level} className="font-normal">
                        {level}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="focus">Default Focus Areas</Label>
                <Input
                  id="focus"
                  value={focusAreas}
                  onChange={(e) => setFocusAreas(e.target.value)}
                  placeholder="e.g. Health, Career, Finance"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Weekend Preference</Label>
                <RadioGroup
                  value={weekendPreference}
                  onValueChange={setWeekendPreference}
                  className="grid grid-cols-1 gap-2"
                >
                  {[
                    { value: "Work", label: "Deep Work" },
                    { value: "Rest", label: "Rest & Recharge" },
                    { value: "Mixed", label: "Light Tasks" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={`weekend-${opt.value}`} />
                      <Label htmlFor={`weekend-${opt.value}`} className="font-normal">
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={updatePreferencesMutation.isPending}
              >
                Save Preferences
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
