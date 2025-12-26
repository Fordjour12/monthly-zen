import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";

interface DraftRecoveryBannerProps {
  createdAt: string;
  expiresAt: string;
  onView: () => void;
  onDiscard: () => void;
  onDismiss?: () => void;
}

export function DraftRecoveryBanner({
  createdAt,
  expiresAt,
  onView,
  onDiscard,
  onDismiss,
}: DraftRecoveryBannerProps) {
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  const expiresIn = formatDistanceToNow(new Date(expiresAt), { addSuffix: false });

  return (
    <View className="relative overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/5 to-background rounded-xl p-4 mb-4">
      <View className="flex items-start gap-3 flex-row">
        <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
          <Ionicons name="sparkles" size={24} className="text-primary" />
        </View>

        <View className="flex-1 space-y-2">
          <View>
            <Text className="text-lg font-semibold tracking-tight text-foreground">
              Draft Recovered
            </Text>
            <Text className="text-sm text-foreground mt-1">
              Your unsaved plan from {timeAgo} is ready to continue
            </Text>
          </View>

          <View className="flex items-center gap-4 flex-row">
            <View className="flex items-center gap-1.5 flex-row">
              <Ionicons name="time-outline" size={14} className="text-foreground" />
              <Text className="text-xs text-foreground">Expires in {expiresIn}</Text>
            </View>
          </View>

          <View className="flex items-center gap-2 pt-2 flex-row">
            <TouchableOpacity onPress={onView} className="bg-primary px-4 py-2 rounded-lg">
              <Text className="text-primary-foreground text-sm font-medium flex items-center gap-2">
                <Ionicons name="sparkles" size={16} />
                View Draft
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDiscard}
              className="border border-destructive/20 px-4 py-2 rounded-lg"
            >
              <Text className="text-destructive text-sm font-medium">Discard</Text>
            </TouchableOpacity>
          </View>
        </View>

        {onDismiss && (
          <TouchableOpacity
            onPress={onDismiss}
            className="h-8 w-8 items-center justify-center rounded-full"
          >
            <Ionicons name="close" size={20} className="text-foreground" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
