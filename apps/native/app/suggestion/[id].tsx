import { View, Text, ScrollView } from "react-native";
import { Container } from "@/components/container";
import { Card, useThemeColor } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { formatSuggestions, type FormattedSuggestion } from "@/lib/suggestion-formatter";
import { orpc } from "@/utils/orpc";
import { useEffect, useState } from "react";

export default function SuggestionDetails() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	
	console.log("🔍 SuggestionDetails page loaded with ID:", id);
	const [suggestion, setSuggestion] = useState<FormattedSuggestion | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const surfaceColor = useThemeColor("surface");

	useEffect(() => {
		const fetchSuggestion = async () => {
			if (!id) {
				setError("No suggestion ID provided");
				setIsLoading(false);
				return;
			}

			try {
				console.log("🔍 Fetching suggestion details for ID:", id);
				
				// Fetch all suggestions and find the one we need
				const result = await orpc.AI.getSuggestions.call({
					limit: 100, // Get more to ensure we find the right one
				});
				
				// Type cast to handle effectivenessScore null vs undefined and Date to string
				const suggestionsWithTypes = (result.suggestions || []).map(s => ({
					...s,
					effectivenessScore: s.effectivenessScore || undefined,
					createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
					updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt
				}));
				
				const allSuggestions = formatSuggestions(suggestionsWithTypes);
				const foundSuggestion = allSuggestions.find(s => s.id === id);
				
				if (foundSuggestion) {
					console.log("✅ Found suggestion:", foundSuggestion.title);
					setSuggestion(foundSuggestion);
				} else {
					setError("Suggestion not found");
				}
			} catch (err) {
				console.error("❌ Error fetching suggestion:", err);
				setError(err instanceof Error ? err.message : "Failed to fetch suggestion");
			} finally {
				setIsLoading(false);
			}
		};

		fetchSuggestion();
	}, [id]);

	const renderStructuredContent = (content: string, type: string) => {
		if (type === "plan" && content.includes('📋 Monthly Plan')) {
			const lines = content.split('\n');
			return (
				<View>
					{lines.map((line, index) => {
						if (line.startsWith('📋')) {
							return (
								<Text key={index} className="text-lg font-bold text-foreground mb-3">
									{line}
								</Text>
							);
						} else if (line.startsWith('•')) {
							return (
								<Text key={index} className="text-foreground mb-2 ml-4 leading-relaxed">
									{line}
								</Text>
							);
						} else if (line.trim()) {
							return (
								<Text key={index} className="text-muted-foreground mb-1">
									{line}
								</Text>
							);
						}
						return null;
					})}
				</View>
			);
		}

		// For other content types, render as formatted text
		return (
			<Text className="text-foreground leading-relaxed">
				{content}
			</Text>
		);
	};

	const renderJSONContent = (content: any) => {
		try {
			const jsonString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
			const parsed = JSON.parse(jsonString);
			
			if (parsed.goals && Array.isArray(parsed.goals)) {
				return (
					<View>
						<Text className="text-lg font-bold text-foreground mb-4">📋 Monthly Plan</Text>
						{parsed.goals.map((goal: any, goalIndex: number) => (
							<View key={goalIndex} className="mb-6 p-4 bg-surface/50 rounded-lg">
								<Text className="text-base font-semibold text-foreground mb-2">
									{goal.title || `Goal ${goalIndex + 1}`}
								</Text>
								{goal.description && (
									<Text className="text-sm text-muted-foreground mb-3">
										{goal.description}
									</Text>
								)}
								{goal.category && (
									<View className="mb-3">
										<Text className="text-xs text-muted-foreground mb-1">Category:</Text>
										<Text className="text-sm text-foreground capitalize">{goal.category}</Text>
									</View>
								)}
								{goal.tasks && Array.isArray(goal.tasks) && goal.tasks.length > 0 && (
									<View>
										<Text className="text-sm font-medium text-foreground mb-2">
											Tasks ({goal.tasks.length}):
										</Text>
										{goal.tasks.map((task: any, taskIndex: number) => (
											<View key={taskIndex} className="mb-2 ml-4">
												<Text className="text-sm text-foreground">
													• {task.title || `Task ${taskIndex + 1}`}
												</Text>
												<View className="flex-row flex-wrap gap-2 mt-1">
													{task.priority && (
														<View className="bg-accent/20 px-2 py-1 rounded">
															<Text className="text-xs text-accent capitalize">
																{task.priority}
															</Text>
														</View>
													)}
													{task.dueDate && (
														<View className="bg-surface px-2 py-1 rounded">
															<Text className="text-xs text-muted-foreground">
																Due: {task.dueDate}
															</Text>
														</View>
													)}
												</View>
											</View>
										))}
									</View>
								)}
							</View>
						))}
					</View>
				);
			}
		} catch (err) {
			console.log("Failed to parse JSON content, rendering as text");
		}

		// Fallback to text rendering
		return (
			<Text className="text-foreground leading-relaxed font-mono text-xs">
				{typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
			</Text>
		);
	};

	if (isLoading) {
		return (
			<Container className="p-6">
				<View className="flex-1 justify-center items-center">
					<Text className="text-muted-foreground">Loading suggestion details...</Text>
				</View>
			</Container>
		);
	}

	if (error || !suggestion) {
		return (
			<Container className="p-6">
				<View className="flex-1 justify-center items-center">
					<Text className="text-red-600 text-center mb-4">
						{error || "Suggestion not found"}
					</Text>
					<Text 
						className="text-accent" 
						onPress={() => router.back()}
					>
						Go Back
					</Text>
				</View>
			</Container>
		);
	}

	return (
		<Container className="p-6">
			<ScrollView showsVerticalScrollIndicator={false}>
				<View className="mb-6">
					<View className="flex-row items-center mb-3">
						<Text className="text-3xl mr-3">{suggestion.displayInfo.icon}</Text>
						<View className="flex-1">
							<Text className="text-xl font-bold text-foreground mb-1">
								{suggestion.title}
							</Text>
							<Text className="text-sm text-muted-foreground">
								{suggestion.displayInfo.typeLabel}
							</Text>
						</View>
					</View>

					<View className="flex-row flex-wrap gap-2 mb-4">
						<View 
							className={`px-3 py-1 rounded-full`}
							style={{ backgroundColor: suggestion.displayInfo.statusBadge.color }}
						>
							<Text className="text-sm font-medium text-gray-800">
								{suggestion.displayInfo.statusBadge.text}
							</Text>
						</View>
						<View className="bg-surface px-3 py-1 rounded-full">
							<Text className="text-sm text-muted-foreground">
								{suggestion.displayInfo.relativeTime}
							</Text>
						</View>
					</View>
				</View>

				<Card variant="secondary" className="mb-6 p-4">
					<Card.Title className="mb-3">Content</Card.Title>
					{renderJSONContent(suggestion.content)}
				</Card>

				<Card variant="secondary" className="mb-6 p-4">
					<Card.Title className="mb-3">Details</Card.Title>
					<View className="space-y-3">
						<View className="flex-row justify-between items-center">
							<Text className="text-sm text-muted-foreground">ID:</Text>
							<Text className="text-sm text-foreground" numberOfLines={1}>
								{suggestion.id}
							</Text>
						</View>
						
						<View className="flex-row justify-between items-center">
							<Text className="text-sm text-muted-foreground">Created:</Text>
							<Text className="text-sm text-foreground">
								{suggestion.displayInfo.formattedDate}
							</Text>
						</View>
						
						{suggestion.metadata?.effectiveness && (
							<View className="flex-row justify-between items-center">
								<Text className="text-sm text-muted-foreground">Effectiveness:</Text>
								<Text className="text-sm text-foreground">
									{suggestion.metadata.effectiveness}/100
								</Text>
							</View>
						)}

						<View className="flex-row justify-between items-center">
							<Text className="text-sm text-muted-foreground">Type:</Text>
							<Text className="text-sm text-foreground capitalize">
								{suggestion.type}
							</Text>
						</View>

						<View className="flex-row justify-between items-center">
							<Text className="text-sm text-muted-foreground">Status:</Text>
							<Text className="text-sm text-foreground capitalize">
								{suggestion.status}
							</Text>
						</View>

						<View className="flex-row justify-between items-center">
							<Text className="text-sm text-muted-foreground">Applied:</Text>
							<Text className="text-sm text-foreground">
								{suggestion.isApplied ? "Yes" : "No"}
							</Text>
						</View>


					</View>
				</Card>

				{/* Raw content for debugging */}
				{process.env.NODE_ENV === 'development' && (
					<Card variant="secondary" className="mb-6 p-4">
						<Card.Title className="mb-3">Raw Content (Debug)</Card.Title>
						<Text className="text-foreground leading-relaxed font-mono text-xs">
							{JSON.stringify(suggestion.content, null, 2)}
						</Text>
					</Card>
				)}
			</ScrollView>
		</Container>
	);
}