import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Card, Button, Divider, Skeleton } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Search01Icon,
  Cancel01Icon,
  ArrowRight01Icon,
  RocketIcon,
  Sun01Icon,
  Wallet01Icon,
  LanguageSkillIcon,
  Book02Icon,
  PaintBrush01Icon,
  SparklesIcon,
  Add01Icon,
} from "@hugeicons/core-free-icons";
import { useSemanticColors } from "@/utils/theme";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "productivity", label: "Productivity" },
  { key: "wellness", label: "Wellness" },
  { key: "finance", label: "Finance" },
  { key: "learning", label: "Learning" },
  { key: "creativity", label: "Creativity" },
];

const TEMPLATES = [
  {
    id: "1",
    title: "Deep Work Sprint",
    description: "Maximize output with 4 hours of uninterrupted deep work daily.",
    category: "productivity",
    complexity: "Ambitious",
    focusAreas: "Efficiency",
    icon: RocketIcon,
    color: "bg-purple-500/10",
    iconColor: "#a855f7",
  },
  {
    id: "2",
    title: "Morning Routine",
    description: "Build a rock-solid morning ritual including meditation and stretching.",
    category: "wellness",
    complexity: "Simple",
    focusAreas: "Wellness",
    icon: Sun01Icon,
    color: "bg-orange-500/10",
    iconColor: "#f97316",
  },
  {
    id: "3",
    title: "Financial Zen",
    description: "Master your budget with daily tracking and weekly audits.",
    category: "finance",
    complexity: "Balanced",
    focusAreas: "Finance",
    icon: Wallet01Icon,
    color: "bg-emerald-500/10",
    iconColor: "#10b981",
  },
  {
    id: "4",
    title: "Language Lab",
    description: "Consistent 30-minute daily practice using immersion techniques.",
    category: "learning",
    complexity: "Balanced",
    focusAreas: "Learning",
    icon: LanguageSkillIcon,
    color: "bg-blue-500/10",
    iconColor: "#3b82f6",
  },
  {
    id: "5",
    title: "Book Club",
    description: "Read and discuss one book per month with structured schedule.",
    category: "learning",
    complexity: "Simple",
    focusAreas: "Reading",
    icon: Book02Icon,
    color: "bg-amber-500/10",
    iconColor: "#f59e0b",
  },
  {
    id: "6",
    title: "Art Challenge",
    description: "Daily sketch prompts and weekly project completion.",
    category: "creativity",
    complexity: "Balanced",
    focusAreas: "Creativity",
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
  <Animated.View entering={FadeInDown.delay(index * 100).duration(600)}>
    <TouchableOpacity activeOpacity={0.9} onPress={() => onApply(template)} className="mb-6">
      <Card className="p-6 border-none bg-surface/50 rounded-[32px]">
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-row items-center gap-x-3">
            <View className={`w-12 h-12 rounded-2xl ${template.color} items-center justify-center`}>
              <HugeiconsIcon icon={template.icon} size={24} color={template.iconColor} />
            </View>
            <View>
              <Text className="text-lg font-sans-bold text-foreground">{template.title}</Text>
              <View className="flex-row items-center gap-x-1.5">
                <View className="w-1.5 h-1.5 rounded-full bg-accent" />
                <Text className="text-[10px] font-sans-bold text-accent uppercase tracking-widest">
                  {template.complexity}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text className="text-base font-sans text-muted-foreground mb-6 leading-6">
          {template.description}
        </Text>

        <View className="flex-row justify-between items-center pt-5 border-t border-border/30">
          <View className="flex-row items-center gap-x-2">
            <HugeiconsIcon icon={SparklesIcon} size={14} color="var(--muted-foreground)" />
            <Text className="text-xs font-sans-medium text-muted-foreground capitalize">
              {template.focusAreas}
            </Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-foreground items-center justify-center">
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="var(--background)" />
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
    const timer = setTimeout(() => setIsLoading(false), 600);
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
      pathname: "/(tabs)/planner/create",
      params: { template: templateData },
    });
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Search Bar */}
      <Animated.View entering={FadeInDown.delay(100).duration(600)} className="px-6 mt-4 mb-6">
        <View className="flex-row items-center bg-surface border border-border/50 rounded-2xl px-4 py-1">
          <HugeiconsIcon icon={Search01Icon} size={20} color="var(--muted-foreground)" />
          <TextInput
            className="flex-1 p-3 font-sans text-foreground"
            placeholder="Search strategies..."
            placeholderTextColor="var(--muted-foreground)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <HugeiconsIcon icon={Cancel01Icon} size={18} color="var(--muted-foreground)" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Categories Scroller */}
      <Animated.View entering={FadeInRight.delay(200).duration(600)} className="mb-8">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24 }}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              onPress={() => setActiveCategory(cat.key)}
              className={`mr-3 px-6 py-3 rounded-2xl border ${
                activeCategory === cat.key
                  ? "bg-foreground border-foreground"
                  : "bg-surface border-border/50"
              }`}
            >
              <Text
                className={`text-xs font-sans-bold uppercase tracking-widest ${
                  activeCategory === cat.key ? "text-background" : "text-muted-foreground"
                }`}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Template Grid */}
      <View className="px-6">
        {isLoading ? (
          <View className="space-y-6">
            {[1, 2, 3].map((i) => (
              <View key={i} className="h-48 w-full bg-surface rounded-[32px] animate-pulse" />
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
              <View className="items-center justify-center py-20">
                <View className="w-16 h-16 rounded-full bg-muted/5 items-center justify-center mb-4">
                  <HugeiconsIcon icon={Search01Icon} size={32} color="var(--muted-foreground)" />
                </View>
                <Text className="text-muted-foreground font-sans-semibold">
                  No strategies found
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
