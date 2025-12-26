import { View, Text } from "react-native";
import { Card } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";

interface ParsingStatusProps {
  isLoading: boolean;
  error?: string;
  confidence?: number;
  detectedFormat?: string;
}

export function ParsingStatus({
  isLoading,
  error,
  confidence,
  detectedFormat,
}: ParsingStatusProps) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <View className="space-y-4">
          <View className="flex items-center gap-3 flex-row">
            <Ionicons name="sync" size={20} className="animate-spin text-primary" />
            <Text className="font-semibold">Parsing AI Response</Text>
          </View>
          <Text className="text-sm text-foreground">
            Processing and structuring your personalized plan...
          </Text>
          <View className="h-2 bg-muted rounded-full overflow-hidden">
            <View className="h-full bg-primary w-[60%]" />
          </View>
          <View className="grid grid-cols-3 gap-4 text-xs text-foreground">
            <View className="flex items-center gap-2 flex-row">
              <View className="w-2 h-2 bg-green-500 rounded-full" />
              <Text>JSON Extraction</Text>
            </View>
            <View className="flex items-center gap-2 flex-row">
              <View className="w-2 h-2 bg-blue-500 rounded-full" />
              <Text>Pattern Matching</Text>
            </View>
            <View className="flex items-center gap-2 flex-row">
              <View className="w-2 h-2 bg-gray-300 rounded-full" />
              <Text>Validation</Text>
            </View>
          </View>
        </View>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border border-destructive/20">
        <View className="space-y-2">
          <View className="flex items-center gap-2 flex-row">
            <Ionicons name="alert-circle" size={20} className="text-destructive" />
            <Text className="font-semibold text-destructive">Parsing Failed</Text>
          </View>
          <Text className="text-sm text-foreground">{error}</Text>
          <Text className="text-sm text-foreground">
            You can try regenerating the plan or proceed with available data.
          </Text>
        </View>
      </Card>
    );
  }

  if (confidence && detectedFormat) {
    const getConfidenceColor = (conf: number) => {
      if (conf >= 80) return "bg-green-500/20 text-green-700 dark:text-green-300";
      if (conf >= 60) return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
      return "bg-red-500/20 text-red-700 dark:text-red-300";
    };

    return (
      <Card className="p-4">
        <View className="space-y-4">
          <View className="flex items-center gap-2 flex-row">
            <Ionicons
              name="checkmark-circle"
              size={20}
              className="text-green-600 dark:text-green-400"
            />
            <Text className="font-semibold">Parsing Complete</Text>
          </View>
          <Text className="text-sm text-foreground">
            AI response has been successfully processed and structured
          </Text>

          <View className="flex items-center justify-between flex-row">
            <View className="flex items-center gap-2 flex-row">
              <Ionicons name="checkmark-circle" size={16} className="text-foreground" />
              <Text className="text-sm font-medium">Confidence Score</Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${getConfidenceColor(confidence)}`}>
              <Text className="text-sm font-medium">{confidence}%</Text>
            </View>
          </View>

          <View className="flex items-center justify-between flex-row">
            <View className="flex items-center gap-2 flex-row">
              <Ionicons name="sparkles" size={16} className="text-foreground" />
              <Text className="text-sm font-medium">Detected Format</Text>
            </View>
            <View className="bg-blue-500/20 px-3 py-1 rounded-full">
              <Text className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {detectedFormat.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  }

  return null;
}
