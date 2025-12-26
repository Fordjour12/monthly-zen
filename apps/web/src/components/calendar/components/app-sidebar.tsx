import * as React from "react";
import { Plus, Calendar as CalendarIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "./date-picker";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { getFocusAreas } from "@/functions/calendar-server-fn";

interface FocusArea {
  name: string;
  count: number;
  color: string;
}

export function AppSidebar({
  selectedFocusAreas,
  onToggleFocusArea,
  onTodayClick,
}: {
  selectedFocusAreas: string[];
  onToggleFocusArea: (area: string) => void;
  onTodayClick: () => void;
}) {
  const [focusAreas, setFocusAreas] = React.useState<FocusArea[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const loadFocusAreas = async () => {
      setIsLoading(true);
      try {
        const result = await getFocusAreas();
        if (result.success) {
          setFocusAreas(result.data);
        }
      } catch (error) {
        console.error("Failed to load focus areas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFocusAreas();
  }, []);

  const user = {
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/default.jpg",
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <NavUser user={user} />
      </SidebarHeader>
      <SidebarContent>
        <div className="px-2 py-4">
          <Button variant="outline" className="w-full" onClick={onTodayClick}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Today
          </Button>
        </div>
        <SidebarSeparator />
        <DatePicker />
        <SidebarSeparator />

        <div className="px-2 py-4">
          <h3 className="text-sm font-medium mb-3 px-2">Focus Areas</h3>
          {isLoading ? (
            <div className="text-sm text-muted-foreground px-2">Loading...</div>
          ) : (
            <SidebarMenu>
              {focusAreas.map((area) => {
                const isSelected = selectedFocusAreas.includes(area.name);
                return (
                  <SidebarMenuItem key={area.name}>
                    <SidebarMenuButton
                      onClick={() => onToggleFocusArea(area.name)}
                      className="w-full justify-between px-2"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: area.color }}
                        />
                        <span className="flex-1">{area.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{area.count}</span>
                        {isSelected && <Check className="h-4 w-4" />}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          )}
        </div>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/plan" className="w-full">
                <span>Create Tasks</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
