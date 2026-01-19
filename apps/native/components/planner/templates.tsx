import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Card, Skeleton } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Search01Icon,
  Cancel01Icon,
  RocketIcon,
  Sun01Icon,
  Wallet01Icon,
  LanguageSkillIcon,
  Book02Icon,
  PaintBrush01Icon,
  SparklesIcon,
  ArrowRight02Icon,
  FlashIcon,
  Configuration01Icon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInRight, LinearTransition } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const CATEGORIES = [
  { key: "all", label: "Registry" },
  { key: "productivity", label: "Performance" },
  { key: "wellness", label: "Vitality" },
  { key: "finance", label: "Assets" },
  { key: "learning", label: "Cognition" },
  { key: "creativity", label: "Synthesis" },
];

const TEMPLATES = [
  {
    id: "1",
    title: "Deep Work Sprint",
    description: "Maximize neural output with 4 hours of uninterrupted high-focus work segments.",
    category: "productivity",
    complexity: "High",
    focusAreas: "Output Efficiency",
    icon: RocketIcon,
    color: "bg-purple-500/10",
    iconColor: "#a855f7",
  },
  {
    id: "2",
    title: "System Initialization",
    description: "Calibrate your morning state with meditation, hydration and physical activation.",
    category: "wellness",
    complexity: "Low",
    focusAreas: "Physical Vitality",
    icon: Sun01Icon,
    color: "bg-orange-500/10",
    iconColor: "#f97316",
  },
  {
    id: "3",
    title: "Asset Optimization",
    description:
      "Maintain fiscal equilibrium through precise budget tracking and recursive audits.",
    category: "finance",
    complexity: "Medium",
    focusAreas: "Fiscal Stability",
    icon: Wallet01Icon,
    color: "bg-emerald-500/10",
    iconColor: "#10b981",
  },
  {
    id: "4",
    title: "Linguistic Synapse",
    description: "Establish neural pathways for new languages through recursive daily immersion.",
    category: "learning",
    complexity: "High",
    focusAreas: "Neural Expansion",
    icon: LanguageSkillIcon,
    color: "bg-blue-500/10",
    iconColor: "#3b82f6",
  },
  {
    id: "5",
    title: "Knowledge Archive",
    description: "Systematically digest high-value information through shared structured reading.",
    category: "learning",
    complexity: "Low",
    focusAreas: "Cognition",
    icon: Book02Icon,
    color: "bg-amber-500/10",
    iconColor: "#f59e0b",
  },
  {
    id: "6",
    title: "Creative Synthesis",
    description: "Execute daily creative iterations to accelerate aesthetic mastery.",
    category: "creativity",
    complexity: "Medium",
    focusAreas: "Aesthetic Output",
    icon: PaintBrush01Icon,
    color: "bg-pink-500/10",
    iconColor: "#ec4899",
  },
];

interface TemplateData {
  id: string;
  title: string;
  description: string;
  category: string;
  complexity: string;
  focusAreas: string;
  icon: any;
  color: string;
  iconColor: string;
}

const TemplateCard = ({
  template,
  onApply,
  index,
}: {
  template: TemplateData;
  onApply: (template: TemplateData) => void;
  index: number;
}) => (
  <Animated.View entering={FadeInDown.delay(index * 80).duration(600)} layout={LinearTransition}>
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onApply(template);
      }}
      className="mb-8"
    >
      <Card className="p-8 rounded-[40px] bg-surface border border-border/50 shadow-sm shadow-black/5">
        <View className="flex-row justify-between items-start mb-6">
          <View className="flex-row items-center gap-x-4">
            <View
              className={`w-14 h-14 rounded-[22px] ${template.color} items-center justify-center border border-white/5`}
            >
              <HugeiconsIcon icon={template.icon} size={28} color={template.iconColor} />
            </View>
            <View>
              <Text className="text-xl font-sans-bold text-foreground tracking-tight">
                {template.title}
              </Text>
              <View className="flex-row items-center gap-x-2 mt-1">
                <View className="w-1.5 h-1.5 rounded-full bg-accent" />
                <Text className="text-[10px] font-sans-bold text-accent uppercase tracking-[2px]">
                  Complexity: {template.complexity}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="bg-muted/5 rounded-[24px] p-5 border border-border/5 mb-8">
          <Text className="text-sm font-sans text-muted-foreground leading-6 opacity-80">
            {template.description}
          </Text>
        </View>

        <View className="flex-row justify-between items-center pt-6 border-t border-border/10">
          <View className="flex-row items-center gap-x-3">
            <View className="w-8 h-8 rounded-full bg-surface items-center justify-center border border-border/40">
              <HugeiconsIcon icon={Configuration01Icon} size={14} color="var(--muted-foreground)" />
            </View>
            <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
              {template.focusAreas}
            </Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-foreground items-center justify-center shadow-lg shadow-black/20">
            <HugeiconsIcon icon={ArrowRight02Icon} size={20} color="var(--background)" />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  </Animated.View>
);

export default function TemplatesTab() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, [activeCategory, searchQuery]);

  const filteredTemplates = TEMPLATES.filter((t) => {
    const matchesCategory = activeCategory === "all" || t.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleApply = (template: TemplateData) => {
    const templateData = JSON.stringify({
      goalsText: template.description,
      taskComplexity: template.complexity,
      focusAreas: template.focusAreas,
    });
    router.push({
      pathname: "/planners/create",
      params: { template: templateData },
    });
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-32"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.delay(100).duration(600)} className="px-6 mt-6 mb-8">
        <View className="flex-row items-center bg-surface border border-border/50 rounded-[24px] px-6 py-2 shadow-sm shadow-black/5">
          <HugeiconsIcon icon={Search01Icon} size={20} color="var(--muted-foreground)" />
          <TextInput
            className="flex-1 p-3 font-sans-medium text-foreground text-sm"
            placeholder="Search directives..."
            placeholderTextColor="var(--muted-foreground)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSearchQuery("");
              }}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} color="var(--muted-foreground)" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInRight.delay(200).duration(600)} className="mb-10">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-6"
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveCategory(cat.key);
              }}
              className={`mr-3 px-6 py-4 rounded-[20px] border ${
                activeCategory === cat.key
                  ? "bg-foreground border-foreground shadow-lg shadow-black/10"
                  : "bg-surface border-border/50"
              }`}
            >
              <Text
                className={`text-[10px] font-sans-bold uppercase tracking-[2px] ${
                  activeCategory === cat.key ? "text-background" : "text-muted-foreground"
                }`}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <View className="px-6">
        {isLoading ? (
          <View className="gap-y-8">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-[40px] opacity-40" />
            ))}
          </View>
        ) : (
          <>
            {filteredTemplates.map((template, idx) => (
              <TemplateCard
                key={template.id}
                index={idx}
                template={template}
                onApply={handleApply}
              />
            ))}

            {filteredTemplates.length === 0 && (
              <View className="items-center justify-center py-24">
                <View className="w-20 h-20 rounded-[32px] bg-muted/5 items-center justify-center mb-6 border border-border/10">
                  <HugeiconsIcon icon={FlashIcon} size={32} color="var(--muted-foreground)" />
                </View>
                <Text className="text-muted-foreground font-sans-bold uppercase tracking-widest opacity-60">
                  Directives Clear
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
