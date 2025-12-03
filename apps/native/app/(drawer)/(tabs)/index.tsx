import { useState, useEffect } from "react";
import { 
	ScrollView, 
	View, 
	Text, 
	RefreshControl, 
	ActivityIndicator, 
	Pressable
} from "react-native";
import { Container } from "@/components/container";
import { Card, useThemeColor } from "heroui-native";
import { orpc } from "@/utils/orpc";
import { formatSuggestions, type FormattedSuggestion } from "@/lib/suggestion-formatter";
import { useRouter } from "expo-router";

export default function Home() {
	const [suggestions, setSuggestions] = useState<FormattedSuggestion[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const accentColor = useThemeColor("accent");

	const fetchSuggestions = async () => {
		try {
			console.log("📋 Fetching suggestions...");
			setError(null);
			const result = await orpc.AI.getSuggestions.call({
				limit: 50,
			});
			console.log("📋 Raw suggestions from API:", result);
			
			// Type cast to handle effectivenessScore null vs undefined and Date to string
			const suggestionsWithTypes = (result.suggestions || []).map(s => ({
				...s,
				effectivenessScore: s.effectivenessScore || undefined,
				createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
				updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt
			}));
			
			const formatted = formatSuggestions(suggestionsWithTypes);
			console.log("📋 Formatted suggestions:", formatted);
			
			setSuggestions(formatted);
		} catch (err) {
			console.error("❌ Error fetching suggestions:", err);
			setError(err instanceof Error ? err.message : "Failed to fetch suggestions");
		} finally {
			setIsLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		fetchSuggestions();
	}, []);

	const onRefresh = () => {
		setRefreshing(true);
		fetchSuggestions();
	};

	const handleSuggestionPress = (suggestion: FormattedSuggestion) => {
		console.log("🔍 Navigating to suggestion details:", suggestion.id);
		// Navigate to suggestion details page
		router.push(`/suggestion/${suggestion.id}` as any);
	};



	if (isLoading) {
		return (
			<Container className="p-6">
				<View className="flex-1 justify-center items-center">
					<ActivityIndicator size="large" color={accentColor} />
					<Text className="mt-4 text-muted-foreground">Loading AI suggestions...</Text>
				</View>
			</Container>
		);
	}

	return (
		<Container className="p-6">
			<ScrollView
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			>
				<Card variant="secondary" className="mb-6 p-4">
					<Card.Title className="mb-2">AI Suggestions</Card.Title>
					<Text className="text-muted-foreground">
						Your personalized AI-generated suggestions and plans
					</Text>
				</Card>

				{error && (
					<Card variant="secondary" className="mb-6 p-4 border border-red-200">
						<Text className="text-red-600">Error: {error}</Text>
					</Card>
				)}

				{suggestions.length === 0 && !error && (
					<Card variant="secondary" className="mb-6 p-8 items-center">
						<Text className="text-4xl mb-4">🤖</Text>
						<Text className="text-muted-foreground text-center">
							No AI suggestions yet. Generate your first plan in the Plan Generator tab!
						</Text>
					</Card>
				)}

				{suggestions.map((suggestion) => (
					<Pressable 
						key={suggestion.id} 
						onPress={() => handleSuggestionPress(suggestion)}
						className="active:opacity-70"
					>
						<Card variant="secondary" className="mb-4 p-4">
							<View className="flex-row justify-between items-start mb-3">
								<View className="flex-row items-center flex-1">
									<Text className="text-2xl mr-2">{suggestion.displayInfo.icon}</Text>
									<View className="flex-1">
										<Text className="font-medium text-foreground" numberOfLines={1}>
											{suggestion.title}
										</Text>
										<Text className="text-xs text-muted-foreground">
											{suggestion.displayInfo.typeLabel} • {suggestion.displayInfo.relativeTime}
										</Text>
									</View>
								</View>
								<View 
									className={`px-2 py-1 rounded-full`}
									style={{ backgroundColor: suggestion.displayInfo.statusBadge.color }}
								>
									<Text className="text-xs font-medium text-gray-800">
										{suggestion.displayInfo.statusBadge.text}
									</Text>
								</View>
							</View>

							<View className="bg-surface/50 rounded-lg p-3 mb-3">
								<Text className="text-foreground text-sm leading-relaxed">
									{suggestion.displayInfo.contentPreview}
								</Text>
							</View>

							<View className="flex-row justify-between items-center">
								<Text className="text-xs text-muted-foreground">
									{suggestion.displayInfo.formattedDate}
								</Text>
								<View className="flex-row items-center">
									<Text className="text-xs text-accent mr-1">Tap to view details</Text>
									<Text className="text-xs text-accent">→</Text>
								</View>
							</View>
						</Card>
					</Pressable>
				))}
			</ScrollView>
		</Container>
	);
}
