import { Redirect, useLocalSearchParams } from "expo-router";

export default function SuggestionRedirect() {
	const { id } = useLocalSearchParams<{ id: string }>();
	// Redirect to new location
	return <Redirect href={`/suggestion/${id}`} />;
}